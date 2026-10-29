#!/usr/bin/env node
/**
 * The compilation cards live inside the homepage press kit (tier IV), and must
 * stay minimal in both render paths, while preserving the opt-in Bandcamp
 * player and the no-JavaScript listening link.
 * Run: node --test tools/compilations.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const html = read('index.html');
const jsFile = /import\("\/(index-[0-9a-f]{8}\.js)"\)/.exec(html)?.[1];
assert.ok(jsFile, 'the homepage imports its generated React bundle');
const bundle = read(jsFile);
const grid = /<ul class="zp-comp-grid">[\s\S]*?<\/ul>/.exec(html)?.[0];
assert.ok(grid, 'the static homepage contains the compilation grid');
const press = html.slice(html.indexOf('<section id="press"'), html.indexOf('</section>', html.indexOf('<section id="press"')) + '</section>'.length);
assert.ok(press.includes(grid), 'the compilation grid renders inside the press kit');
const dirAt = press.indexOf('class="zp-pk-dir-grid"');
const gridAt = press.indexOf('<ul class="zp-comp-grid">');
assert.ok(dirAt > 0 && gridAt > dirAt, 'the players sit under the official profiles directory in tier IV');
assert.equal(html.indexOf('<section id="compilations"'), -1, 'the compilations are not a homepage section of their own');
const pressStart = bundle.indexOf('function I5(){');
const pressComponent = bundle.slice(pressStart, bundle.indexOf('function ', pressStart + 20));
const innerJson = /dangerouslySetInnerHTML:\{__html:("(?:\\.|[^"\\])*")\}/.exec(pressComponent)?.[1];
assert.ok(innerJson, 'the client bundle renders the press kit markup that carries the players');
const reactMarkup = JSON.parse(innerJson);
assert.ok(reactMarkup.includes(grid), 'React and the prerendered homepage use identical compilation markup');
const cards = [...grid.matchAll(/<li class="zp-comp-card"[\s\S]*?<\/li>/g)].map((match) => match[0]);
const css = /<style id="zp-comp-style">([\s\S]*?)<\/style>/.exec(html)?.[1];
const script = /<script id="zp-comp-script">([\s\S]*?)<\/script>/.exec(html)?.[1];
assert.ok(css && script, 'the homepage ships the compilation styles and player script');

const releases = [
  { album: 'The Undead', song: 'Zombies Were People Too', albumId: '3159294905', trackId: '2534272714', artId: '0832652916', href: 'https://soundsforthesoul.bandcamp.com/track/zazie-productions-zombies-were-people-too' },
  { album: 'Vampires', song: 'Vlad The Impaler', albumId: '1877841215', trackId: '1525832343', artId: '2491679187', href: 'https://soundsforthesoul.bandcamp.com/track/zazie-productions-vlad-the-impaler' },
  { album: 'Beyond The Body', song: 'Vox Hemorrhagia', albumId: '2579089660', trackId: '2574804859', artId: '2636155217', href: 'https://witch-house.bandcamp.com/album/beyond-the-body' },
  { album: 'Experiments on the Witch House [IND255GVA]', song: 'The Høuse FΩrgøt Its Name / Hex Ritual', albumId: '3733971626', trackId: '3317107995', artId: '3448102388', href: 'https://innerdemonsrecords.bandcamp.com/track/the-h-use-f-rg-t-its-name-hex-ritual' },
  { album: 'Esoterrexus - A Slithering Black Compilation', song: 'R’lyeh’s Xenolith', albumId: '2690874869', trackId: '2488880378', artId: '3176296099', href: 'https://slitheringblackrecords.bandcamp.com/album/esoterrexus-a-slithering-black-compilation' },
  { album: 'Summoning 2', song: 'The Spirit’s Bone Colored Air', albumId: '1119137698', trackId: '2745548289', artId: '2475836978', href: 'https://dittanyofcrete.bandcamp.com/album/summoning-2' },
  { album: 'Opaline Lament (Life From The Beyond)', song: 'Opaline Lament (Life From The Beyond)', trackId: '3208522807', artId: '4110701137', href: 'https://zazieproductions.bandcamp.com/track/opaline-lament-life-from-the-beyond-2' },
  { album: 'Constrained Capacity', song: 'Soundscape of 0/11/2022 (Bonus Track)', albumId: '832840755', trackId: '1951782118', artId: '0935502895', href: 'https://zazieproductions.bandcamp.com/album/constrained-capacity' },
  { album: 'TWO YEARS', song: 'Checksum Failed Successfully', albumId: '1603093440', trackId: '3325320170', artId: '0490310199', href: 'https://loudsilencedigital.bandcamp.com/album/two-years' },
];

const textContent = (markup) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('both homepage render paths show only release and song names on each cover card', () => {
  assert.match(press, />Official Profiles, Credits &amp; Streaming<\/span>/, 'the players stay under the tier IV heading');
  assert.equal(cards.length, releases.length, 'all nine cards remain in order');
  assert.doesNotMatch(press, /class="zp-(?:badge|dur|comp-meta|comp-note|comp-links|bc-nojs)"/);
  assert.doesNotMatch(press, /Playback runs in Bandcamp|Permalink|Track on Bandcamp|Full compilation|Full release/);
  assert.match(css, /\.zp-comp-body\{display:flex;/, 'titles are visible without opening the player');
  assert.doesNotMatch(css, /\.zp-comp-body\{display:none/, 'titles are not hidden before playback');
  // Cover-forward cards, roughly 200px wide, two abreast on phones and three
  // across in the tier from 900px.
  assert.match(css, /\.zp-stage\{position:relative;aspect-ratio:1\/1/, 'the covers stay square');
  assert.match(css, /\.zp-comp-grid\{display:grid;grid-template-columns:repeat\(2/, 'two columns on small screens');
  assert.match(css, /@media \(min-width:900px\)\{\.zp-comp-grid\{grid-template-columns:repeat\(3/, 'three across in the press kit tier');
  assert.match(css, /max-width:44rem/, 'the shelf stays cover-sized instead of page-wide');
  assert.match(css, /\.zp-comp-block\{[^}]*border-top:1px solid/, 'the shelf is separated from the profile directory');

  cards.forEach((card, index) => {
    const { album, song, artId } = releases[index];
    const body = /<div class="zp-comp-body">([\s\S]*?)<\/div>/.exec(card)?.[1];
    assert.ok(body, `${album} has a caption`);
    assert.equal(textContent(body), album === song ? album : `${album} ${song}`, `${album} shows only its release and song names`);
    assert.ok(card.includes(`https://f4.bcbits.com/img/a${artId}_16.jpg`), `${album} retains its cover`);
    assert.match(card, /<button class="zp-bc-load" type="button" aria-label="Play /, `${album} retains an accessible play button`);
    assert.doesNotMatch(card, /<iframe\b/, `${album} does not load a player before interaction`);
  });
});

test('each player and no-JavaScript song link retain their original Bandcamp targets', () => {
  cards.forEach((card, index) => {
    const { album, albumId, trackId, href } = releases[index];
    const src = /data-bc-src="([^"]+)"/.exec(card)?.[1];
    assert.ok(src?.startsWith('https://bandcamp.com/EmbeddedPlayer/'), `${album} uses Bandcamp's embed`);
    assert.ok(src.includes(`track=${trackId}/`), `${album} points to the correct track`);
    if (albumId) assert.ok(src.includes(`album=${albumId}/`), `${album} points to the correct album`);
    assert.ok(card.includes(`href="${href}"`), `${album} has its direct listening fallback`);
    assert.match(card, /class="zp-comp-listen"[^>]*target="_blank" rel="noopener" aria-label="[^"]+ on Bandcamp \(opens in a new tab\)"/);
  });
});

class Element {
  constructor(tag, attributes = {}) {
    this.tag = tag;
    this.attributes = attributes;
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    const classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
    this.classList = {
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
    };
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter((node) => node !== child); child.parentNode = null; }
  closest(selector) {
    if (selector.startsWith('.') && this.classList.contains(selector.slice(1))) return this;
    return this.parentNode?.closest(selector) ?? null;
  }
  querySelector(selector) {
    for (const child of this.children) {
      if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) return child;
      const match = child.querySelector(selector);
      if (match) return match;
    }
    return null;
  }
  focus() { this.focused = true; }
}

function playerFixture(src) {
  const card = new Element('li', { class: 'zp-comp-card' });
  const box = card.appendChild(new Element('div', { class: 'zp-bc', 'data-bc-src': src, 'data-bc-title': 'Test song - Bandcamp player' }));
  const stage = box.appendChild(new Element('div', { class: 'zp-stage' }));
  const button = stage.appendChild(new Element('button', { class: 'zp-bc-load' }));
  const icon = button.appendChild(new Element('span', { class: 'zp-play' }));
  const slot = box.appendChild(new Element('div', { class: 'zp-slot' }));
  const inner = slot.appendChild(new Element('div', { class: 'zp-slot-inner' }));
  return { card, box, button, icon, inner };
}

test('selecting a cover creates and focuses its player without changing the other cards', () => {
  const handlers = {};
  const timers = [];
  const document = {
    documentElement: new Element('html'),
    addEventListener: (type, handler) => { handlers[type] = handler; },
    createElement: (tag) => new Element(tag),
  };
  vm.runInNewContext(script, { document, window: { setTimeout: (fn) => timers.push(fn) } });
  assert.ok(document.documentElement.classList.contains('zp-bc-js'));
  assert.equal(typeof handlers.click, 'function');

  const src = 'https://bandcamp.com/EmbeddedPlayer/album=3159294905/track=2534272714/';
  const selected = playerFixture(src);
  const other = playerFixture(src);
  assert.equal(selected.inner.children.length, 0, 'no iframe exists until the cover is selected');
  handlers.click({ target: selected.icon });

  const [frame] = selected.inner.children;
  assert.equal(frame.tag, 'iframe');
  assert.equal(frame.src, src);
  assert.equal(frame.title, 'Test song - Bandcamp player');
  assert.equal(frame.getAttribute('allow'), 'autoplay; encrypted-media');
  assert.equal(frame.getAttribute('referrerpolicy'), 'strict-origin-when-cross-origin');
  assert.ok(frame.focused, 'keyboard focus moves to the player');
  assert.ok(selected.card.classList.contains('zp-open'), 'the embedded player opens');
  assert.equal(selected.button.parentNode, null, 'the cover button is removed after opening');
  assert.equal(other.inner.children.length, 0, 'other players remain unloaded');
  frame.listeners.load();
  assert.ok(frame.classList.contains('zp-ready'), 'the iframe becomes visible on load');
  assert.equal(timers.length, 1, 'a timeout also reveals a slow-loading player');

  // Delegation keeps working on a fresh card after React replaces the static page.
  handlers.click({ target: other.button });
  assert.equal(other.inner.children.length, 1);
  const unsafe = playerFixture('https://example.com/not-bandcamp');
  handlers.click({ target: unsafe.button });
  assert.equal(unsafe.inner.children.length, 0, 'non-Bandcamp embed URLs are rejected');
});
