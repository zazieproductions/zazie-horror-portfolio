#!/usr/bin/env node
/**
 * tools/conflict-git.mjs
 * -----------------------------------------------------------------------------
 * The git and build side of the automatic conflict resolver: porcelain status
 * parsing that survives paths with spaces, content hashing, merge abort/reset,
 * side seeding, and running `npm run build`. `tools/conflict-policy.mjs` holds
 * the decisions; `tools/resolve-conflicts.mjs` sequences them.
 *
 * No dependencies.
 * -----------------------------------------------------------------------------
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hasConflictMarkers, parsePorcelainZ } from './conflict-policy.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function git(args, { allowFail = false } = {}) {
  const res = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw res.error;
  if (res.status !== 0 && !allowFail) {
    const detail = (res.stderr || res.stdout || '').trim();
    throw new Error(`git ${args.join(' ')} exited ${res.status}${detail ? `:\n${detail}` : ''}`);
  }
  return res;
}

export function gitText(args, options) {
  return git(args, options).stdout.trim();
}

export function contentHash(relPath) {
  const abs = path.join(ROOT, relPath);
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    return 'absent';
  }
  if (!stat.isFile()) return 'absent';
  return createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

export function snapshot() {
  const entries = parsePorcelainZ(git(['status', '--porcelain=v1', '-z', '--untracked-files=all']).stdout);
  const map = new Map();
  for (const entry of entries) {
    map.set(entry.path, { status: entry.status, from: entry.from, hash: contentHash(entry.path) });
  }
  return map;
}

export function markedFiles(paths) {
  return paths.filter((relPath) => {
    try {
      const abs = path.join(ROOT, relPath);
      return fs.statSync(abs).isFile() && hasConflictMarkers(fs.readFileSync(abs, 'utf8'));
    } catch {
      return false;
    }
  });
}

export function restoreClean() {
  git(['reset', '--hard', 'HEAD']);
  git(['clean', '-fd']);
}

export function mergeInProgress() {
  return fs.existsSync(path.join(ROOT, '.git', 'MERGE_HEAD'));
}

export function abortMerge() {
  if (mergeInProgress() && git(['merge', '--abort'], { allowFail: true }).status === 0) return;
  restoreClean();
}

export function unmergedPaths() {
  return gitText(['diff', '--name-only', '--diff-filter=U', '-z']).split('\0').filter(Boolean);
}

export function runBuild() {
  const res = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, CI: '1' },
  });
  const output = `${res.stdout || ''}\n${res.stderr || ''}`.trimEnd();
  return {
    ok: res.status === 0,
    status: res.status,
    tail: output.split('\n').filter((line) => line.trim() !== ''),
  };
}

/** Seed each path from one side of the merge, so the build has something to overwrite. */
export function seedSide(side, paths) {
  for (const filePath of paths) {
    const ref = side === 'theirs' ? 'MERGE_HEAD' : 'HEAD';
    if (git(['cat-file', '-e', `${ref}:${filePath}`], { allowFail: true }).status === 0) {
      git(['checkout', `--${side}`, '--', filePath]);
      git(['add', '--', filePath]);
      continue;
    }
    if (fs.existsSync(path.join(ROOT, filePath))) fs.rmSync(path.join(ROOT, filePath));
    git(['add', '-A', '--', filePath]);
  }
}
