#!/usr/bin/env node
/**
 * Dependency-free regression checks for both shipped film-player implementations.
 * Run: node --test tools/film-player.test.mjs
 *
 * The original React source is not in this checkout. Evaluate its Projects
 * component with a tiny JSX/hooks fixture, and the early inline player with a
 * tiny DOM fixture. These check our markup/behavior, not Google's playback UI.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const html = read('index.html');
const jsFile = /import\("\/(index-[a-f\d]+\.js)"\)/.exec(html)[1];
const cssFile = /href="(index-[a-f\d]+\.css)"/.exec(html)[1];
const bundle = read(jsFile);
const css = read(cssFile);
const inline = html.slice(html.indexOf('var ZP_ALLOW_YT'), html.indexOf('// 4. React Bundle Mount'));
const projectsOffset = bundle.indexOf('className:"zp-vcard');
const component = bundle.slice(bundle.lastIndexOf('function ', projectsOffset), bundle.indexOf('const n1=', projectsOffset));
const projects = vm.runInNewContext(`(${/projects:(\[.*?\]),images:/.exec(bundle)[1]})`);
const eclipsed = projects.find((project) => project.drive);
const youtube = projects.find((project) => project.yt);

class Element {
  constructor(tagName, attributes = {}) {
    this.tagName = tagName;
    this.attributes = { ...attributes };
    this.className = attributes.class || '';
    this.children = [];
    this.parentElement = null;
    this.listeners = {};
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter((name) => !names.includes(name)).join(' '); },
      toggle: (name, on) => on ? this.classList.add(name) : this.classList.remove(name),
    };
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  get firstChild() { return this.children[0] || null; }
  insertBefore(child, before) {
    child.parentElement = this;
    const index = this.children.indexOf(before);
    this.children.splice(index < 0 ? this.children.length : index, 0, child);
  }
  remove() {
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }
  replaceWith(replacement) {
    const parent = this.parentElement;
    const index = parent.children.indexOf(this);
    replacement.parentElement = parent;
    parent.children[index] = replacement;
    this.parentElement = null;
  }
  cloneNode(deep = false) {
    const clone = new Element(this.tagName, { ...this.attributes, class: this.className });
    if (deep) this.children.forEach((child) => clone.appendChild(child.cloneNode(true)));
    return clone;
  }
  matches(selector) {
    if (selector.startsWith('[data-video-card]')) {
      return this.getAttribute('data-video-card') !== null &&
        (selector === '[data-video-card]' || this.classList.contains('is-live'));
    }
    if (selector.startsWith('.')) return selector.slice(1).split('.').every((name) => this.classList.contains(name));
    return this.tagName === selector;
  }
  querySelectorAll(selector) {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  scrollIntoView() {}
  focus() { this.focused = true; }
}

function fixture(project) {
  const article = new Element('article', { class: 'zp-vcard' });
  const frame = article.appendChild(new Element('div', { class: 'zp-vframe' }));
  const poster = frame.appendChild(new Element('button', {
    type: 'button', class: 'zp-poster', 'data-video-card': '', 'data-title': project.title,
    ...(project.drive ? { 'data-drive': project.drive } : { 'data-yt': project.yt }),
    'aria-label': `Play ${project.title} film sample`,
  }));
  poster.appendChild(new Element('img'));
  const caption = article.appendChild(new Element('div'));
  const actions = caption.appendChild(new Element('div', { class: 'zp-vactions' }));
  actions.appendChild(new Element('a'));
  return { article, frame, poster, actions };
}

function earlyPlayer(fullscreenEnabled = true, webkitFullscreenEnabled = false) {
  const drive = fixture(eclipsed);
  const yt = fixture(youtube);
  const body = new Element('body');
  body.appendChild(drive.article);
  body.appendChild(yt.article);
  const listeners = {};
  const document = {
    body, fullscreenEnabled, webkitFullscreenEnabled,
    activeElement: null,
    createElement: (tag) => new Element(tag),
    querySelectorAll: (selector) => body.querySelectorAll(selector),
    addEventListener: (name, listener) => { listeners[name] = listener; },
  };
  const context = vm.createContext({ document, window: { matchMedia: () => ({ matches: true }) } });
  vm.runInContext(inline, context);
  return { ...context, drive, yt, listeners };
}

function reactPlayer(activeId = eclipsed.drive, fullscreenEnabled = true, webkitFullscreenEnabled = false) {
  let selected;
  const jsx = (type, props) => ({ type, props });
  const context = vm.createContext({
    _: {
      useState: (initial) => [initial(), (id) => { selected = id; }],
      useRef: () => ({ current: null }),
      useEffect() {},
    },
    u: { jsx, jsxs: jsx },
    Bt: { article: 'article' },
    It: { projects },
    window: { __zpPlayer: { id: activeId } },
    document: { fullscreenEnabled, webkitFullscreenEnabled },
    Fv: 'score-icon', Tl: 'external-link-icon', Ai: 'play-icon',
  });
  const tree = vm.runInContext(`(${component})()`, context);
  return { tree, get selected() { return selected; } };
}

function nodes(tree) {
  if (!tree) return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props.children)];
}
const hasClass = (node, name) => node.props.className?.split(/\s+/).includes(name);
const findClass = (tree, name) => nodes(tree).find((node) => hasClass(node, name));

function reactDrive(player) {
  const article = findClass(player.tree, 'is-drive');
  return {
    article,
    frame: findClass(article, 'zp-vframe'),
    actions: findClass(article, 'zp-vactions'),
    iframe: nodes(article).find((node) => node.type === 'iframe'),
    fullscreen: findClass(article, 'zp-drive-fs'),
    close: findClass(article, 'zp-player-close'),
  };
}

test('early and React players emit the same standard Drive iframe, with native fullscreen allowed', () => {
  const early = earlyPlayer();
  early.zpActivate(early.drive.poster);
  const livePoster = early.drive.article.querySelector('[data-video-card].is-live');
  const frame = early.drive.article.querySelector('iframe');
  const react = reactDrive(reactPlayer()).iframe.props;
  assert.equal(livePoster.tagName, 'div', 'the active player wrapper is non-interactive');
  assert.equal(frame.parentElement, livePoster, 'the early iframe must not sit in a hidden wrapper');
  assert.equal(frame.src, react.src);
  assert.equal(frame.title, react.title);
  assert.equal(frame.className, react.className);
  assert.equal(frame.getAttribute('allow'), react.allow);
  assert.equal(frame.getAttribute('referrerpolicy'), react.referrerPolicy);
  assert.equal(frame.getAttribute('allowfullscreen'), '');
  assert.equal(react.allowFullScreen, true);
  const url = new URL(frame.src);
  assert.equal(url.pathname, `/file/d/${eclipsed.drive}/preview`);
  assert.deepEqual([...url.searchParams], [['autoplay', '1']]);
});

test('fullscreen actions are below the picture, never inside the iframe frame, in both implementations', () => {
  const early = earlyPlayer();
  early.zpActivate(early.drive.poster);
  assert.equal(early.drive.frame.querySelector('.zp-drive-fs'), null);
  const button = early.drive.actions.querySelector('.zp-drive-fs');
  assert.equal(button.getAttribute('aria-label'), 'Fullscreen Eclipsed');
  const react = reactDrive(reactPlayer());
  assert.equal(nodes(react.frame).some((node) => node.type === 'button'), false);
  assert.equal(findClass(react.actions, 'zp-drive-fs'), react.fullscreen);
  assert.equal(react.fullscreen.props['aria-label'], button.getAttribute('aria-label'));
});

test('browsers without element fullscreen get native controls, not an inert custom button', () => {
  const early = earlyPlayer(false);
  early.zpActivate(early.drive.poster);
  assert.equal(early.drive.article.querySelector('.zp-drive-fs'), null);
  assert.equal(reactDrive(reactPlayer(eclipsed.drive, false)).fullscreen, undefined);
  assert.equal(early.drive.frame.querySelectorAll('iframe').length, 1);
});

test('prefixed WebKit fullscreen remains available where supported', () => {
  const early = earlyPlayer(false, true);
  early.zpActivate(early.drive.poster);
  assert.ok(early.drive.actions.querySelector('.zp-drive-fs'));
  assert.ok(reactDrive(reactPlayer(eclipsed.drive, false, true)).fullscreen);
});

test('active embeds provide a focused, keyboard-accessible close control in both implementations', () => {
  const early = earlyPlayer();
  early.zpActivate(early.drive.poster);
  const close = early.drive.article.querySelector('.zp-player-close');
  assert.equal(close.tagName, 'button');
  assert.equal(close.getAttribute('aria-label'), 'Close Eclipsed player');
  assert.equal(close.focused, true);
  close.listeners.click({ stopPropagation() {} });
  assert.equal(early.window.__zpPlayer, null);
  assert.equal(early.drive.article.querySelector('iframe'), null);
  assert.equal(early.drive.article.querySelector('[data-video-card]').focused, true);

  const reactState = reactPlayer();
  const react = reactDrive(reactState);
  assert.equal(react.close.type, 'button');
  assert.equal(react.close.props['aria-label'], 'Close Eclipsed player');
  assert.match(bundle, /const close=c\.querySelector\("\.zp-player-close"\);if\(close\)close\.focus\(\)/);
  assert.match(bundle, /const trigger=c\.querySelector\("\.zp-poster"\);if\(trigger\)trigger\.focus\(\)/);
  react.close.props.onClick({ stopPropagation() {} });
  assert.equal(reactState.selected, null);
});

test('fullscreen targets only the film frame and handles API rejection in both implementations', async () => {
  const early = earlyPlayer();
  early.zpActivate(early.drive.poster);
  const button = early.drive.actions.querySelector('.zp-drive-fs');
  const react = reactDrive(reactPlayer()).fullscreen;
  let calls = 0;
  let stopped = 0;
  early.drive.frame.requestFullscreen = function() {
    assert.equal(this, early.drive.frame);
    calls++;
    return Promise.reject(new Error('Fullscreen denied'));
  };
  const event = { currentTarget: button, stopPropagation: () => { stopped++; } };
  button.listeners.click(event);
  react.props.onClick(event);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 2);
  assert.equal(stopped, 2);
  delete early.drive.frame.requestFullscreen;
  early.drive.frame.webkitRequestFullscreen = function() { calls++; };
  button.listeners.click(event);
  react.props.onClick(event);
  assert.equal(calls, 4);
});

test('switching films removes the prior iframe, Drive sizing and fullscreen action; replay stays single-player', () => {
  const early = earlyPlayer();
  early.zpActivate(early.drive.poster);
  early.zpActivate(early.yt.poster);
  assert.equal(early.document.querySelectorAll('iframe').length, 1);
  assert.equal(early.drive.article.classList.contains('is-drive'), false);
  assert.equal(early.drive.actions.querySelector('.zp-drive-fs'), null);
  const restoredPoster = early.drive.article.querySelector('[data-video-card]');
  assert.equal(restoredPoster.tagName, 'button');
  assert.equal(restoredPoster.getAttribute('role'), null);
  assert.equal(restoredPoster.getAttribute('tabindex'), null);
  early.zpActivate(restoredPoster);
  assert.equal(early.document.querySelectorAll('iframe').length, 1);
  assert.equal(early.document.querySelectorAll('.zp-drive-fs').length, 1);
  assert.equal(early.yt.article.querySelector('iframe'), null);
});

test('YouTube parameters and its single-iframe layout stay unchanged', () => {
  const early = earlyPlayer();
  early.zpActivate(early.yt.poster);
  const iframe = early.yt.article.querySelector('iframe');
  const react = nodes(reactPlayer(youtube.yt).tree).find((node) => node.type === 'iframe');
  assert.equal(iframe.src, react.props.src);
  assert.equal(new URL(iframe.src).hostname, 'www.youtube-nocookie.com');
  assert.equal(new URL(iframe.src).searchParams.get('playsinline'), '1');
  assert.equal(new URL(iframe.src).searchParams.get('fs'), '1');
  assert.equal(early.yt.article.querySelector('.zp-drive-fs'), null);
});

test('film posters use native buttons and do not install custom keyboard interception', () => {
  const early = earlyPlayer();
  const event = { target: early.drive.poster, preventDefault() { throw new Error('native button click must not be canceled'); } };
  early.listeners.click(event);
  assert.equal(early.window.__zpPlayer.id, eclipsed.drive);
  const react = reactPlayer(null);
  const poster = nodes(react.tree).find((node) => node.props['aria-label'] === 'Play Eclipsed film sample');
  assert.equal(poster.type, 'button');
  assert.equal(poster.props.type, 'button');
  assert.equal(poster.props.role, undefined);
  assert.equal(poster.props.tabIndex, undefined);
  assert.equal(poster.props.onKeyDown, undefined);
  assert.equal(react.selected, undefined);
  assert.equal((html.match(/<button type="button" aria-label="Play [^"]+ film sample" data-video-card/g) || []).length, 8);
  assert.doesNotMatch(html, /role="button"|tabindex="0"/);
  assert.doesNotMatch(inline, /addEventListener\("keydown"/);
});

test('all prerendered film captions provide an action slot and the duplicate Drive loader is gone', () => {
  const section = html.slice(html.indexOf('<section id="work"'), html.indexOf('</section>', html.indexOf('<section id="work"')));
  assert.equal((section.match(/class="zp-vactions"/g) || []).length, projects.length);
  assert.equal(html.includes('data-drive-preview'), false);
  assert.equal(html.includes('rm=minimal'), false);
  assert.equal(bundle.includes('rm=minimal'), false);
  assert.equal(read('work/index.html').includes('rm=minimal'), false);
  assert.equal(read('work/index.html'), read('work.html'));
});

test('inline and bundled cinema CSS match: no overlaid actions, mobile room and upright fullscreen', () => {
  const start = '/* Cinema players stay upright';
  const inlineCss = html.slice(html.indexOf(start), html.indexOf('</style>', html.indexOf(start))).trim();
  const bundledCss = css.slice(css.indexOf(start)).trim();
  assert.equal(inlineCss, bundledCss);
  const buttonCss = /\.zp-drive-fs\{([^}]+)\}/.exec(bundledCss)[1];
  assert.doesNotMatch(buttonCss, /position\s*:|z-index\s*:|backdrop-filter\s*:/);
  assert.match(buttonCss, /width:44px;height:44px/);
  assert.match(bundledCss, /@media \(max-width:767px\)\{\s*\.zp-vcard\.is-drive \.zp-vframe\{min-height:240px\}/);
  assert.doesNotMatch(bundledCss, /rotate\(|scale\(|(?:^|[;{])\s*transform\s*:/m);
  assert.match(bundledCss, /height:100dvh/);
  assert.match(bundledCss, /\.zp-vcard\.is-drive\{scroll-margin-top:5rem;scroll-margin-bottom:\.5rem\}/);
  assert.match(bundledCss, /\.zp-vcard\.is-drive\{--zp-frame-w:min\(94vw,1600px,calc\(\(100svh - 11rem\)/);
});

test('showreel player starts with The Fatal Overdose in both the static page and playlist', () => {
  const tracksSource = /tracks:(\[.*?\]),projects:/.exec(bundle)?.[1];
  assert.ok(tracksSource, 'homepage bundle contains the cue playlist');
  const tracks = vm.runInNewContext(`(${tracksSource})`);
  assert.equal(tracks.length, 32);
  assert.equal(tracks[0].title, 'The Fatal Overdose');
  assert.equal(tracks[0].src, '/audio/track-12.mp3');
  assert.deepEqual(Array.from(tracks, (track) => track.id), Array.from({ length: 32 }, (_, index) => index));

  const sectionStart = html.indexOf('<section id="showreel"');
  const section = html.slice(sectionStart, html.indexOf('</section>', sectionStart));
  assert.ok(section.includes('Now playing</p><h3 class="mb-1 truncate font-display text-xl text-bone sm:text-2xl md:text-4xl">The Fatal Overdose</h3>'));
  assert.ok(section.includes('<span class="w-7 shrink-0 text-[11px] tabular-nums text-mist sm:w-8">01</span><div class="min-w-0 flex-1"><p class="truncate font-display text-base sm:text-lg md:text-xl text-blood">The Fatal Overdose</p>'));
  assert.equal(section.includes('<span class="w-7 shrink-0 text-[11px] tabular-nums text-mist sm:w-8">01</span><div class="min-w-0 flex-1"><p class="truncate font-display text-base sm:text-lg md:text-xl text-blood">Needle in The Nerve</p>'), false);
});

test('immutable player assets have fresh content hashes and service-worker precache references', () => {
  for (const file of [jsFile, cssFile]) {
    const hash = createHash('sha256').update(read(file)).digest('hex').slice(0, 8);
    assert.equal(file.split('-')[1].split('.')[0], hash);
    assert.ok(read('sw.js').includes(`'/${file}'`));
  }
  assert.equal(read('sw.js').includes("const CACHE_NAME = 'zazie-v20'"), false);
});
