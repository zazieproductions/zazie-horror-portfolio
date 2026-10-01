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
}

function fixture(project) {
  const article = new Element('article', { class: 'zp-vcard' });
  const frame = article.appendChild(new Element('div', { class: 'zp-vframe' }));
  const poster = frame.appendChild(new Element('div', {
    class: 'zp-poster', 'data-video-card': '', 'data-title': project.title,
    ...(project.drive ? { 'data-drive': project.drive } : { 'data-yt': project.yt }),
    role: 'button', tabindex: '0',
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
  };
}

test('early and React players emit the same standard Drive iframe, with native fullscreen allowed', () => {
  const early = earlyPlayer();
  early.zpActivate(early.drive.poster);
  const frame = early.drive.poster.querySelector('iframe');
  const react = reactDrive(reactPlayer()).iframe.props;
  assert.equal(frame.parentElement, early.drive.poster, 'the early iframe must not sit in a hidden wrapper');
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
  assert.equal(early.drive.poster.getAttribute('role'), 'button');
  assert.equal(early.drive.poster.getAttribute('tabindex'), '0');
  early.zpActivate(early.drive.poster);
  assert.equal(early.document.querySelectorAll('iframe').length, 1);
  assert.equal(early.document.querySelectorAll('.zp-drive-fs').length, 1);
  assert.equal(early.yt.poster.querySelector('iframe'), null);
});

test('YouTube parameters and its single-iframe layout stay unchanged', () => {
  const early = earlyPlayer();
  early.zpActivate(early.yt.poster);
  const iframe = early.yt.poster.querySelector('iframe');
  const react = nodes(reactPlayer(youtube.yt).tree).find((node) => node.type === 'iframe');
  assert.equal(iframe.src, react.props.src);
  assert.equal(new URL(iframe.src).hostname, 'www.youtube-nocookie.com');
  assert.equal(new URL(iframe.src).searchParams.get('playsinline'), '1');
  assert.equal(new URL(iframe.src).searchParams.get('fs'), '1');
  assert.equal(early.yt.article.querySelector('.zp-drive-fs'), null);
});

test('Space activates both posters without scrolling the page', () => {
  const early = earlyPlayer();
  early.document.activeElement = early.drive.poster;
  let prevented = 0;
  const event = { key: ' ', currentTarget: early.drive.poster, preventDefault: () => { prevented++; } };
  early.listeners.keydown(event);
  assert.equal(early.window.__zpPlayer.id, eclipsed.drive);
  const react = reactPlayer(null);
  const poster = nodes(react.tree).find((node) => node.props['aria-label'] === 'Play Eclipsed film sample');
  poster.props.onKeyDown(event);
  assert.equal(react.selected, eclipsed.drive);
  assert.equal(prevented, 2);
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
  assert.doesNotMatch(bundledCss, /rotate\(|scale\(|transform\s*:/);
  assert.match(bundledCss, /height:100dvh/);
  assert.match(bundledCss, /\.zp-vcard\.is-drive\{scroll-margin-top:5rem;scroll-margin-bottom:\.5rem\}/);
  assert.match(bundledCss, /\.zp-vcard\.is-drive\{--zp-frame-w:min\(94vw,1600px,calc\(\(100svh - 11rem\)/);
});

test('immutable player assets have fresh content hashes and service-worker precache references', () => {
  for (const file of [jsFile, cssFile]) {
    const hash = createHash('sha256').update(read(file)).digest('hex').slice(0, 8);
    assert.equal(file.split('-')[1].split('.')[0], hash);
    assert.ok(read('sw.js').includes(`'/${file}'`));
  }
  assert.equal(read('sw.js').includes("const CACHE_NAME = 'zazie-v20'"), false);
});
