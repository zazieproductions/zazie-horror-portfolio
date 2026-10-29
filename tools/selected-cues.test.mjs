import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../selected-cues.js', import.meta.url), 'utf8');

function harness({ reduced = false, webAudio = true, blocked = false } = {}) {
  const listeners = new Map();
  const frames = new Map();
  let nextFrame = 1;
  let contexts = 0;
  let sources = 0;
  let draws = 0;
  const classes = new Set();
  const pen = { clearRect() {}, fillRect() { draws++; }, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} };
  const canvas = { clientWidth: 240, clientHeight: 54, width: 0, height: 0, getContext: () => pen };
  const controls = { hidden: true };
  const state = { textContent: '' };
  const seek = { disabled: false, value: 0, style: { setProperty() {} }, setAttribute() {} };
  const button = { firstElementChild: { textContent: '' }, setAttribute() {}, closest: () => track };
  const track = {
    dataset: {}, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) },
    querySelector(selector) { return ({ audio, '.zp-cue-controls': controls, '.zp-cue-seek': seek, '.zp-cue-play': button, '.zp-cue-state': state, '.zp-cue-current': { textContent: '' }, '.zp-cue-visualizer': canvas })[selector]; },
  };
  const emit = (name, target) => (listeners.get(name) || []).forEach((fn) => fn({ target }));
  class FakeAudio {
    paused = true; ended = false; isConnected = true; duration = 72; currentTime = 0;
    closest() { return track; }
    getAttribute() { return 'Needle in The Nerve'; }
    play() { this.paused = false; emit('play', this); return Promise.resolve(); }
    pause() { this.paused = true; emit('pause', this); }
  }
  const audio = new FakeAudio();
  class FakeContext {
    constructor() { contexts++; this.state = blocked ? 'suspended' : 'running'; this.destination = {}; }
    resume() { return blocked ? Promise.reject(new Error('blocked')) : Promise.resolve(); }
    createAnalyser() { return { fftSize: 1024, frequencyBinCount: 512, connect() {}, getByteTimeDomainData(a) { a.fill(128); }, getByteFrequencyData(a) { a.fill(100); } }; }
    createMediaElementSource() { sources++; return { connect() {} }; }
  }
  const document = {
    readyState: 'complete',
    querySelectorAll: (selector) => selector === 'audio' ? [audio] : [track],
    getElementById: () => null,
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); },
  };
  const window = { matchMedia: () => ({ matches: reduced }), devicePixelRatio: 1, ...(webAudio ? { AudioContext: FakeContext } : {}) };
  const sandbox = { document, window, HTMLAudioElement: FakeAudio, Uint8Array, Promise, requestAnimationFrame(fn) { const id = nextFrame++; frames.set(id, fn); return id; }, cancelAnimationFrame(id) { frames.delete(id); } };
  vm.runInNewContext(code, sandbox);
  return {
    click: () => emit('click', { closest: () => button }), audio, classes, frames,
    draw: () => { const [id, frame] = frames.entries().next().value; frames.delete(id); frame(100); },
    stats: () => ({ contexts, sources, draws }),
  };
}

test('visualizer connects only on play, draws audio data, and stops on pause', async () => {
  const h = harness();
  assert.equal(h.stats().contexts, 0);
  h.click();
  await new Promise(setImmediate);
  assert.equal(h.stats().sources, 1);
  assert.ok(h.classes.has('has-visualizer'));
  h.draw();
  assert.ok(h.stats().draws > 0);
  h.click();
  assert.equal(h.frames.size, 0);
  assert.equal(h.classes.has('has-visualizer'), false);
  h.click();
  await new Promise(setImmediate);
  assert.equal(h.stats().sources, 1, 'replay reuses the media source');
});

test('reduced motion or unavailable Web Audio never interferes with playback', async () => {
  for (const options of [{ reduced: true }, { webAudio: false }, { blocked: true }]) {
    const h = harness(options);
    h.click();
    await new Promise(setImmediate);
    assert.equal(h.audio.paused, false);
    assert.equal(h.stats().sources, 0);
    assert.equal(h.frames.size, 0);
  }
});
