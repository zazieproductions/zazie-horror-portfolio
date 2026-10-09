#!/usr/bin/env node
/**
 * Dependency-free regression checks for every shipped film-player surface.
 * Run: node --test tools/film-player.test.mjs
 *
 * The original React source is not in this checkout. Evaluate its Projects
 * component with a tiny JSX/hooks fixture, the early inline player and the
 * item-page bundle with a tiny DOM fixture, and the shared self hosted player
 * (src/film/player.js) through all three. These check our markup and
 * behaviour, not a browser's playback engine.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

import { inlinedPlayer, playerSource } from './sync-film-player.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const html = read('index.html');
const jsFile = /import\("\/(index-[a-f\d]+\.js)"\)/.exec(html)[1];
const cssFile = /href="(index-[a-f\d]+\.css)"/.exec(html)[1];
const bundle = read(jsFile);
const css = read(cssFile);
const player = playerSource();
const hlsFile = /HLS_LIB = '\/(hls-[a-f\d]{8}\.js)'/.exec(player)[1];
const itemJs = fs.readdirSync(root).find((file) => /^item-[A-Za-z0-9_-]{8}\.js$/.test(file));
const itemBundle = read(itemJs);
const inline = html.slice(html.indexOf('/* zp-film:start'), html.indexOf('// 4. React Bundle Mount'));
const componentStart = bundle.lastIndexOf('function ', bundle.indexOf('window.__zpPlayer'));
const component = bundle.slice(componentStart, bundle.indexOf('const n1=', componentStart));
const projects = vm.runInNewContext(`(${/projects:(\[.*?\]),images:/.exec(bundle)[1]})`);
const eclipsed = projects.find((project) => project.film);
const youtube = projects.find((project) => project.yt);
const DRIVE_PREVIEW = `https://drive.google.com/file/d/${eclipsed.drive}/preview?autoplay=1`;

/* ------------------------------------------------------------ DOM fixture */

const SELECTOR_TOKEN = /^[a-z]+|\.[\w-]+|\[[\w-]+(?:="[^"]*")?\]/g;

class Element {
  constructor(tagName, attributes = {}) {
    this.tagName = tagName;
    this.attributes = { ...attributes };
    this.className = attributes.class || '';
    this.children = [];
    this.parentElement = null;
    this.listeners = {};
    this.calls = [];
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter((name) => !names.includes(name)).join(' '); },
      toggle: (name, on) => on ? this.classList.add(name) : this.classList.remove(name),
    };
  }
  get parentNode() { return this.parentElement; }
  get firstChild() { return this.children[0] || null; }
  get dataset() {
    return Object.fromEntries(Object.entries(this.attributes)
      .filter(([name]) => name.startsWith('data-'))
      .map(([name, value]) => [name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value]));
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; if (name === 'src') delete this.src; }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  dispatch(name, event = {}) { for (const listener of this.listeners[name] || []) listener({ target: this, currentTarget: this, ...event }); }
  appendChild(child) {
    if (child.parentElement) child.parentElement.removeChild(child);
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  insertBefore(child, before) {
    if (child.parentElement) child.parentElement.removeChild(child);
    child.parentElement = this;
    const index = this.children.indexOf(before);
    this.children.splice(index < 0 ? this.children.length : index, 0, child);
  }
  removeChild(child) {
    this.children = this.children.filter((candidate) => candidate !== child);
    child.parentElement = null;
    return child;
  }
  remove() { this.parentElement?.removeChild(this); }
  matches(selector) {
    const tokens = selector.trim().match(SELECTOR_TOKEN) || [];
    if (tokens.join('') !== selector.trim()) throw new Error(`fixture cannot match selector ${selector}`);
    return tokens.every((token) => {
      if (token.startsWith('.')) return this.classList.contains(token.slice(1));
      if (token.startsWith('[')) {
        const [, name, value] = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(token);
        return this.getAttribute(name) !== null && (value === undefined || this.getAttribute(name) === value);
      }
      return this.tagName === token;
    });
  }
  querySelectorAll(selector) {
    return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  scrollIntoView() {}
  focus(options) { this.calls.push(['focus', options]); }
  play() { this.calls.push(['play']); return Promise.resolve(); }
  pause() { this.calls.push(['pause']); }
  load() { this.calls.push(['load']); }
  canPlayType(type) { return this.ownerDocument?.nativeHls && type === 'application/vnd.apple.mpegurl' ? 'maybe' : ''; }
}

class FakeHls {
  static instances = [];
  static Events = { ERROR: 'hlsError', MEDIA_ATTACHED: 'hlsMediaAttached' };
  static ErrorTypes = { MEDIA_ERROR: 'mediaError', NETWORK_ERROR: 'networkError' };
  static isSupported() { return true; }
  constructor(config) { this.config = config; this.handlers = {}; this.calls = []; FakeHls.instances.push(this); }
  on(event, handler) { (this.handlers[event] ||= []).push(handler); }
  loadSource(src) { this.calls.push(['loadSource', src]); }
  attachMedia(video) { this.calls.push(['attachMedia', video]); }
  recoverMediaError() { this.calls.push(['recoverMediaError']); }
  destroy() { this.calls.push(['destroy']); this.destroyed = true; }
  emit(event, data) { for (const handler of this.handlers[event] || []) handler(event, data); }
}

function makeDocument({ fullscreenEnabled = true, webkitFullscreenEnabled = false, nativeHls = true } = {}) {
  const body = new Element('body');
  const head = new Element('head');
  const listeners = {};
  const document = {
    body, head, fullscreenEnabled, webkitFullscreenEnabled, nativeHls,
    documentElement: new Element('html'),
    activeElement: null,
    scripts: [],
    createElement(tag) { const el = new Element(tag); el.ownerDocument = document; return el; },
    querySelectorAll: (selector) => body.querySelectorAll(selector),
    querySelector: (selector) => body.querySelector(selector),
    addEventListener: (name, listener) => { (listeners[name] ||= []).push(listener); },
    dispatch(name, event) { for (const listener of listeners[name] || []) listener(event); },
  };
  head.appendChild = (node) => { document.scripts.push(node); return node; };
  return document;
}

const makeWindow = (extra = {}) => ({ matchMedia: () => ({ matches: true }), ...extra });
const flush = () => new Promise((resolve) => setImmediate(resolve));

/** Resolve the on-demand hls.js <script> the player injected with the fake library. */
function loadHls(env) {
  const script = env.document.scripts.at(-1);
  assert.ok(script, 'the player should have asked for the hls.js helper');
  assert.equal(script.src, `/${hlsFile}`);
  env.window.Hls = FakeHls;
  script.onload();
  return flush();
}

function card(project) {
  const article = new Element('article', { class: 'zp-vcard' });
  const frame = article.appendChild(new Element('div', { class: 'zp-vframe' }));
  const poster = frame.appendChild(new Element('div', {
    class: 'zp-poster', 'data-video-card': '', 'data-title': project.title,
    ...(project.film ? { 'data-film': project.film, 'data-poster': project.thumb } : {}),
    ...(project.drive ? { 'data-drive': project.drive } : {}),
    ...(project.yt ? { 'data-yt': project.yt } : {}),
    role: 'button', tabindex: '0',
  }));
  poster.appendChild(new Element('img'));
  const caption = article.appendChild(new Element('div'));
  const actions = caption.appendChild(new Element('div', { class: 'zp-vactions' }));
  actions.appendChild(new Element(project.film ? 'span' : 'a'));
  return { article, frame, poster, actions };
}

function earlyPlayer(options = {}) {
  const document = makeDocument(options);
  const window = makeWindow(options.nativeHls === false ? { MediaSource: class {} } : {});
  const film = card(eclipsed);
  const yt = card(youtube);
  document.body.appendChild(film.article);
  document.body.appendChild(yt.article);
  const context = vm.createContext({ document, window });
  vm.runInContext(inline, context);
  return { ...context, document, window, film, yt };
}

/* --------------------------------------------------------- React fixture */

function reactPlayer({ activeId = eclipsed.film, fullscreenEnabled = true, webkitFullscreenEnabled = false, env } = {}) {
  const document = env?.document ?? makeDocument({ fullscreenEnabled, webkitFullscreenEnabled });
  const window = env?.window ?? makeWindow({ __zpPlayer: { id: activeId } });
  document.fullscreenEnabled = fullscreenEnabled;
  document.webkitFullscreenEnabled = webkitFullscreenEnabled;
  const states = [];
  const refs = [];
  let cursor = 0;
  let refCursor = 0;
  const jsx = (type, props) => ({ type, props });
  const context = vm.createContext({
    _: {
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
        return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
      },
      useRef(initial) {
        const index = refCursor++;
        if (!(index in refs)) refs[index] = { current: initial ?? null };
        return refs[index];
      },
      useEffect() {},
    },
    u: { jsx, jsxs: jsx },
    Bt: { article: 'article' },
    It: { projects },
    window,
    document,
    Fv: 'score-icon', Tl: 'external-link-icon', Ai: 'play-icon',
  });
  if (!window.zpFilm) vm.runInContext(player, context);
  const render = () => { cursor = 0; refCursor = 0; return vm.runInContext(`(${component})()`, context); };
  return { render, tree: render(), window, document, get selected() { return states[0]; } };
}

function nodes(tree) {
  if (!tree) return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props.children)];
}
const hasClass = (node, name) => node.props.className?.split(/\s+/).includes(name);
const findClass = (tree, name) => nodes(tree).find((node) => hasClass(node, name));
const activeArticle = (tree) => findClass(tree, 'is-playing');

function reactParts(tree) {
  const article = activeArticle(tree);
  return {
    article,
    frame: findClass(article, 'zp-vframe'),
    actions: findClass(article, 'zp-vactions'),
    mount: findClass(article, 'zp-film-mount'),
    iframe: nodes(article).find((node) => node.type === 'iframe'),
    fullscreen: findClass(article, 'zp-drive-fs'),
  };
}

/** Mount the React film card into a container element and return the pieces. */
function mountReact(react) {
  const parts = reactParts(react.tree);
  const container = react.document.createElement('div');
  container.className = parts.mount.props.className;
  const cleanup = parts.mount.props.ref(container);
  return { ...parts, container, cleanup };
}

const videoIn = (el) => el.querySelector('video.zp-film');
const videoAttrs = (video) => ({ src: video.src, ...video.attributes });

/* -------------------------------------------------------------- the tests */

test('one player source is inlined verbatim in index.html and bundled for the item pages', () => {
  assert.equal(inlinedPlayer(html), player, 'run node tools/sync-film-player.mjs');
  assert.ok(itemBundle.includes('zpFilm') && itemBundle.includes(`/${hlsFile}`), 'item bundle must carry the shared player');
  assert.ok(read('work/eclipsed.html').includes(`/${itemJs}`));
  assert.match(player, /controlslist', 'nodownload'/);
  assert.doesNotMatch(player, /contextmenu/);
});

test('Eclipsed plays in a native video from this domain in both home-page players, with no Drive request', () => {
  const early = earlyPlayer();
  early.zpActivate(early.film.poster);
  const video = videoIn(early.film.poster);
  assert.ok(video, 'the early player must put a <video> in the poster card');
  assert.equal(video.parentElement, early.film.poster);
  assert.equal(video.src, eclipsed.film);
  assert.match(video.src, /^\/media\//);
  assert.equal(video.getAttribute('controls'), '');
  assert.equal(video.getAttribute('playsinline'), '');
  assert.equal(video.getAttribute('preload'), 'metadata');
  assert.equal(video.getAttribute('controlslist'), 'nodownload');
  assert.equal(video.getAttribute('poster'), eclipsed.thumb);
  assert.equal(video.getAttribute('aria-label'), 'Eclipsed: film sample player');
  assert.ok(video.calls.some(([name]) => name === 'play'), 'play() is called inside the visitor gesture');
  assert.ok(video.calls.some(([name, options]) => name === 'focus' && options?.preventScroll));
  assert.equal(early.film.poster.querySelector('iframe'), null);
  assert.equal(early.document.querySelectorAll('iframe').length, 0);
  assert.equal(early.document.scripts.length, 0, 'native HLS needs no helper script');
  assert.equal(early.film.article.classList.contains('is-playing'), true);
  assert.equal(early.film.article.classList.contains('is-film'), true);
  assert.equal(early.film.article.classList.contains('is-drive'), false);
  assert.equal(early.film.actions.querySelector('.zp-drive-fs'), null);
  assert.equal(early.film.poster.getAttribute('role'), null);
  assert.equal(early.window.__zpPlayer.id, eclipsed.film);
  assert.equal(early.window.__zpPlayer.el, video);

  const react = reactPlayer();
  const parts = mountReact(react);
  assert.ok(hasClass(parts.article, 'is-film'));
  assert.equal(hasClass(parts.article, 'is-drive'), false);
  assert.equal(parts.iframe, undefined);
  assert.equal(parts.fullscreen, undefined);
  assert.equal(parts.mount.props.className, 'zp-film-mount absolute inset-0');
  const reactVideo = videoIn(parts.container);
  assert.ok(reactVideo);
  assert.deepEqual(videoAttrs(reactVideo), videoAttrs(video), 'both players must create the identical <video>');
  assert.equal(typeof parts.cleanup, 'function', 'React 19 ref cleanup stops the player on unmount');
});

test('browsers without native HLS load the vendored hls.js once and attach through MediaSource', async () => {
  const early = earlyPlayer({ nativeHls: false });
  early.zpActivate(early.film.poster);
  const video = videoIn(early.film.poster);
  assert.equal(video.src, undefined, 'no playlist is assigned to a video that cannot decode it natively');
  assert.equal(early.document.scripts.length, 1);
  await loadHls(early);
  const hls = FakeHls.instances.at(-1);
  assert.equal(video.__zpHls, hls);
  assert.deepEqual(hls.calls, [['loadSource', eclipsed.film], ['attachMedia', video]]);
  assert.equal(hls.config.enableWorker, false);
  assert.equal(hls.config.capLevelToPlayerSize, true);
  // A replay reuses the loaded library instead of injecting a second script.
  early.zpActivate(early.yt.poster);
  assert.equal(hls.destroyed, true);
  early.zpActivate(early.film.poster);
  await flush();
  assert.equal(early.document.scripts.length, 1);
  assert.equal(FakeHls.instances.at(-1).calls[0][1], eclipsed.film);
  const hashed = createHash('sha256').update(read(hlsFile)).digest('hex').slice(0, 8);
  assert.equal(hlsFile, `hls-${hashed}.js`);
  assert.match(read(hlsFile).slice(0, 400), /hls\.js v1\.7\.3[\s\S]*Apache License/);
});

test('a stream that cannot play falls back to the standard Drive preview with its sizing and fullscreen action', () => {
  const early = earlyPlayer();
  early.zpActivate(early.film.poster);
  const video = videoIn(early.film.poster);
  video.dispatch('error');
  assert.equal(videoIn(early.film.poster), null);
  assert.equal(video.__zpDestroyed, true);
  assert.ok(video.calls.some(([name]) => name === 'pause'));
  const frame = early.film.poster.querySelector('iframe');
  assert.ok(frame, 'the Drive preview replaces the video');
  assert.equal(frame.parentElement, early.film.poster, 'the fallback iframe must not sit in a hidden wrapper');
  assert.equal(frame.src, DRIVE_PREVIEW);
  assert.equal(frame.title, 'Eclipsed: film sample (embedded player)');
  assert.equal(frame.className, 'zp-vembed absolute inset-0 h-full w-full border-0');
  assert.equal(frame.getAttribute('allow'), 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen');
  assert.equal(frame.getAttribute('allowfullscreen'), '');
  assert.equal(frame.getAttribute('referrerpolicy'), 'strict-origin-when-cross-origin');
  assert.equal(early.film.article.classList.contains('is-drive'), true);
  assert.equal(early.film.article.classList.contains('is-film'), false);
  assert.equal(early.film.frame.querySelector('.zp-drive-fs'), null, 'fullscreen action stays below the picture');
  const button = early.film.actions.querySelector('.zp-drive-fs');
  assert.equal(button.getAttribute('aria-label'), 'Fullscreen Eclipsed');
  video.dispatch('error');
  assert.equal(early.document.querySelectorAll('iframe').length, 1, 'fallback happens once');
  assert.equal(early.document.querySelectorAll('.zp-drive-fs').length, 1);

  const react = reactPlayer();
  const mounted = mountReact(react);
  videoIn(mounted.container).dispatch('error');
  const reactFrame = mounted.container.querySelector('iframe');
  assert.equal(reactFrame.src, frame.src);
  assert.equal(reactFrame.title, frame.title);
  assert.equal(reactFrame.className, frame.className);
  assert.equal(reactFrame.getAttribute('allow'), frame.getAttribute('allow'));
  const rerendered = reactParts(react.render());
  assert.ok(hasClass(rerendered.article, 'is-drive'));
  assert.equal(hasClass(rerendered.article, 'is-film'), false);
  assert.ok(rerendered.mount, 'the mount node (and the iframe inside it) survives the re-render');
  assert.equal(nodes(rerendered.frame).some((node) => node.type === 'button'), false);
  assert.equal(findClass(rerendered.actions, 'zp-drive-fs'), rerendered.fullscreen);
  assert.equal(rerendered.fullscreen.props['aria-label'], button.getAttribute('aria-label'));
});

test('hls.js fatal errors recover once from a media error and otherwise fall back', async () => {
  const early = earlyPlayer({ nativeHls: false });
  early.zpActivate(early.film.poster);
  await loadHls(early);
  const hls = FakeHls.instances.at(-1);
  hls.emit(FakeHls.Events.ERROR, { fatal: false, type: FakeHls.ErrorTypes.NETWORK_ERROR });
  hls.emit(FakeHls.Events.ERROR, { fatal: true, type: FakeHls.ErrorTypes.MEDIA_ERROR });
  assert.ok(hls.calls.some(([name]) => name === 'recoverMediaError'));
  assert.ok(videoIn(early.film.poster), 'one media error is recovered, not surrendered');
  hls.emit(FakeHls.Events.ERROR, { fatal: true, type: FakeHls.ErrorTypes.NETWORK_ERROR });
  assert.equal(hls.destroyed, true);
  assert.equal(videoIn(early.film.poster), null);
  assert.equal(early.film.poster.querySelector('iframe').src, DRIVE_PREVIEW);
  assert.equal(early.film.article.classList.contains('is-drive'), true);
});

test('without MediaSource or hls.js the card falls straight back to Drive', async () => {
  const early = earlyPlayer({ nativeHls: false });
  delete early.window.MediaSource;
  early.zpActivate(early.film.poster);
  assert.equal(videoIn(early.film.poster), null);
  assert.equal(early.film.poster.querySelector('iframe').src, DRIVE_PREVIEW);
  assert.equal(early.document.scripts.length, 0);

  const blocked = earlyPlayer({ nativeHls: false });
  blocked.zpActivate(blocked.film.poster);
  blocked.document.scripts.at(-1).onerror();
  await flush();
  assert.equal(videoIn(blocked.film.poster), null);
  assert.equal(blocked.film.poster.querySelector('iframe').src, DRIVE_PREVIEW);
});

test('the React mount adopts the video the early player started instead of restarting it, and unmount stops it', () => {
  const early = earlyPlayer();
  early.zpActivate(early.film.poster);
  const video = videoIn(early.film.poster);
  const playsBefore = video.calls.filter(([name]) => name === 'play').length;
  const react = reactPlayer({ env: early });
  assert.equal(react.selected, eclipsed.film, 'React seeds its active card from window.__zpPlayer');
  const mounted = mountReact(react);
  assert.equal(videoIn(mounted.container), video, 'the same element moves, buffer and position intact');
  assert.equal(video.parentElement, mounted.container);
  assert.equal(videoIn(early.film.poster), null);
  assert.equal(video.__zpDestroyed, undefined);
  assert.equal(video.calls.filter(([name]) => name === 'play').length, playsBefore + 1);
  mounted.cleanup();
  assert.equal(videoIn(mounted.container), null);
  assert.equal(video.__zpDestroyed, true);
  assert.ok(video.calls.some(([name]) => name === 'pause'));
  assert.ok(video.calls.some(([name]) => name === 'load'));
  assert.equal(video.getAttribute('src'), null);
  assert.equal(early.window.__zpPlayer.el, null);
});

test('switching films stops the native player and restores the poster button; replay stays single-player', () => {
  const early = earlyPlayer();
  early.zpActivate(early.film.poster);
  const video = videoIn(early.film.poster);
  early.zpActivate(early.yt.poster);
  assert.equal(video.__zpDestroyed, true);
  assert.equal(early.document.querySelectorAll('video').length, 0);
  assert.equal(early.document.querySelectorAll('iframe').length, 1);
  assert.equal(early.film.article.classList.contains('is-film'), false);
  assert.equal(early.film.article.classList.contains('is-playing'), false);
  assert.equal(early.film.poster.getAttribute('role'), 'button');
  assert.equal(early.film.poster.getAttribute('tabindex'), '0');
  assert.equal(early.film.poster.getAttribute('aria-label'), 'Play Eclipsed film sample');
  early.zpActivate(early.film.poster);
  assert.equal(early.document.querySelectorAll('video').length, 1);
  assert.equal(early.document.querySelectorAll('iframe').length, 0);
  assert.notEqual(videoIn(early.film.poster), video);
  // A fallback frame is cleared the same way.
  videoIn(early.film.poster).dispatch('error');
  early.zpActivate(early.yt.poster);
  assert.equal(early.film.poster.querySelector('iframe'), null);
  assert.equal(early.film.article.classList.contains('is-drive'), false);
  assert.equal(early.film.actions.querySelector('.zp-drive-fs'), null);
});

test('clicks and keys inside a live card never restart it; Space activates both posters without scrolling', () => {
  const early = earlyPlayer();
  early.document.activeElement = early.film.poster;
  let prevented = 0;
  const event = { key: ' ', currentTarget: early.film.poster, preventDefault: () => { prevented++; } };
  early.document.dispatch('keydown', event);
  assert.equal(early.window.__zpPlayer.id, eclipsed.film);
  const video = videoIn(early.film.poster);
  early.document.activeElement = video;
  early.document.dispatch('keydown', event); // Space on the focused video is the browser's play/pause
  early.document.dispatch('click', { target: video, preventDefault: () => { prevented++; } });
  assert.equal(videoIn(early.film.poster), video, 'the live card is not re-activated');
  assert.equal(prevented, 1);
  const react = reactPlayer({ activeId: null });
  const poster = nodes(react.tree).find((node) => node.props['aria-label'] === 'Play Eclipsed film sample');
  poster.props.onKeyDown(event);
  assert.equal(react.selected, eclipsed.film);
  assert.equal(prevented, 2);
});

test('fullscreen (standard, prefixed, unavailable, rejected) behaves the same for the Drive fallback in both players', async () => {
  const fallen = (options = {}) => {
    const early = earlyPlayer(options);
    early.zpActivate(early.film.poster);
    videoIn(early.film.poster).dispatch('error');
    return early;
  };
  const reactFallen = (options = {}) => {
    const react = reactPlayer(options);
    videoIn(mountReact(react).container).dispatch('error');
    return reactParts(react.render());
  };
  assert.equal(fallen({ fullscreenEnabled: false }).film.article.querySelector('.zp-drive-fs'), null);
  assert.equal(reactFallen({ fullscreenEnabled: false }).fullscreen, undefined);
  assert.ok(fallen({ fullscreenEnabled: false, webkitFullscreenEnabled: true }).film.actions.querySelector('.zp-drive-fs'));
  assert.ok(reactFallen({ fullscreenEnabled: false, webkitFullscreenEnabled: true }).fullscreen);

  const early = fallen();
  const button = early.film.actions.querySelector('.zp-drive-fs');
  const react = reactFallen().fullscreen;
  let calls = 0;
  let stopped = 0;
  early.film.frame.requestFullscreen = function() {
    assert.equal(this, early.film.frame);
    calls++;
    return Promise.reject(new Error('Fullscreen denied'));
  };
  const event = { currentTarget: button, stopPropagation: () => { stopped++; } };
  button.dispatch('click', event);
  react.props.onClick(event);
  await flush();
  assert.equal(calls, 2);
  assert.equal(stopped, 2);
  delete early.film.frame.requestFullscreen;
  early.film.frame.webkitRequestFullscreen = function() { calls++; };
  button.dispatch('click', event);
  react.props.onClick(event);
  assert.equal(calls, 4);
});

test('YouTube parameters and its single-iframe layout stay unchanged', () => {
  const early = earlyPlayer();
  early.zpActivate(early.yt.poster);
  const iframe = early.yt.poster.querySelector('iframe');
  const react = nodes(reactPlayer({ activeId: youtube.yt }).tree).find((node) => node.type === 'iframe');
  assert.equal(iframe.src, react.props.src);
  assert.equal(new URL(iframe.src).hostname, 'www.youtube-nocookie.com');
  assert.equal(new URL(iframe.src).searchParams.get('playsinline'), '1');
  assert.equal(new URL(iframe.src).searchParams.get('fs'), '1');
  assert.equal(early.yt.article.querySelector('.zp-drive-fs'), null);
  assert.equal(early.yt.article.querySelector('video'), null);
});

test('the item page turns the prerendered poster button into the same native player', () => {
  const page = read('work/eclipsed.html');
  const embed = /<div class="entry-embed entry-film"([^>]*)>/.exec(page);
  assert.ok(embed, 'the Eclipsed entry prerenders the self hosted player hook');
  const attrs = Object.fromEntries([...embed[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
  assert.equal(attrs['data-film'], eclipsed.film);
  assert.equal(attrs['data-drive'], eclipsed.drive);
  assert.equal(attrs['data-poster'], eclipsed.thumb);
  assert.match(page, /<button type="button" class="entry-play" aria-label="Play ECLIPSED project sample">/);
  assert.doesNotMatch(page, /<iframe/);

  const document = makeDocument();
  const window = makeWindow();
  const container = document.body.appendChild(new Element('div', { class: 'entry-embed entry-film', ...attrs }));
  const button = container.appendChild(new Element('button', { class: 'entry-play' }));
  container.appendChild(new Element('p', { class: 'entry-noscript' }));
  vm.runInContext(itemBundle, vm.createContext({ document, window, Array }));
  assert.ok(document.documentElement.classList.contains('has-item-js'));
  button.dispatch('click');
  assert.ok(container.classList.contains('is-live'));
  const video = videoIn(container);
  assert.equal(video.src, eclipsed.film);
  assert.equal(video.getAttribute('aria-label'), 'ECLIPSED project sample: film sample player');
  assert.equal(video.getAttribute('controlslist'), 'nodownload');
  assert.equal(window.__zpPlayer.id, eclipsed.film);
  button.dispatch('click');
  assert.equal(container.querySelectorAll('video').length, 1, 'a second press does not restart the sample');
  video.dispatch('error');
  assert.equal(container.querySelector('iframe').src, DRIVE_PREVIEW);
  assert.ok(container.classList.contains('is-drive'));
});

test('the stream is never published: no sitemap, schema, Open Graph, robots or deep link exposes /media or the Drive file', () => {
  const page = read('work/eclipsed.html');
  assert.doesNotMatch(page, /VideoObject|og:video|drive\.google\.com\/file\/d\/[^"]+\/view/);
  assert.match(page, /<meta property="og:type" content="website"/);
  const sitemap = read('sitemap.xml');
  assert.doesNotMatch(sitemap, /\/media\/|drive\.google\.com/);
  assert.match(read('robots.txt'), /^Disallow: \/media\/$/m);
  const headers = read('_headers');
  assert.match(headers, /\n\/media\/\*\n(?:  .+\n)*  X-Robots-Tag: noindex, nofollow, noarchive\n/);
  assert.match(headers, /media-src 'self' blob: /);
  assert.doesNotMatch(html, /Open Eclipsed on Google Drive|\/file\/d\/[^"]+\/view/);
  assert.match(bundle, /n\.film\?u\.jsx\("span",\{className:"zp-vprivate"/, 'React renders no external link for the self hosted sample');
  assert.doesNotMatch(read('work/index.html'), /drive\.google\.com/);
  assert.equal(read('work/index.html'), read('work.html'));
  assert.match(read('privacy/index.html'), /Only as a fallback/);
});

test('all prerendered film captions provide an action slot; Eclipsed shows the private-reel label in both DOMs', () => {
  const section = html.slice(html.indexOf('<section id="work"'), html.indexOf('</section>', html.indexOf('<section id="work"')));
  assert.equal((section.match(/class="zp-vactions"/g) || []).length, projects.length);
  assert.match(section, /<div class="zp-vactions"><span class="zp-vprivate" title="[^"]+">Private reel<\/span><\/div>/);
  const label = findClass(reactPlayer({ activeId: null }).tree, 'zp-vprivate');
  assert.equal(label.props.children, 'Private reel');
  assert.match(section, new RegExp(`data-film="${eclipsed.film}" data-poster="${eclipsed.thumb}" data-drive="${eclipsed.drive}"`));
  assert.equal(html.includes('data-drive-preview'), false);
  assert.equal(html.includes('rm=minimal'), false);
  assert.equal(bundle.includes('rm=minimal'), false);
});

test('inline and bundled cinema CSS match: native video fills the frame, Drive sizing only for the fallback', () => {
  const start = '/* Cinema players stay upright';
  const inlineCss = html.slice(html.indexOf(start), html.indexOf('</style>', html.indexOf(start))).trim();
  const bundledCss = css.slice(css.indexOf(start)).trim();
  assert.equal(inlineCss, bundledCss);
  assert.match(bundledCss, /\.zp-vframe video\.zp-film\{\s*position:absolute;inset:0;display:block;\s*width:100%!important;height:100%!important;\s*border:0;background:#000;object-fit:contain;\s*\}/);
  assert.match(bundledCss, /\.zp-poster\.is-live>\*:not\(iframe\):not\(video\)\{display:none!important\}/);
  assert.match(bundledCss, /\.zp-vcard\.is-drive,\.zp-vcard\.is-film\{scroll-margin-top:5rem;scroll-margin-bottom:\.5rem\}/);
  assert.match(bundledCss, /\.zp-vprivate\{/);
  const buttonCss = /\.zp-drive-fs\{([^}]+)\}/.exec(bundledCss)[1];
  assert.doesNotMatch(buttonCss, /position\s*:|z-index\s*:|backdrop-filter\s*:/);
  assert.match(buttonCss, /width:44px;height:44px/);
  assert.match(bundledCss, /@media \(max-width:767px\)\{\s*\.zp-vcard\.is-drive \.zp-vframe\{min-height:240px\}/);
  assert.doesNotMatch(bundledCss, /rotate\(|scale\(|(?<![\w-])transform\s*:/);
  assert.match(bundledCss, /height:100dvh/);
  assert.match(bundledCss, /\.zp-vcard\.is-drive\{--zp-frame-w:min\(94vw,1600px,calc\(\(100svh - 11rem\)/);
  const itemCss = read(fs.readdirSync(root).find((file) => /^item-[A-Za-z0-9_-]{8}\.css$/.test(file)));
  assert.match(itemCss, /\.entry-embed video\.zp-film\{position:absolute;(?:inset:0|top:0;right:0;bottom:0;left:0);display:block;width:100%;height:100%;border:0;background:#000;object-fit:contain/);
  assert.match(itemCss, /\.entry-film\.is-live \.entry-play/);
});

test('immutable player assets have fresh content hashes and service-worker references', () => {
  for (const file of [jsFile, cssFile]) {
    const hash = createHash('sha256').update(read(file)).digest('hex').slice(0, 8);
    assert.equal(file.split('-')[1].split('.')[0], hash);
    assert.ok(read('sw.js').includes(`'/${file}'`));
  }
  const sw = read('sw.js');
  assert.doesNotMatch(sw, /const CACHE_NAME = 'zazie-v(?:[12]\d|29)'/);
  assert.match(sw, /url\.pathname\.startsWith\('\/media\/'\)\) return;/);
  assert.ok(fs.existsSync(new URL(hlsFile, root)));
  assert.equal(sw.includes(hlsFile), false, 'hls.js is fetched on demand, not precached for every visitor');
});
