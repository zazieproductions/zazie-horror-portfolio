#!/usr/bin/env node
/**
 * encode-film.mjs - turn a film master into the self hosted HLS ladder that
 * src/film/player.js streams from /media/<slug>/.
 *
 *   node tools/encode-film.mjs <source> --slug eclipsed
 *   node tools/encode-film.mjs "~/Movies/Eclipsed V3 Distortion.mov" --slug eclipsed --ladder 1080,720,480
 *   node tools/encode-film.mjs master.mov --slug eclipsed --out build/test-media/eclipsed   # preview only
 *
 * Options
 *   --slug <slug>        required; output goes to media/<slug>/ unless --out is given
 *   --out <dir>          output directory (default media/<slug>)
 *   --ladder <list>      rung heights, default 1080,720,480 (rungs above the source are dropped)
 *   --crf <n>            x264 quality, default 22 (lower = better/larger)
 *   --preset <name>      x264 preset, default slow
 *   --segment <seconds>  segment length, default 6
 *   --dry-run            print the ffmpeg command and exit
 *
 * Environment: FFMPEG / FFPROBE override the binaries on PATH.
 *
 * WHY HLS AND NOT ONE MP4
 *
 * Cloudflare Pages refuses any file over 25 MB and the site is uploaded as
 * plain files (scripts/build-deploy-dir.mjs enforces the same limit), so the
 * film has to be served in pieces. HLS is exactly that: a text playlist that
 * names 6 second fMP4 segments, each a few MB. Safari and iOS play it natively;
 * the player loads the vendored hls.js for every other browser. The ladder
 * lets a phone on cellular pick 480p while a desktop gets 1080p.
 *
 * Output layout (what the player and the _headers /media/* rule expect):
 *
 *   media/<slug>/master.m3u8          variant playlist referenced by the site
 *   media/<slug>/1080p/index.m3u8     one media playlist per rung
 *   media/<slug>/1080p/init_0.mp4     fMP4 init segment (EXT-X-MAP)
 *   media/<slug>/1080p/seg-000.m4s    6 s segments ...
 *
 * The directory is replaced wholesale on every run so no stale segment lingers.
 * Every output file is checked against the 25 MB upload limit and the
 * playlists are validated before the script reports success.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_FILE_BYTES = 25 * 1024 * 1024;

/* Per-rung caps (kbit/s). CRF decides the quality; the cap keeps a bright,
   grainy passage from blowing a segment past what a phone can fetch in time. */
const RUNGS = {
  2160: { maxrate: 14000, bufsize: 28000 },
  1440: { maxrate: 8000, bufsize: 16000 },
  1080: { maxrate: 4500, bufsize: 9000 },
  720: { maxrate: 2400, bufsize: 4800 },
  540: { maxrate: 1600, bufsize: 3200 },
  480: { maxrate: 1100, bufsize: 2200 },
  360: { maxrate: 700, bufsize: 1400 },
  240: { maxrate: 400, bufsize: 800 },
};
const AUDIO_KBPS = 160;

/* --------------------------------------------------------------- arguments */

function parseArgs(argv) {
  const opts = { ladder: [1080, 720, 480], crf: 22, preset: 'slow', segment: 6, dryRun: false };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} needs a value`);
      return argv[i];
    };
    if (arg === '--slug') opts.slug = next();
    else if (arg === '--out') opts.out = next();
    else if (arg === '--ladder') opts.ladder = next().split(',').map((v) => Number(v.trim())).filter(Boolean);
    else if (arg === '--crf') opts.crf = Number(next());
    else if (arg === '--preset') opts.preset = next();
    else if (arg === '--segment') opts.segment = Number(next());
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '-h' || arg === '--help') { usage(); process.exit(0); }
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`);
    else positional.push(arg);
  }
  if (positional.length !== 1) throw new Error('exactly one <source> file is required');
  opts.source = positional[0].replace(/^~(?=$|\/)/, os.homedir());
  if (!opts.slug || !/^[a-z0-9][a-z0-9-]*$/.test(opts.slug)) throw new Error('--slug must be a lowercase slug such as eclipsed');
  if (!opts.ladder.length || opts.ladder.some((h) => !RUNGS[h])) throw new Error(`--ladder values must be among ${Object.keys(RUNGS).join(', ')}`);
  if (!(opts.crf >= 0 && opts.crf <= 51)) throw new Error('--crf must be 0-51');
  if (!(opts.segment >= 2 && opts.segment <= 10)) throw new Error('--segment must be 2-10 seconds');
  opts.ladder = [...new Set(opts.ladder)].sort((a, b) => b - a);
  opts.out = path.resolve(ROOT, opts.out || path.join('media', opts.slug));
  return opts;
}

function usage() {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 24).map((l) => l.replace(/^ \*\s?/, '')).join('\n'));
}

/* ------------------------------------------------------------------ probes */

function which(bin, fallback) {
  const candidate = process.env[bin] || fallback;
  const probe = spawnSync(candidate, ['-version'], { encoding: 'utf8' });
  return probe.status === 0 ? candidate : null;
}

function parseRate(rate) {
  const match = /^(\d+)(?:\/(\d+))?$/.exec(rate || '');
  if (!match || Number(match[2]) === 0) return null;
  return Number(match[1]) / (match[2] ? Number(match[2]) : 1);
}

function probe(ffprobe, ffmpeg, source) {
  if (ffprobe) {
    const res = spawnSync(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', source], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (res.status === 0) {
      const info = JSON.parse(res.stdout);
      const video = (info.streams || []).find((s) => s.codec_type === 'video');
      const audio = (info.streams || []).find((s) => s.codec_type === 'audio');
      if (!video) throw new Error('source has no video stream');
      return {
        width: Number(video.width),
        height: Number(video.height),
        duration: Number(info.format?.duration || video.duration || 0),
        hasAudio: Boolean(audio),
        fps: parseRate(video.avg_frame_rate),
      };
    }
  }
  // Fallback: parse `ffmpeg -i` banner output.
  const res = spawnSync(ffmpeg, ['-hide_banner', '-i', source], { encoding: 'utf8' });
  const text = res.stderr || '';
  const dim = /Video:.*?\s(\d{2,5})x(\d{2,5})/.exec(text);
  const dur = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
  if (!dim) throw new Error(`could not read the source dimensions:\n${text.slice(-800)}`);
  return {
    width: Number(dim[1]),
    height: Number(dim[2]),
    duration: dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0,
    hasAudio: /Audio:/.test(text),
    fps: null,
  };
}

/* ---------------------------------------------------------------- command */

function buildCommand(ffmpeg, opts, info, rungs) {
  const split = rungs.map((_, i) => `[v${i}]`).join('');
  const scales = rungs.map((h, i) => `[v${i}]scale=-2:${h}:flags=lanczos[v${i}o]`).join(';');
  const args = ['-hide_banner', '-y', '-nostdin', '-i', opts.source,
    '-filter_complex', `[0:v]split=${rungs.length}${split};${scales}`,
    '-map_metadata', '-1', '-map_chapters', '-1'];
  rungs.forEach((_, i) => {
    args.push('-map', `[v${i}o]`);
    if (info.hasAudio) args.push('-map', '0:a:0');
  });
  args.push('-c:v', 'libx264', '-preset', opts.preset, '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', String(opts.crf), '-x264-params', 'aq-mode=3');
  rungs.forEach((h, i) => {
    args.push(`-maxrate:v:${i}`, `${RUNGS[h].maxrate}k`, `-bufsize:v:${i}`, `${RUNGS[h].bufsize}k`);
  });
  if (info.hasAudio) args.push('-c:a', 'aac', '-b:a', `${AUDIO_KBPS}k`, '-ac', '2', '-ar', '48000');
  args.push('-force_key_frames', `expr:gte(t,n_forced*${opts.segment})`, '-sc_threshold', '0',
    '-f', 'hls', '-hls_time', String(opts.segment), '-hls_playlist_type', 'vod', '-hls_list_size', '0',
    '-hls_segment_type', 'fmp4', '-hls_flags', 'independent_segments',
    '-hls_fmp4_init_filename', 'init.mp4', '-master_pl_name', 'master.m3u8',
    '-var_stream_map', rungs.map((h, i) => (info.hasAudio ? `v:${i},a:${i},name:${h}p` : `v:${i},name:${h}p`)).join(' '),
    '-hls_segment_filename', path.join(opts.out, '%v', 'seg-%03d.m4s'),
    path.join(opts.out, '%v', 'index.m3u8'));
  return args;
}

/* -------------------------------------------------------------- validation */

function validate(outDir, rungs) {
  const problems = [];
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  };
  walk(outDir);
  let total = 0;
  let largest = { file: '', size: 0 };
  for (const file of files) {
    const { size } = fs.statSync(file);
    total += size;
    if (size > largest.size) largest = { file, size };
    if (size > MAX_FILE_BYTES) problems.push(`${path.relative(outDir, file)} is ${(size / 1048576).toFixed(1)} MB; Cloudflare Pages refuses files over 25 MB (shorten --segment or lower the rung caps)`);
  }
  const master = path.join(outDir, 'master.m3u8');
  if (!fs.existsSync(master)) problems.push('master.m3u8 was not written');
  else {
    const text = fs.readFileSync(master, 'utf8');
    if (!/^#EXTM3U/.test(text)) problems.push('master.m3u8 is not a playlist');
    const variants = [...text.matchAll(/^#EXT-X-STREAM-INF:(.*)\n(.+)$/gm)];
    if (variants.length !== rungs.length) problems.push(`master.m3u8 lists ${variants.length} variants, expected ${rungs.length}`);
    for (const [, attrs, uri] of variants) {
      if (/^(https?:)?\/\//.test(uri) || uri.startsWith('/')) problems.push(`master.m3u8 variant ${uri} must be a relative path`);
      if (!/RESOLUTION=\d+x\d+/.test(attrs) || !/BANDWIDTH=\d+/.test(attrs)) problems.push(`master.m3u8 variant ${uri} lacks RESOLUTION/BANDWIDTH`);
      const mediaPath = path.join(outDir, uri);
      if (!fs.existsSync(mediaPath)) { problems.push(`${uri} is missing`); continue; }
      const media = fs.readFileSync(mediaPath, 'utf8');
      if (!/#EXT-X-ENDLIST/.test(media)) problems.push(`${uri} has no EXT-X-ENDLIST (not a finished VOD playlist)`);
      const init = /#EXT-X-MAP:URI="([^"]+)"/.exec(media);
      if (!init) problems.push(`${uri} has no EXT-X-MAP init segment`);
      else if (!fs.existsSync(path.join(path.dirname(mediaPath), init[1]))) problems.push(`${uri}: init segment ${init[1]} is missing`);
      const segments = media.split('\n').filter((line) => line && !line.startsWith('#'));
      if (!segments.length) problems.push(`${uri} names no segments`);
      for (const seg of segments) {
        if (!fs.existsSync(path.join(path.dirname(mediaPath), seg))) problems.push(`${uri}: segment ${seg} is missing`);
      }
    }
  }
  return { problems, total, largest, count: files.length };
}

/* -------------------------------------------------------------------- main */

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`encode-film: ${error.message}\n`); usage(); process.exit(2); }

  if (/^https?:\/\//.test(opts.source)) {
    console.error('encode-film: download the master first (the encode-film workflow does this for a Drive link), then pass the local file');
    process.exit(2);
  }
  if (!fs.existsSync(opts.source)) { console.error(`encode-film: source not found: ${opts.source}`); process.exit(2); }

  const ffmpeg = which('FFMPEG', 'ffmpeg');
  if (!ffmpeg) {
    console.error('encode-film: ffmpeg not found. Install it (brew install ffmpeg / apt install ffmpeg) or point FFMPEG at a binary.');
    process.exit(2);
  }
  const ffprobe = which('FFPROBE', 'ffprobe');

  const info = probe(ffprobe, ffmpeg, opts.source);
  const rungs = opts.ladder.filter((h) => h <= info.height);
  if (!rungs.length) rungs.push(opts.ladder[opts.ladder.length - 1]);
  const dropped = opts.ladder.filter((h) => !rungs.includes(h));

  console.log(`encode-film: ${path.basename(opts.source)} - ${info.width}x${info.height}, ${info.duration ? `${Math.round(info.duration)} s` : 'unknown length'}, ${info.hasAudio ? 'stereo AAC audio' : 'NO AUDIO STREAM'}`);
  console.log(`  ladder ${rungs.map((h) => `${h}p (cap ${RUNGS[h].maxrate}k)`).join(', ')}${dropped.length ? `; skipped ${dropped.map((h) => `${h}p`).join(', ')} (above the source)` : ''}`);
  console.log(`  crf ${opts.crf}, preset ${opts.preset}, ${opts.segment} s fMP4 segments -> ${path.relative(ROOT, opts.out) || opts.out}`);

  const args = buildCommand(ffmpeg, opts, info, rungs);
  if (opts.dryRun) {
    console.log(`\n${[ffmpeg, ...args].map((a) => (/[\s"']/.test(a) ? JSON.stringify(a) : a)).join(' ')}`);
    return;
  }

  if (path.relative(ROOT, opts.out).startsWith('..') || opts.out === ROOT) {
    console.error('encode-film: --out must stay inside the repository');
    process.exit(2);
  }
  fs.rmSync(opts.out, { recursive: true, force: true });
  for (const h of rungs) fs.mkdirSync(path.join(opts.out, `${h}p`), { recursive: true });

  const started = Date.now();
  const run = spawnSync(ffmpeg, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  if (run.status !== 0) {
    console.error(`\nencode-film: ffmpeg exited with ${run.status ?? run.signal}`);
    process.exit(1);
  }

  const { problems, total, largest, count } = validate(opts.out, rungs);
  if (problems.length) {
    console.error(`\nencode-film: ${problems.length} problem(s) in ${path.relative(ROOT, opts.out)}`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const relOut = path.relative(ROOT, opts.out);
  console.log(`\nencode-film: done in ${Math.round((Date.now() - started) / 1000)} s`);
  console.log(`  ${count} files, ${(total / 1048576).toFixed(1)} MB total; largest ${path.relative(opts.out, largest.file)} at ${(largest.size / 1048576).toFixed(1)} MB (limit 25 MB)`);
  for (const h of rungs) {
    const dir = path.join(opts.out, `${h}p`);
    const size = fs.readdirSync(dir).reduce((sum, f) => sum + fs.statSync(path.join(dir, f)).size, 0);
    console.log(`  ${h}p: ${(size / 1048576).toFixed(1)} MB`);
  }
  console.log(`  playlist: /${relOut.split(path.sep).join('/')}/master.m3u8`);
  if (relOut.startsWith('media' + path.sep)) {
    console.log('\nNext: review it locally (node server.mjs, then open the film card), then commit the media/ directory.');
    console.log('Git keeps every byte of this encode in history for good, so land one encode you are happy with rather than iterating in commits.');
  } else {
    console.log(`\nPreview without committing: MEDIA_ROOT=${path.dirname(relOut)} node server.mjs`);
  }
}

main();
