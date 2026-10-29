#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPromptBundle, parseNameStatus } from './diff.mjs';
import {
  extractJsonObject,
  normalizeRoastReport,
  renderRoastMarkdown,
  renderSkippedMarkdown,
} from './render.mjs';

const SAFE_REF_RE = /^[A-Za-z0-9._/-]{1,128}$/;

function assertSafeRef(refValue, label) {
  const value = String(refValue === undefined || refValue === null ? '' : refValue).trim();
  if (!value || value.startsWith('-') || value.includes('..') || !SAFE_REF_RE.test(value)) {
    throw new Error(`Invalid git ref for ${label}: ${JSON.stringify(value)}`);
  }
  return value;
}

function runGit(repoDir, args) {
  return execFileSync('git', args, {
    cwd: repoDir,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

function resolveDiffRange(repoDir, baseRef, headRef) {
  try {
    const mergeBase = runGit(repoDir, ['merge-base', baseRef, headRef]).trim();
    if (mergeBase) return { fromRef: mergeBase, toRef: headRef };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    process.stderr.write(`merge-base unavailable (${detail.split('\n')[0]}), using direct two-tree diff.\n`);
  }
  return { fromRef: baseRef, toRef: headRef };
}

export function runPrepare(env = process.env) {
  const repoDir = path.resolve(env.REPO_DIR || process.cwd());
  const baseRef = assertSafeRef(env.BASE_SHA, 'BASE_SHA');
  const headRef = assertSafeRef(env.HEAD_SHA, 'HEAD_SHA');
  const systemFile = path.resolve(env.OUT_SYSTEM_FILE || 'roast-system.txt');
  const promptFile = path.resolve(env.OUT_PROMPT_FILE || 'roast-prompt.txt');
  const metaFile = path.resolve(env.OUT_META_FILE || 'roast-meta.json');
  const maxChars = env.MAX_PROMPT_CHARS ? Number.parseInt(env.MAX_PROMPT_CHARS, 10) : 18000;

  const { fromRef, toRef } = resolveDiffRange(repoDir, baseRef, headRef);
  const nameStatusRaw = runGit(repoDir, ['diff', '--name-status', '-M', fromRef, toRef]);
  const entries = parseNameStatus(nameStatusRaw);

  const patchesByPath = new Map();
  for (const entry of entries) {
    if (entry.tier === 'generated') continue;
    const patch = runGit(repoDir, ['diff', '--unified=3', fromRef, toRef, '--', entry.path]);
    patchesByPath.set(entry.path, patch);
  }

  const bundle = buildPromptBundle({
    entries,
    patchesByPath,
    prTitle: env.PR_TITLE || '',
    prBody: env.PR_BODY || '',
    heat: env.HEAT_LEVEL || 'medium-rare',
    maxChars,
  });

  fs.writeFileSync(systemFile, bundle.systemPrompt, 'utf8');
  fs.writeFileSync(promptFile, bundle.userPrompt, 'utf8');
  fs.writeFileSync(metaFile, JSON.stringify(bundle.meta, null, 2), 'utf8');

  if (env.GITHUB_OUTPUT) {
    fs.appendFileSync(env.GITHUB_OUTPUT, `skip_inference=${bundle.meta.skipInference}\n`, 'utf8');
  }
  process.stdout.write(
    `prepared roast prompt: ${bundle.meta.includedFiles.length}/${bundle.meta.totalChangedFiles} file(s), skip=${bundle.meta.skipInference}\n`,
  );
  return bundle;
}

export function runRender(env = process.env) {
  const metaFile = path.resolve(env.META_FILE || 'roast-meta.json');
  const outMarkdownFile = path.resolve(env.OUT_MARKDOWN_FILE || 'roast-comment.md');
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

  const context = {
    heat: meta.heat,
    filesAnalyzed: Array.isArray(meta.includedFiles) ? meta.includedFiles.length : 0,
    model: env.MODEL_NAME || 'openai/gpt-4o',
    headSha: env.HEAD_SHA || '',
  };

  if (meta.skipInference) {
    const reason =
      meta.totalChangedFiles === 0
        ? 'No changed files between the base and head commits.'
        : 'Only generated bundles or binary media changed in this pull request; no hand-authored source diff to roast.';
    const md = renderSkippedMarkdown(reason, context);
    fs.writeFileSync(outMarkdownFile, md, 'utf8');
    return md;
  }

  let rawResponse = env.MODEL_RESPONSE || '';
  if (env.RESPONSE_FILE && fs.existsSync(env.RESPONSE_FILE)) {
    rawResponse = fs.readFileSync(env.RESPONSE_FILE, 'utf8');
  }

  const extracted = extractJsonObject(rawResponse);
  if (!extracted.ok) {
    const md = renderSkippedMarkdown(
      `Roast model output could not be parsed as JSON (${extracted.error}). Re-run the workflow to retry.`,
      context,
    );
    fs.writeFileSync(outMarkdownFile, md, 'utf8');
    return md;
  }

  const report = normalizeRoastReport(extracted.value, meta);
  const md = renderRoastMarkdown(report, context);
  fs.writeFileSync(outMarkdownFile, md, 'utf8');
  process.stdout.write(
    `rendered roast report: grade=${report.grade} (${report.overallScore}/100), issues=${report.issues.length}\n`,
  );
  return md;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const command = process.argv[2];
  if (command === 'prepare') {
    runPrepare();
  } else if (command === 'render') {
    runRender();
  } else {
    process.stderr.write('Usage: node .github/roast/cli.mjs <prepare|render>\n');
    process.exitCode = 2;
  }
}
