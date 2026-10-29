import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MOBILE_UX_CSS, ensureMobileUxAssets } from '../home-src/mobile-ux.mjs';
import { renderHomeDocument, GENERATED_SEO_START, GENERATED_SEO_END } from '../home-src/document.mjs';

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

const generatedSeo = [
  '<title>Homepage</title>',
  '<meta name="description" content="Generated description"/>',
  '<meta name="color-scheme" content="dark"/>',
  '<link rel="canonical" href="https://horror.zazieproductions.com/"/>',
  '<link rel="alternate" type="text/plain" href="/llms.txt"/>',
  '<!-- JSON-LD: home -->',
  '<script type="application/ld+json">{"@type":"WebSite"}</script>',
].join('\n');
const generatedPosters = '<article id="posters">Generated poster</article>';
const mobileBlock = `<style id="zp-mobile-ux">${MOBILE_UX_CSS}</style>`;
const render = (html) => renderHomeDocument(html, { seo: generatedSeo, posters: generatedPosters });
const documentWithHead = (head) => `<!doctype html>
<!--SEO:START-->
<head>
${head}
</head>
<!--SEO:END-->
<body><!--HOME-POSTERS:START-->old poster<!--HOME-POSTERS:END--><h1>Hero</h1></body>
`;

test('complete homepage rendering keeps mobile CSS after SEO and is byte-idempotent', () => {
  const first = render(documentWithHead(`<script id="keep">window.keep=true;</script>\n<!-- keep comment -->\n<link rel="stylesheet" href="/index-test.css"/>\n${GENERATED_SEO_START}\nstale seo\n${GENERATED_SEO_END}`));
  assert.ok(first.includes('<script id="keep">window.keep=true;</script>'), 'non-SEO head scripts are carried, not sanitized away');
  assert.ok(first.includes('<!-- keep comment -->'), 'non-SEO head comments are carried, not sanitized away');
  assert.ok(first.includes(`${generatedSeo}\n${GENERATED_SEO_END}\n${mobileBlock}\n</head>`),
    'the final head writer places mobile overrides after regenerated canonical and JSON-LD');
  assert.equal(render(first), first, 'a second complete homepage render changes no bytes');
  assert.equal(ensureMobileUxAssets(first), first, 'the earlier homepage pass also agrees on the final position');
  assert.equal((first.match(/id="zp-mobile-ux"/g) ?? []).length, 1);
  assert.equal((first.match(/rel="canonical"/g) ?? []).length, 1);
  assert.equal((first.match(/name="color-scheme"/g) ?? []).length, 1);
  assert.equal((first.match(/type="application\/ld\+json"/g) ?? []).length, 1);
  assert.ok(first.includes(generatedPosters));
  assert.ok(first.endsWith('<h1>Hero</h1></body>\n'), 'head ordering does not alter the hero/body');
});

test('stale or duplicated mobile blocks converge to one current block without losing SEO', () => {
  const stale = '<style id="zp-mobile-ux">/* obsolete rules */</style>';
  const first = render(documentWithHead(`${stale}\n${GENERATED_SEO_START}\n${generatedSeo}\n${GENERATED_SEO_END}\n${mobileBlock}`));
  assert.equal((first.match(/id="zp-mobile-ux"/g) ?? []).length, 1);
  assert.ok(!first.includes('obsolete rules'));
  assert.ok(first.includes(`${generatedSeo}\n${GENERATED_SEO_END}\n${mobileBlock}\n</head>`));
  assert.equal(render(first), first);
});
