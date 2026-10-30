#!/usr/bin/env node
/**
 * Dependency-free regression checks for the homepage archive-boot overlay and
 * its "Skip intro" button (#zp-boot-skip).
 *
 * Run: node --test tools/boot-skip.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const sw = fs.readFileSync(new URL('sw.js', root), 'utf8');

const bootCss = /<style id="zp-boot-style">([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
const gateScript = /<script>\s*\/\* ZP ARCHIVE BOOT\s+-\s+gate[\s\S]*?<\/script>/.exec(html)?.[0]
  ?.replace(/^<script>|<\/script>$/g, '') ?? '';
const driverScript = /<script>\s*\/\* ZP ARCHIVE BOOT\s+-\s+silent[\s\S]*?<\/script>/.exec(html)?.[0]
  ?.replace(/^<script>|<\/script>$/g, '') ?? '';
const bootMarkup = /(<div id="zp-boot"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/.exec(html)?.[1] ?? '';

class DomNode {
  constructor(tagName, attrs = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attrs };
    this.id = attrs.id || '';
    this.className = attrs.class || '';
    this.tabIndex = attrs.tabindex !== undefined ? Number(attrs.tabindex) : 0;
    this.textContent = '';
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.focused = false;
    this.ownerDocument = null;
    this.classList = {
      contains: (name) => this.className.split(/\s+/).filter(Boolean).includes(name),
      add: (...names) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        for (const n of names) set.add(n);
        this.className = [...set].join(' ');
      },
      remove: (...names) => {
        const drop = new Set(names);
        this.className = this.className.split(/\s+/).filter((n) => n && !drop.has(n)).join(' ');
      },
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    if (!this.listeners.has(type)) return;
    this.listeners.set(type, this.listeners.get(type).filter((item) => item !== fn));
  }
  dispatchEvent(event) {
    event.target ??= this;
    let stopped = false;
    event.stopPropagation = () => { stopped = true; };
    event.preventDefault ??= () => { event.defaultPrevented = true; };
    for (const fn of [...(this.listeners.get(event.type) ?? [])]) {
      fn.call(this, event);
    }
    if (!stopped && event.bubbles !== false && this.parentNode) {
      this.parentNode.dispatchEvent(event);
    }
    return !event.defaultPrevented;
  }
  appendChild(child) {
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    this.children = this.children.filter((c) => c !== child);
    child.parentNode = null;
    return child;
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
  contains(other) {
    for (let cur = other; cur; cur = cur.parentNode) {
      if (cur === this) return true;
    }
    return false;
  }
  focus() {
    this.focused = true;
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }
}

/** Build a controlled virtual clock + DOM harness to run the shipped boot scripts. */
function mountBoot({
  search = '',
  hash = '',
  userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
  reducedMotion = false,
} = {}) {
  let now = 1_000_000;
  let nextTimerId = 1;
  const timers = new Map();

  const docListeners = new Map();
  const winListeners = new Map();

  const document = {
    activeElement: null,
    documentElement: null,
    body: null,
    nodesById: new Map(),
    createElement(tag) {
      const el = new DomNode(tag);
      el.ownerDocument = document;
      if (tag === 'canvas') el.getContext = () => null;
      return el;
    },
    getElementById(id) {
      return document.nodesById.get(id) ?? null;
    },
    addEventListener(type, fn) {
      if (!docListeners.has(type)) docListeners.set(type, []);
      docListeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      if (!docListeners.has(type)) return;
      docListeners.set(type, docListeners.get(type).filter((item) => item !== fn));
    },
    dispatchEvent(event) {
      event.preventDefault ??= () => { event.defaultPrevented = true; };
      for (const fn of [...(docListeners.get(event.type) ?? [])]) fn(event);
    },
  };

  const make = (tag, attrs = {}, parent = null) => {
    const node = new DomNode(tag, attrs);
    node.ownerDocument = document;
    if (attrs.id) document.nodesById.set(attrs.id, node);
    if (parent) parent.appendChild(node);
    return node;
  };

  const htmlEl = make('html');
  const bodyEl = make('body', {}, htmlEl);
  document.documentElement = htmlEl;
  document.body = bodyEl;
  document.activeElement = bodyEl;

  make('a', { class: 'zp-skip', href: '#root' }, bodyEl);
  const boot = make('div', { id: 'zp-boot', role: 'region', 'aria-label': 'Intro sequence' }, bodyEl);
  const screen = make('div', { class: 'zp-screen' }, boot);
  make('div', { id: 'zp-grain', class: 'zp-grain', 'aria-hidden': 'true' }, screen);
  make('div', { class: 'zp-rift', 'aria-hidden': 'true' }, screen);
  const shell = make('div', { class: 'zp-shell' }, screen);
  const header = make('div', { class: 'zp-header', 'aria-hidden': 'true' }, shell);
  make('span', { id: 'zp-timecode' }, header);
  const content = make('div', { class: 'zp-content', 'aria-hidden': 'true' }, shell);
  make('span', { id: 'zp-signal' }, content);
  make('div', { id: 'zp-term' }, content);
  const deck = make('div', { class: 'zp-deck' }, shell);
  const deckMain = make('div', { class: 'zp-deck-main', 'aria-hidden': 'true' }, deck);
  make('span', { id: 'zp-status' }, deckMain);
  make('span', { id: 'zp-percent' }, deckMain);
  make('div', { id: 'zp-fill' }, deckMain);
  const skipBtn = make('button', { id: 'zp-boot-skip', class: 'zp-skip-btn', type: 'button' }, deck);
  skipBtn.textContent = 'Skip intro';
  const appRoot = make('div', { id: 'root', tabindex: '-1' }, bodyEl);

  const window = {
    location: { search, hash },
    navigator: { userAgent },
    matchMedia: (query) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    }),
    addEventListener(type, fn) {
      if (!winListeners.has(type)) winListeners.set(type, []);
      winListeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      if (!winListeners.has(type)) return;
      winListeners.set(type, winListeners.get(type).filter((item) => item !== fn));
    },
    dispatchEvent(event) {
      for (const fn of [...(winListeners.get(event.type) ?? [])]) fn(event);
    },
  };

  function setTimeoutSim(fn, ms = 0) {
    const id = nextTimerId++;
    timers.set(id, { due: now + Math.max(0, ms), fn });
    return id;
  }
  function clearTimeoutSim(id) {
    timers.delete(id);
  }

  async function advance(ms) {
    const target = now + ms;
    while (true) {
      let earliestId = null;
      let earliest = null;
      for (const [id, entry] of timers.entries()) {
        if (entry.due <= target && (!earliest || entry.due < earliest.due)) {
          earliest = entry;
          earliestId = id;
        }
      }
      if (!earliest) break;
      timers.delete(earliestId);
      now = earliest.due;
      earliest.fn();
      // Let microtasks queued by resolved wait() promises settle in order.
      for (let i = 0; i < 6; i++) await Promise.resolve();
    }
    now = target;
    for (let i = 0; i < 6; i++) await Promise.resolve();
  }

  const sandbox = vm.createContext({
    window,
    document,
    navigator: window.navigator,
    location: window.location,
    matchMedia: window.matchMedia,
    URLSearchParams,
    CustomEvent: class CustomEvent {
      constructor(type) { this.type = type; }
    },
    Date: { now: () => now },
    Math,
    Promise,
    setTimeout: setTimeoutSim,
    clearTimeout: clearTimeoutSim,
  });

  vm.runInContext(gateScript, sandbox);
  vm.runInContext(driverScript, sandbox);

  return { document, window, htmlEl, bodyEl, boot, skipBtn, appRoot, timers, advance };
}

test('skip button markup is accessible, free of aria-hidden ancestors, and styled above the CRT vignette', () => {
  assert.ok(gateScript.length > 0 && driverScript.length > 0, 'both gate and driver scripts exist in index.html');
  assert.match(bootMarkup, /<button\b[^>]*type="button"[^>]*class="zp-skip-btn"[^>]*id="zp-boot-skip"/);
  assert.match(bootMarkup, /<span class="zp-skip-label">Skip intro<\/span>/);
  assert.doesNotMatch(/<div id="zp-boot"[^>]*>/.exec(bootMarkup)[0], /aria-hidden="true"/,
    '#zp-boot root must not be aria-hidden while containing a focusable skip button');

  // Parse open/close div tags inside #zp-boot to confirm zero aria-hidden ancestors wrap #zp-boot-skip.
  const stack = [];
  const tokenRe = /<(div|button)\b([^>]*)>|<\/(div|button)>/gi;
  let buttonAncestors = null;
  for (let m = tokenRe.exec(bootMarkup); m; m = tokenRe.exec(bootMarkup)) {
    if (m[1]) {
      const attrs = m[2] || '';
      stack.push({ tag: m[1].toLowerCase(), attrs });
      if (/\bid="zp-boot-skip"/.test(attrs)) buttonAncestors = [...stack];
    } else {
      stack.pop();
    }
  }
  assert.ok(buttonAncestors && buttonAncestors.length >= 4, 'parsed ancestor chain for #zp-boot-skip');
  for (const ancestor of buttonAncestors) {
    assert.doesNotMatch(ancestor.attrs, /aria-hidden\s*=\s*["']true["']/i,
      `ancestor <${ancestor.tag} ${ancestor.attrs.trim()}> must not hide #zp-boot-skip from assistive tech`);
  }

  // Decorative siblings inside #zp-boot stay aria-hidden so 8-10px HUD copy stays out of page audit trees.
  for (const cls of ['zp-grain', 'zp-rift', 'zp-header', 'zp-content', 'zp-deck-main', 'zp-skip-icon', 'zp-skip-kbd']) {
    const tag = new RegExp(`<[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`).exec(bootMarkup)?.[0] ?? '';
    assert.match(tag, /aria-hidden="true"/, `.${cls} must remain aria-hidden="true"`);
  }

  // Stacking & contrast/tap-target invariants in #zp-boot-style.
  const shellRule = /#zp-boot \.zp-shell\{[^}]*\}/.exec(bootCss)?.[0] ?? '';
  assert.ok(shellRule && !/\bz-index\s*:/.test(shellRule),
    '.zp-shell must keep z-index:auto so .zp-skip-btn (z-index:8) renders above .zp-screen::before (z-index:6)');
  const btnRule = /#zp-boot \.zp-skip-btn\{[^}]*\}/.exec(bootCss)?.[0] ?? '';
  assert.match(btnRule, /z-index:8/);
  assert.match(btnRule, /min-height:48px/);
  assert.match(btnRule, /font:600 12px\/1/);
  assert.match(bootCss, /html\.zp-boot-on \.zp-skip\{display:none\}/);
  assert.match(bootCss, /#zp-boot\.zp-off\.zp-fast\{animation:zpFadeOut \.16s ease forwards\}/);
  // The precached homepage head is now deterministic and the press kit ships a
  // new bundle hash; retire the previous document/asset cache (v59).
  assert.match(sw, /CACHE_NAME\s*=\s*'zazie-v59'/);
});

test('clicking #zp-boot-skip immediately dismisses the intro in fast mode and removes the node', async () => {
  const { htmlEl, bodyEl, boot, skipBtn, appRoot, timers, advance, window } = mountBoot();
  let bootDoneCount = 0;
  window.addEventListener('zp:bootdone', () => { bootDoneCount += 1; });

  assert.ok(htmlEl.classList.contains('zp-boot-on'), 'boot starts active for normal desktop visitor');
  assert.equal(boot.parentNode, bodyEl);

  let propagatedToOverlay = false;
  boot.addEventListener('click', () => { propagatedToOverlay = true; });
  skipBtn.dispatchEvent({ type: 'click', detail: 1, bubbles: true });

  assert.equal(propagatedToOverlay, false, 'button click stops propagation cleanly');
  assert.equal(htmlEl.classList.contains('zp-boot-on'), false, 'zp-boot-on cleared immediately');
  assert.ok(boot.classList.contains('zp-off'), 'zp-off added immediately for pointer-events:none');
  assert.ok(boot.classList.contains('zp-fast'), 'fast 160ms exit class added on skip');
  assert.equal(boot.getAttribute('aria-hidden'), 'true');
  assert.equal(appRoot.focused, false, 'pointer click does not force focus jump');

  await advance(180);
  assert.equal(boot.parentNode, null, 'overlay removed from DOM after 180ms fast dissolve');
  assert.equal(bootDoneCount, 1, 'zp:bootdone emitted once');
  assert.equal(timers.size, 0, 'all timers cleaned up with zero leaks');
});

test('Tab keeps the intro open to focus #zp-boot-skip, while Enter/Space/Escape dismiss and hand focus to #root', async () => {
  // 1. Tab then keyboard button activation (detail === 0)
  const sessionA = mountBoot();
  sessionA.document.dispatchEvent({ type: 'keydown', key: 'Tab', repeat: false });
  assert.ok(sessionA.htmlEl.classList.contains('zp-boot-on'), 'Tab does not prematurely kill the intro');
  sessionA.skipBtn.focus();
  sessionA.skipBtn.dispatchEvent({ type: 'click', detail: 0, bubbles: true });
  assert.equal(sessionA.htmlEl.classList.contains('zp-boot-on'), false);
  assert.ok(sessionA.boot.classList.contains('zp-fast'));
  assert.equal(sessionA.document.activeElement, sessionA.appRoot, 'keyboard button activation moves focus to #root');
  await sessionA.advance(180);
  assert.equal(sessionA.boot.parentNode, null);

  // 2. Direct Escape key press
  const sessionB = mountBoot();
  let escPrevented = false;
  sessionB.document.dispatchEvent({
    type: 'keydown',
    key: 'Escape',
    repeat: false,
    preventDefault() { escPrevented = true; },
  });
  assert.ok(escPrevented);
  assert.equal(sessionB.htmlEl.classList.contains('zp-boot-on'), false);
  assert.equal(sessionB.document.activeElement, sessionB.appRoot, 'Escape moves focus to #root');
});

test('clicking anywhere on the overlay, scrolling, or swiping also skips immediately', () => {
  const clickRun = mountBoot();
  clickRun.boot.dispatchEvent({ type: 'click', detail: 1, bubbles: true });
  assert.ok(clickRun.boot.classList.contains('zp-off') && clickRun.boot.classList.contains('zp-fast'));

  const wheelRun = mountBoot();
  wheelRun.document.dispatchEvent({ type: 'wheel' });
  assert.ok(wheelRun.boot.classList.contains('zp-off') && wheelRun.boot.classList.contains('zp-fast'));

  const swipeRun = mountBoot();
  swipeRun.boot.dispatchEvent({ type: 'pointerdown', clientX: 100, clientY: 200, bubbles: true });
  swipeRun.boot.dispatchEvent({ type: 'pointerup', clientX: 100, clientY: 160, bubbles: true });
  assert.ok(swipeRun.boot.classList.contains('zp-off') && swipeRun.boot.classList.contains('zp-fast'));
});

test('bots, reduced-motion visitors, ?boot=0 and #noboot bypass the intro while ?boot=1 forces it on', async () => {
  assert.equal(mountBoot({ search: '?boot=0' }).htmlEl.classList.contains('zp-boot-on'), false);
  assert.equal(mountBoot({ hash: '#noboot' }).htmlEl.classList.contains('zp-boot-on'), false);
  assert.equal(mountBoot({ reducedMotion: true }).htmlEl.classList.contains('zp-boot-on'), false);
  assert.equal(mountBoot({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }).htmlEl.classList.contains('zp-boot-on'), false);

  const forced = mountBoot({ search: '?boot=1', reducedMotion: true });
  assert.ok(forced.htmlEl.classList.contains('zp-boot-on'));
  assert.ok(forced.htmlEl.classList.contains('zp-boot-force'));

  // Full unskipped run completes cleanly through "THE DARK IS WAITING" -> 100% -> 600ms teardown.
  let doneEvents = 0;
  forced.window.addEventListener('zp:bootdone', () => { doneEvents += 1; });
  await forced.advance(5000);
  assert.match(forced.document.getElementById('zp-status').textContent, /ENTERING THE ARCHIVE/);
  assert.equal(forced.document.getElementById('zp-percent').textContent, '100%');
  assert.equal(forced.boot.classList.contains('zp-fast'), false, 'natural finish preserves CRT power-down');
  assert.equal(forced.boot.parentNode, null);
  assert.equal(doneEvents, 1);
});
