#!/usr/bin/env node
/**
 * export-cue-manifest.mjs
 * -----------------------------------------------------------------------------
 * Emit the showreel cue metadata from src/data/cues.ts as JSON on stdout so
 * non-TypeScript tooling (tools/tag-audio.py) can embed sync-ready tags without
 * duplicating the catalogue data. cues.ts stays the single source of truth.
 *
 * Node 22 can load .ts files directly with type stripping; the type-only import
 * inside cues.ts is erased, so no compilation step or extra dependency is needed.
 *
 * Usage:
 *   node --experimental-strip-types tools/export-cue-manifest.mjs
 *
 * The flag is silent on Node >= 22.18 (type stripping is unflagged there) and
 * harmless on older 22.x line releases.
 * -----------------------------------------------------------------------------
 */

const { cues } = await import('../src/data/cues.ts');

const manifest = cues.map((cue) => ({
  track: cue.track,
  slug: cue.slug,
  title: cue.title,
  category: cue.category,
  durationSeconds: cue.durationSeconds,
  description: cue.description,
  audioPath: cue.audioPath,
}));

process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
