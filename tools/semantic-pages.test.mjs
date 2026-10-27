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

test('/hire-a-composer presents the sonic story, qualified sound claims, and low-friction next steps', () => {
  const html = page('hire-a-composer.html');
  const section = html.match(/<section class="sonic-threshold"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'sonic-threshold section is present');
  assert.match(section, /prepare to die/);
  assert.match(section, /weaponized in sonic warfare/);
  assert.match(section, /Below 20 Hz/);
  assert.match(section, /not a universal reflex/);
  assert.match(section, /A minor second/);
  assert.match(section, /0\.8 seconds/);
  assert.match(section, /not a universal brain threshold/);
  assert.match(section, /href="\/contact">Talk through a scene/);
  assert.match(section, /href="\/reel">Listen to the showreel/);
  assert.match(section, /href="#cost">See starting fees and estimate your scope/);
});
