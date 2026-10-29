import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MOBILE_UX_CSS, ensureMobileUxAssets } from '../home-src/mobile-ux.mjs';

test('mobile UX stylesheet is injected once, last in head, and survives regeneration', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(ensureMobileUxAssets(html), html);
  assert.equal((html.match(/id="zp-mobile-ux"/g) || []).length, 1);
  assert.ok(html.includes(`<style id="zp-mobile-ux">${MOBILE_UX_CSS}</style>\n</head>`));
  const build = fs.readFileSync(new URL('../home-src/build.mjs', import.meta.url), 'utf8');
  assert.match(build, /nextHtml = ensureMobileUxAssets\(nextHtml\)/);
});

test('touch improvements use real boxes and scoped responsive typography', () => {
  assert.match(MOBILE_UX_CSS, /@media \(max-width:767px\), \(pointer:coarse\)/);
  assert.match(MOBILE_UX_CSS, /main input\[type="range"\][\s\S]*?min-height:44px/);
  assert.match(MOBILE_UX_CSS, /footer a[\s\S]*?min-width:44px; min-height:44px/);
  assert.match(MOBILE_UX_CSS, /\.zp-vactions \{ gap:8px/);
  assert.match(MOBILE_UX_CSS, /@media \(max-width:479px\)[\s\S]*?font-size:12px/);
  assert.match(MOBILE_UX_CSS, /#contact :is\(input,select,textarea\) \{ font-size:16px/);
  assert.match(MOBILE_UX_CSS, /:focus-visible/);
  assert.doesNotMatch(MOBILE_UX_CSS, /::before|::after|!important/);
});
