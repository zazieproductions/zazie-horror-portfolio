import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function page(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'); }
function graph(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

test('production content and poster metadata are available without JavaScript', () => {
  const html = page('work/unseen.html');
  assert.match(html, /<meta name="color-scheme" content="dark"/);
  assert.match(html, /IMDb identifies Steve Merlo as composer/);
  const movie = graph(html).find((node) => node['@type'] === 'Movie');
  assert.equal(movie.image['@type'], 'ImageObject');
  assert.match(movie.image.contentUrl, /\/images\/posters\/unseen-640\.jpg$/);
  assert.deepEqual(movie.musicBy, [{ '@type': 'Person', name: 'Steve Merlo' }]);
  assert.doesNotMatch(JSON.stringify(movie.musicBy), /Zazie/);
});

test('verified composer credits connect to the shared person entity', () => {
  const html = page('work/peregrinus.html');
  const series = graph(html).find((node) => node['@type'] === 'TVSeries');
  assert.ok(series.musicBy.some((person) => person['@id'] === 'https://horror.zazieproductions.com/#person'));
  assert.match(page('index.html'), /<meta name="color-scheme" content="dark"/);
});
