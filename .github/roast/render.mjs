import { HEAT_PROFILES, normalizeHeat } from './diff.mjs';

export const COMMENT_MARKER = '<!-- pr-roast-comment -->';

export const CATEGORIES = Object.freeze([
  { key: 'security', title: 'Security' },
  { key: 'architecture', title: 'Architecture' },
  { key: 'bugs', title: 'Bugs' },
  { key: 'performance', title: 'Performance' },
  { key: 'dependencies', title: 'Dependencies' },
  { key: 'codeQuality', title: 'Code Quality' },
]);

const SEVERITY_ORDER = Object.freeze({ high: 0, medium: 1, low: 2 });
const SEVERITY_BADGE = Object.freeze({
  high: '🔴 **high**',
  medium: '🟡 **medium**',
  low: '🔵 **low**',
});

export function scoreToGrade(rawScore) {
  const score = clampScore(rawScore);
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
}

function clampScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 75;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function sanitizeInline(value, maxLen = 280) {
  const cleaned = String(value === undefined || value === null ? '' : value)
    .replace(/<!--|-->/g, '')
    .replace(/<\/?(?:script|iframe|object|embed|details|summary|style|link|meta)[^>]*>/gi, '')
    .replace(/\[([^\]]+)\]\((?:https?:|javascript:|data:)[^)]*\)/gi, '$1')
    .replace(/https?:\/\/\S+/gi, '[link-removed]')
    .replace(/[\r\n|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, maxLen);
}

function sanitizeCodeSnippet(value, maxLen = 1400) {
  const cleaned = String(value === undefined || value === null ? '' : value)
    .replace(/<!--|-->/g, '')
    .replace(/<\/details>/gi, '<\\/details>')
    .replace(/```+/g, '~~~')
    .trim();
  return cleaned.slice(0, maxLen);
}

export function extractJsonObject(rawText) {
  const text = String(rawText === undefined || rawText === null ? '' : rawText).trim();
  if (!text) {
    return { ok: false, error: 'Model returned an empty response.' };
  }

  const candidates = [text];
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fenced && fenced[1]) {
    candidates.unshift(fenced[1].trim());
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }

  let lastError = 'No JSON object found in model output.';
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ok: true, value: parsed };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  return { ok: false, error: lastError };
}

function normalizeCategories(rawCategories) {
  const source =
    rawCategories && typeof rawCategories === 'object' && !Array.isArray(rawCategories)
      ? rawCategories
      : null;
  const result = {};
  for (const cat of CATEGORIES) {
    const entry = source && typeof source[cat.key] === 'object' ? source[cat.key] : null;
    const score = entry ? clampScore(entry.score) : 85;
    const rawLabel = entry ? sanitizeInline(entry.label, 48) : '';
    result[cat.key] = {
      score,
      label: rawLabel || defaultCategoryLabel(score),
    };
  }
  return result;
}

function defaultCategoryLabel(score) {
  if (score >= 93) return 'Suspiciously clean';
  if (score >= 83) return 'Solid footing';
  if (score >= 70) return 'Needs seasoning';
  return 'actively smoking';
}

function normalizeFilePath(rawFile) {
  return String(rawFile === undefined || rawFile === null ? '' : rawFile)
    .trim()
    .replace(/^(?:[ab]\/|\.\/)+/, '');
}

function normalizeIssues(rawIssues, allowedSet) {
  if (!Array.isArray(rawIssues)) return { issues: [], droppedCount: 0 };
  const issues = [];
  let droppedCount = 0;
  const validCategories = new Set(CATEGORIES.map((c) => c.key));

  for (const item of rawIssues.slice(0, 20)) {
    if (!item || typeof item !== 'object') continue;
    const file = normalizeFilePath(item.file);
    if (!file || (allowedSet.size > 0 && !allowedSet.has(file))) {
      droppedCount += 1;
      continue;
    }
    const sevRaw = String(item.severity || 'low').trim().toLowerCase();
    const severity = Object.hasOwn(SEVERITY_ORDER, sevRaw) ? sevRaw : 'low';
    const catRaw = String(item.category || 'codeQuality').trim();
    const category = validCategories.has(catRaw) ? catRaw : 'codeQuality';
    const lineNum = Number.parseInt(String(item.line), 10);
    const title = sanitizeInline(item.title, 120);
    if (!title) continue;

    issues.push({
      severity,
      category,
      file,
      line: Number.isFinite(lineNum) && lineNum > 0 ? lineNum : null,
      title,
      burn: sanitizeInline(item.burn, 240),
      explanation: sanitizeInline(item.explanation, 360),
      fix: sanitizeCodeSnippet(item.fix, 1400),
    });
  }

  issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return { issues: issues.slice(0, 10), droppedCount };
}

function normalizeStringList(rawList, maxItems, maxLen) {
  if (!Array.isArray(rawList)) return [];
  const out = [];
  for (const entry of rawList) {
    const clean = sanitizeInline(entry, maxLen);
    if (clean) out.push(clean);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function normalizeRoastReport(rawReport, meta) {
  const changedList = meta && Array.isArray(meta.changedFiles) ? meta.changedFiles : [];
  const allowedSet = new Set(changedList.map((f) => normalizeFilePath(f)));
  const categories = normalizeCategories(rawReport ? rawReport.categories : null);
  const { issues, droppedCount } = normalizeIssues(rawReport ? rawReport.issues : null, allowedSet);

  const totalCategoryScore = CATEGORIES.reduce((sum, cat) => sum + categories[cat.key].score, 0);
  let overallScore = Math.round(totalCategoryScore / CATEGORIES.length);

  const highCritCount = issues.filter(
    (issue) => issue.severity === 'high' && (issue.category === 'security' || issue.category === 'bugs'),
  ).length;
  const totalHighCount = issues.filter((issue) => issue.severity === 'high').length;

  if (highCritCount >= 1 && overallScore > 82) overallScore = 82;
  if (totalHighCount >= 3 && overallScore > 69) overallScore = 69;

  const grade = scoreToGrade(overallScore);
  const verdict =
    sanitizeInline(rawReport ? rawReport.verdict : '', 240) ||
    'Reviewed every changed line; here is where the heat landed.';
  const topBurns = normalizeStringList(rawReport ? rawReport.topBurns : null, 4, 240);
  const arcSource =
    rawReport && rawReport.redemptionArc && typeof rawReport.redemptionArc === 'object'
      ? rawReport.redemptionArc
      : null;

  return {
    grade,
    overallScore,
    verdict,
    categories,
    topBurns,
    issues,
    droppedUnverifiedIssues: droppedCount,
    redemptionArc: {
      whatWentRight: normalizeStringList(arcSource ? arcSource.whatWentRight : null, 4, 220),
      roadmap: normalizeStringList(arcSource ? arcSource.roadmap : null, 4, 220),
    },
  };
}

function renderIssueBlock(issue) {
  const badge = SEVERITY_BADGE[issue.severity];
  const loc = issue.line ? `\`${issue.file}\` (line ${issue.line})` : `\`${issue.file}\``;
  const lines = [`${badge} · **${issue.title}** _(${issue.category})_`, `${loc}`];
  if (issue.burn) lines.push(`> 🔥 _"${issue.burn}"_`);
  if (issue.explanation) lines.push('', issue.explanation);
  if (issue.fix) {
    lines.push('', '<details>', '<summary>Suggested fix</summary>', '', '```', issue.fix, '```', '</details>');
  }
  return lines.join('\n');
}

function renderFooter(context) {
  const heat = normalizeHeat(context.heat);
  const badge = HEAT_PROFILES[heat].badge;
  const parts = [`Heat: ${badge}`];
  if (Number.isFinite(context.filesAnalyzed)) {
    parts.push(`${context.filesAnalyzed} file(s) analyzed`);
  }
  if (context.model) {
    parts.push(`Model: \`${sanitizeInline(context.model, 60)}\``);
  }
  if (context.headSha) {
    parts.push(`Commit: \`${sanitizeInline(String(context.headSha).slice(0, 7), 12)}\``);
  }
  return `<sub>🔥 Automated PR Roast · ${parts.join(' · ')}</sub>`;
}

export function renderRoastMarkdown(report, context = {}) {
  const lines = [
    COMMENT_MARKER,
    '## 🔥 RoastMyCode PR Review',
    '',
    `**Grade: ${report.grade}** (${report.overallScore}/100) — _"${report.verdict}"_`,
    '',
    '### Score Breakdown',
    '',
    '| Category | Score | Verdict |',
    '| --- | :---: | --- |',
  ];

  for (const cat of CATEGORIES) {
    const entry = report.categories[cat.key];
    lines.push(`| **${cat.title}** | ${entry.score}/100 | _"${entry.label}"_ |`);
  }

  if (report.topBurns.length > 0) {
    lines.push('', '### Top Burns');
    for (const burn of report.topBurns) {
      lines.push(`- ${burn}`);
    }
  }

  lines.push('', `### Issues Found (${report.issues.length})`);
  if (report.issues.length === 0) {
    lines.push('', 'No verified code issues in this diff. Even the bug hunter left empty-handed.');
  } else {
    for (const issue of report.issues) {
      lines.push('', renderIssueBlock(issue));
    }
  }

  const { whatWentRight, roadmap } = report.redemptionArc;
  if (whatWentRight.length > 0 || roadmap.length > 0) {
    lines.push('', '### Redemption Arc');
    for (const win of whatWentRight) {
      lines.push(`- ✅ **What worked:** ${win}`);
    }
    for (const step of roadmap) {
      lines.push(`- 🛠️ **Next up:** ${step}`);
    }
  }

  lines.push('', '---', renderFooter(context));
  return `${lines.join('\n')}\n`;
}

export function renderSkippedMarkdown(reason, context = {}) {
  return [
    COMMENT_MARKER,
    '## 🔥 RoastMyCode PR Review',
    '',
    `_${sanitizeInline(reason, 260)}_`,
    '',
    '---',
    renderFooter(context),
    '',
  ].join('\n');
}
