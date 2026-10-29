#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPromptBundle, parseNameStatus } from './diff.mjs';
import { buildDeterministicRoast } from './heuristic.mjs';
import {
  extractJsonObject,
  mergeWithDeterministic,
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

  const deterministicReport = bundle.meta.skipInference
    ? null
    : buildDeterministicRoast({ entries, patchesByPath, meta: bundle.meta });
  const enrichedMeta = { ...bundle.meta, deterministicReport };

  fs.writeFileSync(systemFile, bundle.systemPrompt, 'utf8');
  fs.writeFileSync(promptFile, bundle.userPrompt, 'utf8');
  fs.writeFileSync(metaFile, JSON.stringify(enrichedMeta, null, 2), 'utf8');

  if (env.GITHUB_OUTPUT) {
    fs.appendFileSync(env.GITHUB_OUTPUT, `skip_inference=${bundle.meta.skipInference}\n`, 'utf8');
  }
  process.stdout.write(
    `prepared roast: ${bundle.meta.includedFiles.length}/${bundle.meta.totalChangedFiles} file(s), skip=${bundle.meta.skipInference}\n`,
  );
  return { ...bundle, meta: enrichedMeta };
}

export async function runInfer(env = process.env) {
  const apiKey = String(env.LLM_API_KEY || '').trim();
  const apiUrl = String(env.LLM_API_URL || '').trim();
  if (!apiKey || !apiUrl) {
    throw new Error('LLM_API_KEY and LLM_API_URL are required for HTTP inference.');
  }
  const systemPrompt = fs.readFileSync(path.resolve(env.SYSTEM_PROMPT_FILE), 'utf8');
  const userPrompt = fs.readFileSync(path.resolve(env.PROMPT_FILE), 'utf8');
  const outFile = path.resolve(env.OUT_RESPONSE_FILE || 'roast-response.json');
  const model = String(env.MODEL_NAME || 'gpt-4o-mini').trim();

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_completion_tokens: 2200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`LLM HTTP ${res.status}: ${bodyText.slice(0, 240)}`);
  }
  const payload = await res.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('LLM response did not contain choices[0].message.content.');
  }
  fs.writeFileSync(outFile, content, 'utf8');
  process.stdout.write(`received LLM roast response (${content.length} chars)\n`);
  return content;
}

export function runRender(env = process.env) {
  const metaFile = path.resolve(env.META_FILE || 'roast-meta.json');
  const outMarkdownFile = path.resolve(env.OUT_MARKDOWN_FILE || 'roast-comment.md');
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

  const baseContext = {
    heat: meta.heat,
    filesAnalyzed: Array.isArray(meta.includedFiles) ? meta.includedFiles.length : 0,
    headSha: env.HEAD_SHA || '',
  };

  if (meta.skipInference) {
    const reason =
      meta.totalChangedFiles === 0
        ? 'No changed files between the base and head commits.'
        : 'Only generated bundles or binary media changed in this pull request; no hand-authored source diff to roast.';
    const md = renderSkippedMarkdown(reason, { ...baseContext, engine: 'static-guardrails' });
    fs.writeFileSync(outMarkdownFile, md, 'utf8');
    return md;
  }

  let rawResponse = env.MODEL_RESPONSE || '';
  if (env.RESPONSE_FILE && fs.existsSync(env.RESPONSE_FILE)) {
    rawResponse = fs.readFileSync(env.RESPONSE_FILE, 'utf8');
  }

  if (rawResponse.trim()) {
    const extracted = extractJsonObject(rawResponse);
    if (extracted.ok) {
      const llmReport = normalizeRoastReport(extracted.value, meta);
      const combined = mergeWithDeterministic(llmReport, meta.deterministicReport, meta);
      const engine = env.ENGINE_LABEL || env.MODEL_NAME || 'llm';
      const md = renderRoastMarkdown(combined, { ...baseContext, engine });
      fs.writeFileSync(outMarkdownFile, md, 'utf8');
      process.stdout.write(
        `rendered LLM+guardrail roast: grade=${combined.grade} (${combined.overallScore}/100), issues=${combined.issues.length}\n`,
      );
      return md;
    }
    process.stderr.write(`LLM output invalid JSON (${extracted.error}); falling back to deterministic roast.\n`);
  }

  if (meta.deterministicReport) {
    const md = renderRoastMarkdown(meta.deterministicReport, {
      ...baseContext,
      filesAnalyzed: Number.isFinite(meta.reviewableFileCount)
        ? meta.reviewableFileCount
        : baseContext.filesAnalyzed,
      engine: 'static-guardrails',
    });
    fs.writeFileSync(outMarkdownFile, md, 'utf8');
    process.stdout.write(
      `rendered deterministic roast: grade=${meta.deterministicReport.grade} (${meta.deterministicReport.overallScore}/100), issues=${meta.deterministicReport.issues.length}\n`,
    );
    return md;
  }

  const fallback = renderSkippedMarkdown('No roast report was produced for this diff.', {
    ...baseContext,
    engine: 'static-guardrails',
  });
  fs.writeFileSync(outMarkdownFile, fallback, 'utf8');
  return fallback;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const command = process.argv[2];
  if (command === 'prepare') {
    runPrepare();
  } else if (command === 'infer') {
    runInfer().catch((err) => {
      process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
      process.exitCode = 1;
    });
  } else if (command === 'render') {
    runRender();
  } else {
    process.stderr.write('Usage: node .github/roast/cli.mjs <prepare|infer|render>\n');
    process.exitCode = 2;
  }
}
