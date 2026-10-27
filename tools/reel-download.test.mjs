#!/usr/bin/env node
/** Download regression tests: published cue list, ZIP contents, and UI states. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { test } from 'node:test';
import { unzipSync, strFromU8 } from 'fflate';
import { createReelArchive } from '../src/reel-download/archive.js';
import { initReelDownload } from '../src/reel-download/main.js';
import { readReelTracks } from '../src/reel-download/tracks.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

function cueRow({ url, filename, title, audioUrl = url }) {
  const link = { getAttribute: (name) => ({ href: url, download: filename })[name] ?? null };
  const audio = { getAttribute: (name) => name === 'src' ? audioUrl : null };
  const notes = { textContent: `Cue notes: ${title}` };
  return { querySelector: (selector) => ({ 'a[data-cue-download]': link, audio, 'a.inline-link': notes })[selector] ?? null };
}

function publishedRows() {
  const html = read('reel/index.html');
  return [...html.matchAll(/<details class="faq-item" id="track-track-\d{2}">[\s\S]*?<\/details>/g)].map(([row]) => {
    const note = /<a class="inline-link" href="\/reel\/([^\"]+)">Cue notes: ([^<]+)<\/a>/.exec(row);
    const download = /<a href="(\/audio\/track-\d{2}\.mp3)" download="([^"]+)" data-cue-download aria-label="Download MP3: [^"]+">Download MP3<\/a>/.exec(row);
    const audio = /<audio\b[^>]*\bsrc="([^"]+)"/.exec(row);
    assert.ok(note && download && audio, 'every published cue has notes, a labelled download, and a player');
    assert.equal(download[2], `${note[1]}.mp3`, 'the saved filename uses the cue slug');
    const item = read(`reel/${note[1]}.html`);
    assert.ok(item.includes(`href="${download[1]}" download="${download[2]}"`), 'the cue page also offers the same MP3 download');
    return cueRow({ url: download[1], filename: download[2], title: note[2], audioUrl: audio[1] });
  });
}

function cueDocument(rows) {
  return { querySelectorAll: (selector) => selector === '#cues details.faq-item' ? rows : [] };
}

class FakeElement {
  constructor() {
    this.hidden = true;
    this.disabled = false;
    this.textContent = '';
    this.listeners = new Map();
    this.clickCount = 0;
    this.focused = false;
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this[name] = value; }
  focus() { this.focused = true; }
  click() {
    this.clickCount += 1;
    return this.listeners.get('click')?.();
  }
}

function uiFixture(rows = [cueRow({ url: '/audio/track-30.mp3', filename: 'the-beautiful-wrongness.mp3', title: 'The Beautiful Wrongness' })]) {
  const elements = Object.fromEntries(['download', 'cancel', 'save', 'progress', 'status'].map((key) => [key, new FakeElement()]));
  const card = { querySelector: (selector) => elements[selector.replace(/^\[data-reel-/, '').replace(/\]$/, '')] ?? null };
  const document = {
    ...cueDocument(rows),
    querySelector: (selector) => selector === '[data-reel-download-card]' ? card : null,
  };
  let fetchCalls = 0;
  const env = {
    fetch() { fetchCalls += 1; },
    AbortController,
    Blob,
    URL: { createObjectURL: () => 'blob:demo-reel', revokeObjectURL() {} },
  };
  return { elements, document, env, get fetchCalls() { return fetchCalls; } };
}

test('the homepage and every cue offer downloads from the same published reel', () => {
  const html = read('reel/index.html');
  assert.equal(html, read('reel.html'), 'slashless and directory reel hubs match');
  assert.match(html, /id="download" data-reel-download-card/);
  assert.match(html, /data-reel-download hidden/);
  assert.match(html, /href="#cues">Download individual MP3s/);

  const script = /src="\/(reel-download-([0-9a-f]{8})\.js)"/.exec(html);
  assert.ok(script, 'hub loads the built ZIP script');
  const bundle = fs.readFileSync(path.join(ROOT, script[1]));
  assert.equal(createHash('sha256').update(bundle).digest('hex').slice(0, 8), script[2]);

  const home = read('index.html');
  const homeBundle = /import\("\/(index-[0-9a-f]{8}\.js)"\)/.exec(home)?.[1];
  assert.match(home, /href="\/reel#download"[^>]*>[\s\S]*?Download demo reel<\/a>/);
  assert.ok(homeBundle && read(homeBundle).includes('href:"/reel#download"'), 'the link survives the React mount');

  const tracks = readReelTracks(cueDocument(publishedRows()));
  assert.equal(tracks.length, 30);
  assert.deepEqual(tracks[0], {
    url: '/audio/track-30.mp3',
    title: 'The Beautiful Wrongness',
    name: '01 - the-beautiful-wrongness.mp3',
  });
  assert.equal(tracks.at(-1).url, '/audio/track-31.mp3');
  assert.equal(new Set(tracks.map((track) => track.url)).size, 30);
  const player = read(homeBundle);
  const queue = player.slice(player.indexOf('tracks:['), player.indexOf('],projects:['));
  const playerUrls = [...queue.matchAll(/src:"(\/audio\/track-\d{2}\.mp3)"/g)].map((match) => match[1]);
  assert.deepEqual([...playerUrls].sort(), tracks.map((track) => track.url).sort(), 'the ZIP covers every homepage cue');
  for (const track of tracks) assert.ok(fs.statSync(path.join(ROOT, track.url)).size > 0, `${track.url} is a real file`);
});

test('the existing Expand all control works for the individual-download list', () => {
  const items = [new FakeElement(), new FakeElement()];
  items.forEach((item, index) => { item.id = `track-${index}`; item.open = false; });
  const expand = new FakeElement();
  const count = new FakeElement();
  const section = { id: 'cues' };
  const indexLink = { getAttribute: () => '#cues', removeAttribute() {}, setAttribute() {} };
  const document = {
    documentElement: { classList: { add() {} }, scrollHeight: 1200 },
    querySelector: (selector) => ({ '[data-faq-all]': expand, '[data-faq-count]': count })[selector] ?? null,
    // legal.js asks for both spellings of the contents control in one query -
    // the retired sticky rail and the banded pages' horizontal jump bar - so
    // the stub has to answer that exact combined selector. Answering only the
    // old one would leave indexLinks empty and silently stop this test from
    // exercising the rootMargin guard below.
    querySelectorAll: (selector) => ({
      '.faq-item': items,
      '.doc-index a[href^="#"], .section-jump a[href^="#"]': [indexLink],
    })[selector] ?? [],
    getElementById: (id) => id === 'cues' ? section : null,
  };
  class IntersectionObserver {
    constructor(_callback, { rootMargin }) {
      assert.ok(rootMargin.split(/\s+/).every((value) => /^-?\d+(?:px|%)$/.test(value)), 'rootMargin uses supported units');
    }
    observe() {}
  }
  const window = { IntersectionObserver, location: { hash: '' }, innerHeight: 900,
    addEventListener() {}, requestAnimationFrame: (callback) => callback() };
  vm.runInNewContext(read('legal-src/legal.js'), { document, window, IntersectionObserver, navigator: {} });
  assert.equal(expand.textContent, 'Expand all');
  expand.click();
  assert.ok(items.every((item) => item.open), 'each cue opens so its MP3 link is visible');
  expand.click();
  assert.ok(items.every((item) => !item.open), 'the list can be collapsed again');
});

test('the cue reader refuses missing, mismatched, unsafe, or duplicate files', () => {
  assert.throws(() => readReelTracks(cueDocument([])), /unavailable/);
  const bad = cueRow({ url: '/audio/track-30.mp3', filename: '../wrong.mp3', title: 'Cue' });
  assert.throws(() => readReelTracks(cueDocument([bad])), /missing its downloadable MP3/);
  const mismatch = cueRow({ url: '/audio/track-30.mp3', filename: 'cue.mp3', title: 'Cue', audioUrl: '/audio/track-00.mp3' });
  assert.throws(() => readReelTracks(cueDocument([mismatch])), /missing its downloadable MP3/);
  const row = cueRow({ url: '/audio/track-30.mp3', filename: 'cue.mp3', title: 'Cue' });
  assert.throws(() => readReelTracks(cueDocument([row, row])), /duplicate/);
});

test('a ZIP contains the original bytes, names, and licensing note, with progress', async () => {
  const tracks = [
    { url: '/audio/one.mp3', title: 'One', name: '01 - one.mp3' },
    { url: '/audio/two.mp3', title: 'Two', name: '02 - two.mp3' },
  ];
  const originals = new Map([
    [tracks[0].url, new Uint8Array([73, 68, 51, 0, 42, 255])],
    [tracks[1].url, new Uint8Array([255, 251, 8, 10, 20, 30, 40])],
  ]);
  const calls = [];
  const progress = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    const bytes = originals.get(url);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, 3));
        controller.enqueue(bytes.slice(3));
        controller.close();
      },
    });
    return new Response(stream, { headers: { 'content-type': 'audio/mpeg' } });
  };
  const blob = await createReelArchive(tracks, { fetcher, onProgress: (step) => progress.push(step) });
  assert.equal(blob.type, 'application/zip');
  assert.deepEqual(calls.map((call) => call.url), tracks.map((track) => track.url));
  assert.ok(calls.every((call) => call.options.credentials === 'same-origin'));
  assert.deepEqual(progress.map((step) => step.completed), [0, 1, 2]);
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  assert.deepEqual(Object.keys(files), ['README.txt', tracks[0].name, tracks[1].name]);
  assert.match(strFromU8(files['README.txt']), /licence[\s\S]*horror\.zazieproductions\.com\/licensing/);
  for (const track of tracks) assert.deepEqual(files[track.name], originals.get(track.url));
});

test('the archive handles non-streaming responses and rejects missing or empty audio', async () => {
  const track = { url: '/audio/one.mp3', title: 'One', name: '01 - one.mp3' };
  const headers = new Headers({ 'content-type': 'audio/mpeg' });
  const blob = await createReelArchive([track], {
    fetcher: async () => ({ ok: true, headers, body: null, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }),
  });
  assert.deepEqual(unzipSync(new Uint8Array(await blob.arrayBuffer()))[track.name], new Uint8Array([1, 2, 3]));
  await assert.rejects(createReelArchive([track], { fetcher: async () => new Response('missing', { status: 404 }) }), /Could not retrieve One/);
  await assert.rejects(createReelArchive([track], { fetcher: async () => new Response('<html>error</html>', { headers: { 'content-type': 'text/html' } }) }), /Could not retrieve One/);
  await assert.rejects(createReelArchive([track], { fetcher: async () => new Response(new Uint8Array(), { headers }) }), /empty/);
});

test('cancelling aborts an in-flight request instead of saving a partial ZIP', async () => {
  const track = { url: '/audio/one.mp3', title: 'One', name: '01 - one.mp3' };
  const controller = new AbortController();
  let requested;
  const started = new Promise((resolve) => { requested = resolve; });
  const fetcher = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    requested();
  });
  const work = createReelArchive([track], { fetcher, signal: controller.signal });
  await started;
  controller.abort();
  await assert.rejects(work, { name: 'AbortError' });
});

test('the enhanced control starts only on request and keeps a save link available', async () => {
  const fixture = uiFixture();
  const { elements, document, env } = fixture;
  let builds = 0;
  initReelDownload(document, env, async (tracks, { onProgress }) => {
    builds += 1;
    assert.equal(tracks.length, 1);
    onProgress({ completed: 0, total: 1, title: tracks[0].title });
    onProgress({ completed: 1, total: 1, title: null });
    return new Blob(['zip']);
  });
  assert.equal(elements.download.hidden, false);
  assert.equal(builds, 0);
  assert.equal(fixture.fetchCalls, 0, 'no audio is fetched on page load');
  await elements.download.click();
  assert.equal(builds, 1);
  assert.equal(elements.progress.value, 1);
  assert.equal(elements.save.hidden, false);
  assert.equal(elements.save.href, 'blob:demo-reel');
  assert.equal(elements.save.clickCount, 1, 'the ZIP download is started automatically');
  assert.match(elements.status.textContent, /select Save ZIP/);
});

test('a browser blocking the automatic click still gets the manual save link', async () => {
  const { elements, document, env } = uiFixture();
  elements.save.click = () => { throw new Error('automatic downloads blocked'); };
  initReelDownload(document, env, async () => new Blob(['zip']));
  await elements.download.click();
  assert.equal(elements.save.hidden, false);
  assert.equal(elements.save.href, 'blob:demo-reel');
  assert.match(elements.status.textContent, /Your ZIP is ready/);
});

test('cancel, error, retry, and unsupported browsers leave a usable fallback', async () => {
  const fixture = uiFixture();
  const { elements, document, env } = fixture;
  let attempts = 0;
  initReelDownload(document, env, (_tracks, { signal }) => {
    attempts += 1;
    if (attempts === 1) return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
    if (attempts === 2) return Promise.reject(new Error('offline'));
    return Promise.resolve(new Blob(['zip']));
  });
  const first = elements.download.click();
  assert.equal(elements.cancel.hidden, false);
  elements.cancel.click();
  await first;
  assert.match(elements.status.textContent, /cancelled/i);
  assert.equal(elements.download.disabled, false);
  await elements.download.click();
  assert.match(elements.status.textContent, /Check your connection/);
  assert.equal(elements.download.textContent, 'Try ZIP download again');
  await elements.download.click();
  assert.equal(elements.save.hidden, false);

  const unsupported = uiFixture();
  delete unsupported.env.fetch;
  initReelDownload(unsupported.document, unsupported.env);
  assert.equal(unsupported.elements.download.hidden, true);
  assert.match(unsupported.elements.status.textContent, /individual MP3s/);
});
