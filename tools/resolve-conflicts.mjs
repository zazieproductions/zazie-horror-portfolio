#!/usr/bin/env node
/**
 * tools/resolve-conflicts.mjs
 * -----------------------------------------------------------------------------
 * Merge `--base` into the current branch and resolve the conflicts that are
 * build output, without ever guessing at a hand-written file.
 *
 * WHY THIS EXISTS
 *
 * `sitemap.xml`, `llms.txt`, `llms-full.txt`, `sw.js`, the hub HTML and the
 * hashed bundles are committed generated output (AGENTS.md), so two branches
 * that touch different sources still collide on the same generated lines and
 * the same `CACHE_NAME`. Re-solving those by hand is mechanical and error-prone:
 * the only correct answer is whatever `npm run build` writes from the merged
 * sources. Everything else belongs to a human, and the policy that draws that
 * line lives in tools/conflict-policy.mjs (tested in
 * tools/resolve-conflicts.test.mjs).
 *
 * HOW "IS THIS GENERATED?" IS PROVEN
 *
 * No filename allowlist: AGENTS.md says generated files are never hand-edited,
 * so the build is their only author, and a file is treated as generated only
 * when the build rewrites it.
 *
 *   1. Build at HEAD to record the checkout's existing drift (bundle hashes are
 *      not reproducible everywhere — docs/project/known-limitations.md #3 and
 *      #6). Only churn beyond that baseline is ever committed.
 *   2. Merge, seed every conflicting file with the base side, build. Files the
 *      build rewrites are generated output; the build's content wins.
 *   3. Files the build ignored are re-probed with the branch side, which
 *      separates "hand-authored" from "generated and already current".
 *   4. One more build proves the staged content is reproducible; anything that
 *      moves after being committed would be churn, so the run aborts instead.
 *
 * USAGE
 *
 *   node tools/resolve-conflicts.mjs --base origin/main --dry-run
 *   node tools/resolve-conflicts.mjs --base origin/main \
 *     --report "$RUNNER_TEMP/report.json" --comment "$RUNNER_TEMP/comment.md"
 *
 *   --base <ref>         branch to merge in (default: main)
 *   --dry-run            do everything except commit
 *   --merge-when-clean   also commit a conflict-free merge (default: off)
 *   --no-verify          skip the reproducibility build
 *   --no-comment         omit the Markdown comment body
 *   --report <file>      write a JSON summary
 *   --comment <file>     write the Markdown PR comment body
 *
 * Exit codes: 0 nothing to do or resolved, 2 needs a human, 1 environment or
 * repository error. No dependencies.
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ROOT,
  abortMerge,
  contentHash,
  git,
  gitText,
  markedFiles,
  mergeInProgress,
  restoreClean,
  runBuild,
  seedSide,
  snapshot,
  unmergedPaths,
} from './conflict-git.mjs';
import { isOffLimits, planCommit, renderComment } from './conflict-policy.mjs';

export * from './conflict-policy.mjs';

/* ------------------------------------------------------------------ options */

function readArgv() {
  const argv = process.argv.slice(2);
  const valueOf = (name, fallback = null) => {
    const index = argv.indexOf(`--${name}`);
    return index === -1 ? fallback : argv[index + 1] ?? fallback;
  };
  return {
    base: valueOf('base', 'main'),
    dryRun: argv.includes('--dry-run'),
    mergeWhenClean: argv.includes('--merge-when-clean'),
    verify: !argv.includes('--no-verify'),
    comment: !argv.includes('--no-comment'),
    reportFile: valueOf('report'),
    commentFile: valueOf('comment'),
  };
}

function resolveBaseRef(base) {
  const candidates = [base, `origin/${base}`, `refs/remotes/origin/${base}`];
  for (const candidate of candidates) {
    const probe = git(['rev-parse', '--verify', '--quiet', `${candidate}^{commit}`], { allowFail: true });
    if (probe.status === 0) return candidate;
  }
  throw new Error(`base ref "${base}" not found; fetch it first (git fetch origin ${base})`);
}

function describeRev(ref) {
  return {
    ref: ref.replace(/^origin\//, ''),
    sha: gitText(['rev-parse', ref]),
    shortSha: gitText(['rev-parse', '--short', ref]),
  };
}

/* ------------------------------------------------------------------- phases */

function prepare(options, report) {
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    throw new Error('node_modules is missing; run npm ci before resolving conflicts');
  }
  if (gitText(['status', '--porcelain=v1', '--untracked-files=all']) !== '') {
    throw new Error('working tree is dirty; the resolver needs a clean checkout');
  }
  report.base = describeRev(resolveBaseRef(options.base));
  report.head = {
    ref: gitText(['rev-parse', '--abbrev-ref', 'HEAD']),
    sha: gitText(['rev-parse', 'HEAD']),
  };
  const upToDate = git(['merge-base', '--is-ancestor', report.base.ref, 'HEAD'], { allowFail: true });
  if (upToDate.status === 0) {
    report.status = 'up-to-date';
    report.reason = `HEAD already contains ${report.base.ref}.`;
  }
  return report.status !== 'up-to-date';
}

/** First merge attempt. Clean merges end the run here, before any build. */
function trialMerge(options, report) {
  const merge = git(['merge', '--no-commit', '--no-ff', report.base.ref], { allowFail: true });
  const conflicts = unmergedPaths();
  if (merge.status === 0 && conflicts.length === 0) {
    if (!options.mergeWhenClean) {
      abortMerge();
      report.status = 'clean-merge-available';
      report.reason = `${report.head.ref} is behind ${report.base.ref} but merges cleanly; no conflict to resolve.`;
      return [];
    }
    report.status = 'merged-clean';
    report.commit = commitMerge(options.dryRun, report);
    if (!options.dryRun) restoreClean();
    return [];
  }
  if (conflicts.length === 0) {
    const detail = `${merge.stderr || ''}${merge.stdout || ''}`.trim();
    throw new Error(`git merge failed without unmerged paths:\n${detail}`);
  }
  abortMerge();
  return conflicts;
}

/** Build HEAD first: only churn beyond this baseline may be committed. */
function buildBaseline(report) {
  const build = runBuild();
  report.builds.push({ phase: 'baseline at HEAD', ok: build.ok, status: build.status });
  if (!build.ok) {
    report.status = 'build-failed';
    report.reason = 'HEAD does not build, so there is nothing trustworthy to merge against.';
    report.buildTail = build.tail;
    return null;
  }
  const baseline = snapshot();
  restoreClean();
  return baseline;
}

function probe(paths, side, report) {
  const before = new Map(paths.map((p) => [p, contentHash(p)]));
  const build = runBuild();
  report.builds.push({ phase: `${side === 'theirs' ? 'base' : 'branch'} probe`, ok: build.ok, status: build.status });
  if (!build.ok) {
    report.buildTail = build.tail;
    return null;
  }
  return paths.filter((p) => contentHash(p) !== before.get(p));
}

function manual(report, needsDecision, regenerable, reason) {
  abortMerge();
  report.status = 'manual';
  report.conflicts = [...needsDecision, ...regenerable];
  report.needsDecision = needsDecision;
  report.regenerable = regenerable;
  report.reason = reason;
}

/* ---------------------------------------------------------------- committing */

function commitMerge(dryRun, report) {
  if (dryRun) return null;
  const paths = report.staged.map((entry) => entry.path);
  for (let i = 0; i < paths.length; i += 100) git(['add', '-A', '--', ...paths.slice(i, i + 100)]);
  const conflicted = new Set(report.conflicts);
  const generated = report.staged.filter((entry) => conflicted.has(entry.path)).map((entry) => entry.path);
  const subject =
    report.status === 'merged-clean'
      ? `merge: bring in ${report.base.ref} (${report.base.shortSha})`
      : `merge: resolve ${generated.length} generated-file conflict${generated.length === 1 ? '' : 's'} against ${report.base.ref}`;
  const body = [
    `Base: ${report.base.ref} (${report.base.sha})`,
    `Conflicted build output regenerated by \`npm run build\`: ${generated.length}`,
    `Other regenerated files committed: ${report.staged.length - generated.length}`,
    `Pre-existing build drift left untouched: ${report.skipped.length}`,
    '',
    'Generated by .github/workflows/auto-resolve-conflicts.yml (tools/resolve-conflicts.mjs).',
    'No hand-authored file was auto-merged.',
  ].join('\n');
  git([
    '-c', 'user.name=github-actions[bot]',
    '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit', '-q', '-m', subject, '-m', body,
  ]);
  return { sha: gitText(['rev-parse', 'HEAD']), shortSha: gitText(['rev-parse', '--short', 'HEAD']), subject };
}

/* --------------------------------------------------------------------- main */

function createReport(options) {
  return {
    status: 'error',
    base: { ref: options.base.replace(/^origin\//, ''), sha: '', shortSha: '' },
    head: { ref: '', sha: '' },
    conflicts: [],
    staged: [],
    skipped: [],
    needsDecision: [],
    regenerable: [],
    builds: [],
    reason: '',
    buildTail: null,
    commit: null,
    dryRun: options.dryRun,
  };
}

function buildFailed(report, reason) {
  abortMerge();
  report.status = 'build-failed';
  report.reason = reason;
  return 2;
}

/** Seed, build, and keep only the conflicts the build rewrites. */
function regenerate(report, conflicts) {
  git(['merge', '--no-commit', '--no-ff', report.base.ref], { allowFail: true });
  if (!unmergedPaths().length) throw new Error('the merge stopped conflicting between two attempts; retry');

  seedSide('theirs', conflicts);
  let rewritten = probe(conflicts, 'theirs', report);
  if (!rewritten) {
    return buildFailed(report, 'The merged sources do not build, so their generated output cannot be trusted.');
  }
  const unresolved = conflicts.filter((p) => !rewritten.includes(p));
  if (unresolved.length) {
    const headRewritten = probe(unresolved, 'ours', report);
    if (!headRewritten) return buildFailed(report, 'Rebuilding with the branch side of the conflict failed.');
    rewritten = rewritten.concat(headRewritten);
  }

  const handwritten = conflicts.filter((p) => !rewritten.includes(p));
  if (!handwritten.length) return 0;
  manual(
    report,
    handwritten,
    conflicts.filter((p) => rewritten.includes(p)),
    'The build does not write these files, so they are hand-authored and a human has to merge them.',
  );
  return 2;
}

/** Rebuild and confirm nothing moves: a commit that rebuilds differently is churn. */
function verifyReproducible(report, conflicts) {
  const build = runBuild();
  report.builds.push({ phase: 'reproducibility', ok: build.ok, status: build.status });
  if (!build.ok) {
    report.buildTail = build.tail;
    return buildFailed(report, 'The rebuild of the resolved tree failed.');
  }
  const drifted = report.staged.filter((entry) => contentHash(entry.path) !== entry.hash);
  if (!drifted.length) return 0;
  manual(
    report,
    drifted.map((entry) => entry.path),
    conflicts.filter((p) => !drifted.some((entry) => entry.path === p)),
    'Rebuilding moved files that were about to be committed (bundle hashes are not reproducible in this environment — see docs/project/known-limitations.md). Nothing was committed.',
  );
  return 2;
}

function commitResolution(options, report, baseline, conflicts) {
  const { staged, skipped } = planCommit({ conflicts, baseline, after: snapshot() });
  report.staged = staged;
  report.skipped = skipped;

  const leftovers = conflicts.filter((p) => !staged.some((entry) => entry.path === p));
  if (leftovers.length) {
    manual(
      report,
      leftovers,
      conflicts.filter((p) => !leftovers.includes(p)),
      'These conflicted files would not have been regenerated, so they were left to a human.',
    );
    return 2;
  }
  const marked = markedFiles(conflicts);
  if (marked.length) {
    manual(
      report,
      marked,
      conflicts.filter((p) => !marked.includes(p)),
      'Conflict markers survived the rebuild, so the output is not trustworthy.',
    );
    return 2;
  }
  if (options.verify) {
    const code = verifyReproducible(report, conflicts);
    if (code !== 0) return code;
  }
  if (options.dryRun) {
    abortMerge();
    report.status = 'resolved';
    return 0;
  }
  report.status = 'resolved';
  report.commit = commitMerge(false, report);
  // The build left its own output in the tree; the commit is the deliverable,
  // so hand the checkout back clean.
  restoreClean();
  return 0;
}

function runResolution(options, report) {
  const conflicts = trialMerge(options, report);
  if (!conflicts.length) return report.status === 'error' ? 1 : 0;
  report.conflicts = conflicts;

  const baseline = buildBaseline(report);
  if (!baseline) return 2;

  // A hand-authored conflict is a decision, not a derivation: stop before
  // spending a build on it, but say which generated files are also involved.
  if (conflicts.some(isOffLimits)) {
    manual(
      report,
      conflicts.filter((p) => isOffLimits(p) || !baseline.has(p)),
      conflicts.filter((p) => !isOffLimits(p) && baseline.has(p)),
      'Hand-authored files conflict, and choosing between two edits is not a mechanical decision. Nothing was committed.',
    );
    return 2;
  }

  const regenerated = regenerate(report, conflicts);
  if (regenerated !== 0) return regenerated;
  return commitResolution(options, report, baseline, conflicts);
}

function main() {
  const options = readArgv();
  const report = createReport(options);
  let exitCode = 1;
  try {
    exitCode = prepare(options, report) ? runResolution(options, report) : 0;
  } catch (error) {
    if (mergeInProgress()) abortMerge();
    report.status = 'error';
    report.reason = error.message;
  }
  return finish(report, exitCode, options);
}

function finish(report, exitCode, options) {
  const postable = ['resolved', 'merged-clean', 'manual', 'build-failed', 'error'].includes(report.status);
  report.postComment = postable && !options.dryRun;
  if (options.commentFile && options.comment) fs.writeFileSync(options.commentFile, renderComment(report));
  if (options.reportFile) fs.writeFileSync(options.reportFile, `${JSON.stringify(report, null, 2)}\n`);

  const summary = `resolve-conflicts: ${report.status}${report.reason ? ` — ${report.reason}` : ''}`;
  console.log(summary);
  for (const entry of report.staged) console.log(`  staged   ${entry.path} (${entry.reason})`);
  for (const entry of report.skipped.slice(0, 12)) console.log(`  skipped  ${entry.path} (${entry.reason})`);
  if (report.skipped.length > 12) console.log(`  skipped  ... ${report.skipped.length - 12} more`);
  if (report.commit) console.log(`  commit   ${report.commit.shortSha} ${report.commit.subject}`);
  if (report.buildTail && ['build-failed', 'error'].includes(report.status)) {
    console.log(report.buildTail.slice(-15).join('\n'));
  }
  process.exit(exitCode);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
