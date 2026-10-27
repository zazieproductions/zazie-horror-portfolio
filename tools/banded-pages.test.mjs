import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * Locks the banded interior layout (see BANDS.md).
 *
 * The whole site used to render interior pages as a document plate: a Contents
 * rail beside one 74ch column of roman-numeral clauses. That is a contract
 * shape applied to studio pages, and it is what made them read as text walls.
 * Every interior page now renders as full-bleed bands.
 *
 * This test exists because the failure mode is silent. A page that loses its
 * bands still serves 200, still passes the link and sitemap checks, and still
 * reads fine to a crawler - it just looks wrong. Nothing else in the suite
 * would notice.
 */

const ROOT = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, ROOT), 'utf8');

/** Every sitemap URL, mapped to the file that serves it. */
function sitemapFiles() {
  const xml = read('sitemap.xml');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].replace(/&amp;/g, '&').replace(/^https?:\/\/[^/]+/, ''),
  );
  return urls.map((route) => {
    if (route === '/') return { route, file: 'index.html', kind: 'home' };
    const seg = route.slice(1);
    const dirIndex = `${seg}/index.html`;
    const flat = `${seg}.html`;
    if (fs.existsSync(new URL(dirIndex, ROOT))) {
      return { route, file: dirIndex, kind: seg.split('/').length > 1 ? 'item' : 'page' };
    }
    if (fs.existsSync(new URL(flat, ROOT))) {
      return { route, file: flat, kind: seg.split('/').length > 1 ? 'item' : 'page' };
    }
    return { route, file: null, kind: 'missing' };
  });
}

const entries = sitemapFiles();

/**
 * /store is excluded on purpose. The catalogue is generated from store-src/
 * with its own stylesheet and its own layout - hero, vitrine grid, scanlines,
 * torch and custom cursor - so it was never a document plate and banding it
 * would mean rebuilding a second system. It is already a full-bleed experience.
 */
const EXCLUDED = new Set(['/store']);
const interior = entries.filter((e) => e.kind !== 'home' && e.kind !== 'missing' && !EXCLUDED.has(e.route));
const hubs = ['composer', 'contact', 'process', 'reel', 'services', 'sound-design', 'game-scoring', 'work'];
const documents = [
  'accessibility', 'faq', 'hire-a-composer', 'how-to-hire-a-horror-composer',
  'legal', 'licensing', 'privacy', 'purchases', 'sitemap', 'terms',
];

test('every sitemap URL resolves to a real file', () => {
  const missing = entries.filter((e) => e.kind === 'missing').map((e) => e.route);
  assert.deepEqual(missing, [], 'sitemap URLs with no file');
  assert.ok(interior.length >= 80, `expected the whole interior, found ${interior.length} pages`);
});

test('every interior page renders as bands, with no document plate left', () => {
  for (const { route, file } of interior) {
    const html = read(file);
    assert.match(html, /class="doc doc-banded/, `${route}: not banded`);
    assert.match(html, /class="band /, `${route}: no bands`);
    assert.match(html, /class="section-jump"/, `${route}: no section jump bar`);
    // The retired skeleton. If either comes back the page is a text wall again.
    assert.doesNotMatch(html, /doc-layout/, `${route}: still uses the document plate grid`);
    assert.doesNotMatch(html, /class="doc-index"/, `${route}: still uses the sticky Contents rail`);
    assert.doesNotMatch(html, /class="doc-jump"/, `${route}: still uses the mobile-only chip nav`);
  }
});

test('the home page is not banded - it is the React experience', () => {
  const home = read('index.html');
  assert.doesNotMatch(home, /class="doc doc-banded/, 'home must keep its own layout');
});

test('every hub and document page ends on a closing call to action', () => {
  for (const slug of [...hubs, ...documents]) {
    assert.match(read(`${slug}/index.html`), /class="closing"/, `/${slug}: ends abruptly into the footer`);
  }
});

test('long documents sit on one surface instead of striping', () => {
  // Terms carries 25 sections, privacy 15, licensing 14. Alternating void/ink
  // that often reads as stripes, so above ten bands a page goes calm.
  const CALM_AT = 10;
  for (const { route, file } of interior) {
    const html = read(file);
    const bands = (html.match(/class="band /g) ?? []).length;
    if (bands > CALM_AT) {
      assert.match(html, /doc-calm/, `${route}: ${bands} bands alternating instead of calm`);
    } else {
      assert.doesNotMatch(html, /doc-calm/, `${route}: only ${bands} bands, should alternate`);
    }
  }
});

test('each directory hub twin is byte-identical to its root .html twin', () => {
  for (const slug of [...hubs, ...documents]) {
    assert.equal(read(`${slug}/index.html`), read(`${slug}.html`), `/${slug} twins drifted`);
  }
});

test('the stylesheet ships the band components, and the jump bar actually sticks', () => {
  const css = read('legal-src/legal.css');
  for (const component of ['.band{', '.band-head', '.section-jump{', '.stat-rail{', '.link-set{', '.doc-calm']) {
    assert.ok(css.includes(component), `legal.css is missing ${component}`);
  }
  // position:sticky without a top offset silently does nothing. The masthead is
  // 3.5rem, 4rem from 640px, and the bar has to clear it.
  const jump = /\.section-jump\{[^}]*\}/.exec(css)?.[0] ?? '';
  assert.match(jump, /position:sticky/, 'section-jump must be sticky');
  assert.match(jump, /top:3\.5rem/, 'section-jump must clear the 3.5rem masthead');
  assert.match(css, /@media \(min-width:640px\)\{\.section-jump\{top:4rem\}\}/, 'and the 4rem masthead');
});

test('the scroll-spy targets the jump bar and clears both sticky layers', () => {
  const js = read('legal-src/legal.js');
  assert.match(js, /\.section-jump a\[href\^="#"\]/, 'scroll-spy does not watch the jump bar');
  // -96px assumed the masthead was the only fixed chrome and marked the section
  // above the one being read once the jump bar also became sticky.
  assert.match(js, /rootMargin:\s*"-120px 0px -60% 0px"/, 'rootMargin does not clear masthead + jump bar');
  assert.doesNotMatch(js, /rootMargin:\s*"-96px/, 'stale rootMargin is back');
});

test('stat rails carry only figures that are verifiable in the tree', () => {
  const productions = (read('src/data/productions.ts').match(/^\s+slug: '/gm) ?? []).length;
  const cues = (read('src/data/cues.ts').match(/^\s+slug: '/gm) ?? []).length;
  const releases = (read('src/data/releases.ts').match(/^\s+slug: '/gm) ?? []).length;
  assert.equal(productions, 9, 'production count moved - update the stat rails with it');
  assert.equal(cues, 30, 'cue count moved - update the stat rails with it');
  assert.equal(releases, 24, 'catalogue count moved - update the stat rails with it');

  const composer = read('composer/index.html');
  assert.match(composer, /<b>9<\/b><span>Production records/, '/composer rail must state 9 productions');
  assert.match(composer, /<b>30<\/b><span>Showreel cues/, '/composer rail must state 30 cues');
  assert.match(composer, /<b>24<\/b><span>Catalogue items/, '/composer rail must state 24 catalogue items');
  // The README says "7 film samples" but productions.ts has 5 sample entries, so
  // that figure is not usable. /reel states cue categories instead, which is
  // countable from the data.
  assert.doesNotMatch(composer, /Film samples/, 'unverifiable film-sample count is back');
  const categories = new Set([...read('src/data/cues.ts').matchAll(/category: '([^']+)'/g)].map((m) => m[1]));
  assert.match(read('reel/index.html'), new RegExp(`<b>${categories.size}</b><span>Cue categories`),
    '/reel rail must state the real number of cue categories');
});

test('no interior page keeps a scattered middle-dot run of four or more links', () => {
  // Links separated by middle dots in running prose are the "scattered links"
  // complaint. A .link-set gives each one a label and a note instead. Two or
  // three inline (a mailto beside a form) stays fine; four-plus is confetti.
  const offenders = [];
  for (const { route, file } of interior) {
    if (file.startsWith('reel/')) continue; // the cue tracklist rows are a list, not prose
    const main = /<main id="doc">([\s\S]*)<\/main>/.exec(read(file))?.[1] ?? '';
    const prose = main.replace(/<(ul|ol|table|nav)\b[\s\S]*?<\/\1>/g, ' ');
    const runs = prose.match(/(?:<a\b[^>]*>[^<]*<\/a>\s*·\s*){3,}<a\b[^>]*>[^<]*<\/a>/g) ?? [];
    if (runs.length) offenders.push(`${route} (${runs.length})`);
  }
  assert.deepEqual(offenders, [], 'pages still inlining long link runs');
});

test('the shared stylesheet still balances after the banded layer was added', () => {
  const css = read('legal-src/legal.css')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
  let depth = 0;
  for (const ch of css) {
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    assert.ok(depth >= 0, 'unbalanced } in legal.css');
  }
  assert.equal(depth, 0, 'unbalanced { in legal.css');
});
