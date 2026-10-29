#!/usr/bin/env node
/** Regression checks for the published homepage player and showreel archive. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const retiredTitles = ['Dark Thriller Cinematic Cue', 'Screams of The Damned'];

function bundleTracks() {
  const html = read('index.html');
  const bundleName = /import\("\/(index-[0-9a-f]{8}\.js)"\)/.exec(html)?.[1];
  assert.ok(bundleName, 'homepage references its content-hashed React bundle');
  const source = read(bundleName);
  const start = source.indexOf('tracks:[');
  const end = source.indexOf('],projects:[', start);
  assert.ok(start >= 0 && end > start, 'bundle contains the showreel catalogue');
  const body = source.slice(start, end);
  const tracks = [...body.matchAll(/\{id:(\d+),title:"([^"]*)",src:"([^"]*)",duration:([\d.]+),tag:"([^"]*)"\}/g)]
    .map((match) => ({ id: Number(match[1]), title: match[2], src: match[3], duration: Number(match[4]), tag: match[5] }));
  return { source, tracks };
}

test('The Beautiful Wrongness is first in the 30-cue default player queue', () => {
  const { source, tracks } = bundleTracks();
  assert.equal(tracks.length, 30);
  assert.deepEqual(
    { title: tracks[0].title, src: tracks[0].src, duration: tracks[0].duration },
    { title: 'The Beautiful Wrongness', src: '/audio/track-30.mp3', duration: 65.411 },
  );
  assert.deepEqual(
    { title: tracks[1].title, src: tracks[1].src },
    { title: 'The Fatal Overdose', src: '/audio/track-12.mp3' },
    'main’s promoted cue stays next in the merged queue',
  );
  assert.equal(new Set(tracks.map((track) => track.id)).size, tracks.length, 'React keys remain unique');
  assert.ok(source.includes('String(s+1).padStart(2,"0")'), 'visible numbers follow queue order, not stable audio IDs');
  for (const title of retiredTitles) assert.equal(source.includes(title), false, `${title} is absent from the player bundle`);

  const html = read('index.html');
  const section = html.slice(html.indexOf('<section id="showreel"'), html.indexOf('</section>', html.indexOf('<section id="showreel"')));
  assert.equal((section.match(/zp-track/g) ?? []).length, 30, 'static first paint has the same 30 rows');
  assert.doesNotMatch(section, /Curated cues/);
  assert.doesNotMatch(source, /children:"Curated cues"/);
  assert.match(section, /<h3 class="mb-1 truncate[^>]*>The Beautiful Wrongness<\/h3>/);
  assert.match(section, /<input class="seek[^>]*max="65\.411"[^>]*aria-label="Seek through current track"/);
  const firstRow = /<button class="[^"]*zp-track[^"]*"[^>]*>([\s\S]*?)<\/button>/.exec(section)?.[1] ?? '';
  assert.match(firstRow, />01<\/span>/);
  assert.match(firstRow, />The Beautiful Wrongness<\/p>/);
});

test('the showreel archive and structured playlist use the same order', () => {
  const html = read('reel.html');
  assert.equal(html, read('reel/index.html'), 'canonical and directory hub twins stay identical');
  const details = html.match(/<details class="faq-item" id="track-track-\d{2}">[\s\S]*?<\/details>/g) ?? [];
  assert.equal(details.length, 30);
  assert.match(details[0], /<span class="qno">01<\/span>[\s\S]*The Beautiful Wrongness/);
  assert.match(details[0], /\/audio\/track-30\.mp3/);

  let playlist;
  for (const match of html.matchAll(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g)) {
    const data = JSON.parse(match[1]);
    playlist = data['@graph']?.find((node) => node['@type'] === 'MusicPlaylist') ?? playlist;
  }
  assert.ok(playlist, 'MusicPlaylist schema exists');
  assert.equal(playlist.numTracks, 30);
  assert.equal(playlist.track.length, 30);
  assert.equal(playlist.track[0].position, 1);
  assert.equal(playlist.track[0].name, 'The Beautiful Wrongness');
  assert.equal(playlist.track[0].audio.contentUrl, 'https://horror.zazieproductions.com/audio/track-30.mp3');
});

test('retired cue pages, audio files, and public references are gone', () => {
  for (const relative of [
    'audio/track-09.mp3',
    'audio/track-23.mp3',
    'reel/dark-thriller-cinematic-cue.html',
    'reel/screams-of-the-damned.html',
  ]) {
    assert.equal(fs.existsSync(path.join(ROOT, relative)), false, `${relative} should not be published`);
  }

  const publicFiles = [];
  (function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'build', 'dist', 'src', 'scripts', 'tools', 'home-src', 'legal-src', 'store-src'].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (/\.(?:html|txt|xml)$/.test(entry.name)) publicFiles.push(absolute);
    }
  })(ROOT);

  for (const file of publicFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const title of retiredTitles) assert.equal(content.includes(title), false, `${path.relative(ROOT, file)} still mentions ${title}`);
    assert.equal(content.includes('/reel/dark-thriller-cinematic-cue'), false, `${path.relative(ROOT, file)} retains a retired cue route`);
    assert.equal(content.includes('/reel/screams-of-the-damned'), false, `${path.relative(ROOT, file)} retains a retired cue route`);
    assert.equal(content.includes('/audio/track-09.mp3'), false, `${path.relative(ROOT, file)} retains a retired MP3`);
    assert.equal(content.includes('/audio/track-23.mp3'), false, `${path.relative(ROOT, file)} retains a retired MP3`);
  }
});
