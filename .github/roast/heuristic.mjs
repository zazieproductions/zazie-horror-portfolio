import { CATEGORIES, normalizeRoastReport } from './render.mjs';

const PENALTY_BY_SEVERITY = Object.freeze({ high: 18, medium: 9, low: 4 });

const CLEAN_VERDICTS = Object.freeze({
  gentle: 'Tidy, well-scoped diff with zero verified hazards — the bug hunter barely warmed its hands.',
  'medium-rare':
    'We poked every changed line looking for smoke and came back with clean hands and mild professional jealousy.',
  inferno:
    'Brought a flamethrower to roast this diff and found nothing combustible — suspiciously disciplined work.',
  nuclear:
    'Full hazmat inspection complete: zero bugs, zero slop, and our Geiger counter is filing for unemployment.',
});

const ISSUE_VERDICTS = Object.freeze({
  gentle: 'Solid direction overall, with a few spots that will thank you for a quick polish.',
  'medium-rare': 'Good bones in this diff, plus a couple of spicy corners begging for a cleanup pass.',
  inferno: 'Found real smoke in the diff — grab the tongs and patch the flagged lines before shipping.',
  nuclear: 'Sound the kitchen alarm: real hazards landed in this diff, and every single one has a fix below.',
});

const CODE_LINE_RULES = Object.freeze([
  {
    pattern: /\beval\s*\(|\bnew\s+Function\s*\(/,
    severity: 'high',
    category: 'security',
    title: 'Dynamic code execution via eval/Function',
    burn: 'Calling eval() in 2026 is propping the studio door open with a brick and calling it keyless entry.',
    explanation: 'Dynamic evaluation defeats static analysis, violates strict CSP, and enables code injection.',
    fix: '// Replace dynamic evaluation with JSON.parse() or an explicit handler map.',
  },
  {
    pattern: /\.(?:innerHTML|outerHTML)\s*=/,
    severity: 'high',
    category: 'security',
    title: 'Direct innerHTML/outerHTML assignment',
    burn: 'Assigning straight to innerHTML invites every stray string to redecorate your DOM.',
    explanation: 'Unsanitized HTML strings create DOM XSS sinks and fail the repository security gate.',
    fix: 'element.textContent = value;',
  },
  {
    pattern: /catch\s*(?:\([^)]*\))?\s*\{\s*\}/,
    severity: 'high',
    category: 'bugs',
    title: 'Empty catch block swallows runtime failures',
    burn: 'An empty catch {} is the sound of an exception being quietly buried behind the barn.',
    explanation: 'Swallowed exceptions hide broken assumptions and fail the aislop quality gate.',
    fix: 'catch (err) {\n  console.error("Operation failed:", err);\n  throw err;\n}',
  },
  {
    rawText: true,
    pattern: /(?:ghp_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/,
    severity: 'high',
    category: 'security',
    title: 'Credential-shaped literal detected in diff',
    burn: 'Committing something shaped like a live key is how a portfolio speedruns a security advisory.',
    explanation: 'Secrets committed to git history remain exposed even if removed in a later commit.',
    fix: '// Rotate the credential immediately and read it from process.env / GitHub Secrets.',
  },
  {
    tsOnly: true,
    pattern: /(?::\s*any\b|\bas\s+any\b|@ts-ignore\b)/,
    severity: 'medium',
    category: 'codeQuality',
    title: 'TypeScript type-safety escape hatch (`any` / `@ts-ignore`)',
    burn: 'Using `any` in TypeScript is buying a smoke detector and pulling the battery because it beeped.',
    explanation: 'Type escape hatches disable compiler checks across downstream callers.',
    fix: '// Prefer `unknown` with explicit type narrowing or a dedicated interface.',
  },
  {
    clientOnly: true,
    pattern: /\b(?:console\.(?:log|debug)|debugger)\b/,
    severity: 'low',
    category: 'codeQuality',
    title: 'Debug logging left in client-facing source',
    burn: 'Leaving console.log in shipped UI code turns every visitor’s DevTools into your scratchpad.',
    explanation: 'Debug statements add noise in production browsers and trigger lint warnings.',
    fix: '// Remove debug logging before shipping.',
  },
]);

function recordIssue(issues, file, line, spec) {
  issues.push({
    severity: spec.severity,
    category: spec.category,
    file,
    line,
    title: spec.title,
    burn: spec.burn,
    explanation: spec.explanation,
    fix: spec.fix,
  });
}

export function extractAddedLines(rawPatch) {
  const added = [];
  let newLine = 0;
  let inHunk = false;

  for (const line of String(rawPatch || '').split(/\r?\n/)) {
    const hunkMatch = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunkMatch) {
      newLine = Number.parseInt(hunkMatch[1], 10);
      inHunk = true;
      continue;
    }
    if (!inHunk || line.startsWith('--- ') || line.startsWith('+++ ')) continue;
    if (line.startsWith('+')) {
      added.push({ line: newLine, text: line.slice(1) });
      newLine += 1;
    } else if (line.startsWith(' ')) {
      newLine += 1;
    }
  }
  return added;
}

const TEMPLATE_INJECTION_SPEC = Object.freeze({
  severity: 'high',
  category: 'security',
  title: 'GitHub expression interpolated inside shell run block',
  burn: 'Interpolating ${{ }} straight into bash is handing untrusted PR metadata a shell prompt and a megaphone.',
  explanation: 'Untrusted event fields expanded before bash parses the script allow command injection.',
  fix: 'env:\n  SAFE_VALUE: ${{ github.event.pull_request.title }}\nrun: printf "%s\\n" "$SAFE_VALUE"',
});

function scanWorkflowAddedLines(filePath, addedLines, issues) {
  let inRunBlock = false;
  let runIndent = 0;

  for (const { line, text } of addedLines) {
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = text.search(/\S/);
    if (inRunBlock && indent <= runIndent) inRunBlock = false;

    const usesMatch = /^uses:\s*([^\s#]+)/.exec(trimmed);
    if (usesMatch && /@(?:main|master|HEAD)$/i.test(usesMatch[1])) {
      recordIssue(issues, filePath, line, {
        severity: 'medium',
        category: 'dependencies',
        title: 'Unpinned GitHub Action tracking a mutable branch',
        burn: 'Pinning a workflow action to a floating branch is trusting a stranger’s midnight push with your CI runner.',
        explanation: 'Mutable branch refs can change behavior or introduce supply-chain risk without review.',
        fix: `# Pin ${usesMatch[1].split('@')[0]} to an immutable release tag or commit SHA`,
      });
    }

    const runMatch = /^(?:-\s+)?run:\s*(.*)$/.exec(trimmed);
    if (runMatch) {
      const rest = runMatch[1].trim();
      if (rest === '|' || rest === '>-' || rest === '>') {
        inRunBlock = true;
        runIndent = text.indexOf('run:');
      } else if (rest.includes('${{')) {
        recordIssue(issues, filePath, line, TEMPLATE_INJECTION_SPEC);
      }
      continue;
    }
    if (inRunBlock && text.includes('${{')) {
      recordIssue(issues, filePath, line, TEMPLATE_INJECTION_SPEC);
    }
  }
}

function stripStringLiterals(line) {
  return line
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/\/\/.*$/, '');
}

function scanCodeAddedLines(filePath, addedLines, issues) {
  if (/\.test\.[mc]?[jt]sx?$/.test(filePath)) return;
  const isTs = /\.(?:ts|tsx)$/.test(filePath);
  const isClient = /^(?:src|home-src|store-src|legal-src)\//.test(filePath);

  for (const { line, text } of addedLines) {
    const trimmed = text.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      if (/^(?:\/\/|#|\*)\s*(?:TODO|FIXME|HACK|XXX)\b/.test(trimmed)) {
        recordIssue(issues, filePath, line, {
          severity: 'low',
          category: 'codeQuality',
          title: 'Deferred TODO/FIXME marker in new code',
          burn: 'A TODO committed to main is technical debt that just signed a twelve-month lease.',
          explanation: 'Deferred inline markers tend to outlive the context needed to resolve them safely.',
          fix: '// Resolve the work directly or open a tracked issue before merging.',
        });
      }
      continue;
    }

    const codeOnly = stripStringLiterals(text);
    for (const rule of CODE_LINE_RULES) {
      if (rule.tsOnly && !isTs) continue;
      if (rule.clientOnly && !isClient) continue;
      const target = rule.rawText ? text : codeOnly;
      if (rule.pattern.test(target)) {
        recordIssue(issues, filePath, line, rule);
      }
    }
  }
}

function scanMarkupAddedLines(filePath, addedLines, issues) {
  for (const { line, text } of addedLines) {
    if (/<a\b[^>]*target=["']_blank["'][^>]*>/i.test(text) && !/\brel=["'][^"']*noopener/i.test(text)) {
      recordIssue(issues, filePath, line, {
        severity: 'medium',
        category: 'security',
        title: 'External target="_blank" link missing rel="noopener"',
        burn: 'Opening a new tab without rel="noopener" hands out window.opener and trips external-links.test.mjs.',
        explanation: 'New-tab anchors must include rel="noopener" per repository security tests.',
        fix: '<a href="..." target="_blank" rel="noopener noreferrer">',
      });
    }
    if (/<img\b[^>]*>/i.test(text) && (!/\bwidth=/i.test(text) || !/\bheight=/i.test(text))) {
      recordIssue(issues, filePath, line, {
        severity: 'medium',
        category: 'performance',
        title: 'Image tag missing explicit width/height attributes',
        burn: 'An <img> without intrinsic dimensions makes the layout jump like a cheap jump-scare.',
        explanation: 'Explicit width and height prevent Cumulative Layout Shift (CLS) while media loads.',
        fix: '<img src="..." alt="..." width="640" height="360" loading="lazy">',
      });
    }
  }
}

function scanRepoGuardrails(entries, patchesByPath, issues) {
  const paths = new Set(entries.map((e) => e.path));
  const touchedSources = entries.some((e) => /^(?:src|scripts)\//.test(e.path));

  if (paths.has('_headers') !== paths.has('tools/headers.mjs')) {
    const file = paths.has('_headers') ? '_headers' : 'tools/headers.mjs';
    recordIssue(issues, file, 1, {
      severity: 'high',
      category: 'architecture',
      title: 'Header policy edited in only one of `_headers` / `tools/headers.mjs`',
      burn: 'Updating half of the header twin pair guarantees `npm run check:headers` will blow the whistle.',
      explanation: 'Edge `_headers` and local `tools/headers.mjs` must stay in lockstep.',
      fix: '# Update both _headers and tools/headers.mjs, then run: npm run check:headers',
    });
  }

  const orphanItemPage = entries.find((e) => e.tier === 'secondary');
  if (orphanItemPage && !touchedSources) {
    recordIssue(issues, orphanItemPage.path, 1, {
      severity: 'medium',
      category: 'architecture',
      title: 'Prerendered item HTML modified without `src/` or `scripts/` changes',
      burn: 'Hand-editing generated item HTML is sculpting sand at low tide — `npm run build` overwrites every byte.',
      explanation: 'Item routes are generated from `src/data/` and `src/lib/` by `scripts/prerender.mjs`.',
      fix: '# Move content edits to src/data/* or markup edits to src/lib/*, then run npm run build.',
    });
  }

  if (paths.has('package.json')) {
    const pkgAdded = extractAddedLines(patchesByPath.get('package.json') || '');
    const depLine = pkgAdded.find((item) => /"dependencies"\s*:/.test(item.text));
    if (depLine) {
      recordIssue(issues, 'package.json', depLine.line, {
        severity: 'high',
        category: 'dependencies',
        title: 'Runtime npm `dependencies` block introduced',
        burn: 'Adding runtime npm dependencies to a zero-dependency static site breaks both the bundle budget and the `/privacy` pledge.',
        explanation: 'This repository ships zero runtime dependencies; build tools belong in `devDependencies`.',
        fix: '"devDependencies": { /* build-time tooling only */ }',
      });
    }
  }
}

function buildPositiveSignals(entries, patchesByPath, issues) {
  const wins = [];
  const hasTests = entries.some((e) => /\.test\.[mc]?[jt]sx?$/.test(e.path));
  const hasWorkflows = entries.some((e) => /^\.github\/workflows\/.+\.ya?ml$/.test(e.path));
  const hasDocs = entries.some((e) => /\.md$/i.test(e.path));
  const maxAddedInOneFile = entries.reduce((max, entry) => {
    if (entry.tier !== 'source') return max;
    const count = extractAddedLines(patchesByPath.get(entry.path) || '').length;
    return Math.max(max, count);
  }, 0);

  if (hasTests) {
    wins.push('Included automated test coverage in the same pull request as the change.');
  }
  if (hasWorkflows && !issues.some((i) => i.title.includes('interpolated inside shell'))) {
    wins.push('Kept GitHub Actions shell steps free of inline `${{ }}` template injection.');
  }
  if (maxAddedInOneFile > 0 && maxAddedInOneFile <= 350) {
    wins.push(`Kept per-file additions modular (largest source file diff: ${maxAddedInOneFile} added line(s)).`);
  }
  if (hasDocs) {
    wins.push('Updated repository documentation alongside the implementation.');
  }
  if (wins.length === 0) {
    wins.push('Scoped the diff cleanly without introducing runtime dependencies.');
  }
  return wins.slice(0, 4);
}

export function buildDeterministicRoast({ entries, patchesByPath, meta }) {
  const issues = [];

  for (const entry of entries) {
    if (entry.tier === 'generated' || entry.status === 'D') continue;
    const added = extractAddedLines(patchesByPath.get(entry.path) || '');
    if (added.length === 0) continue;

    if (/^\.github\/workflows\/.+\.ya?ml$/.test(entry.path)) {
      scanWorkflowAddedLines(entry.path, added, issues);
    } else if (/\.[mc]?[jt]sx?$/.test(entry.path)) {
      scanCodeAddedLines(entry.path, added, issues);
    } else if (/\.html$/i.test(entry.path)) {
      scanMarkupAddedLines(entry.path, added, issues);
    }

    if (entry.tier === 'source' && !/\.md$/i.test(entry.path) && added.length > 400) {
      recordIssue(issues, entry.path, added[0].line, {
        severity: 'low',
        category: 'architecture',
        title: `Large single-file addition (${added.length} lines)`,
        burn: `Dropping ${added.length} new lines into \`${entry.path}\` puts it one refactor away from needing its own ZIP code.`,
        explanation: 'Files approaching 400+ lines trigger aislop complexity warnings and become harder to review.',
        fix: '// Split distinct responsibilities into smaller focused modules.',
      });
    }
  }

  scanRepoGuardrails(entries, patchesByPath, issues);

  const rawCategories = {};
  for (const cat of CATEGORIES) {
    const catIssues = issues.filter((i) => i.category === cat.key);
    const penalty = catIssues.reduce((sum, i) => sum + (PENALTY_BY_SEVERITY[i.severity] || 4), 0);
    rawCategories[cat.key] = {
      score: Math.max(35, 97 - penalty),
      label: catIssues.length === 0 ? cleanLabelFor(cat.key) : `${catIssues.length} finding(s) flagged`,
    };
  }

  const heat = meta && meta.heat ? meta.heat : 'medium-rare';
  const verdict =
    issues.length === 0
      ? CLEAN_VERDICTS[heat] || CLEAN_VERDICTS['medium-rare']
      : ISSUE_VERDICTS[heat] || ISSUE_VERDICTS['medium-rare'];
  const scannedCount = Number.isFinite(meta.reviewableFileCount)
    ? meta.reviewableFileCount
    : meta.includedFiles.length;
  const topBurns =
    issues.length > 0
      ? issues.slice(0, 4).map((i) => i.burn)
      : [
          `Scanned ${scannedCount} reviewable file(s) and found zero slop — either this PR was crafted with surgical discipline or the bugs are wearing camouflage.`,
          'Zero runtime dependencies added, zero swallowed exceptions, and zero shell-interpolated workflow expressions.',
        ];
  const roadmap = issues
    .slice(0, 3)
    .map((i) => `Fix **${i.title}** in \`${i.file}\`${i.line ? ` (line ${i.line})` : ''}.`);

  return normalizeRoastReport(
    {
      verdict,
      categories: rawCategories,
      topBurns,
      issues,
      redemptionArc: {
        whatWentRight: buildPositiveSignals(entries, patchesByPath, issues),
        roadmap,
      },
    },
    meta,
  );
}

function cleanLabelFor(categoryKey) {
  const labels = {
    security: 'Fort Knox posture',
    architecture: 'Modular and clean',
    bugs: 'Bug hunter went hungry',
    performance: 'Lean static path',
    dependencies: 'Zero bloat added',
    codeQuality: 'Crisp craftsmanship',
  };
  return labels[categoryKey] || 'Clean pass';
}
