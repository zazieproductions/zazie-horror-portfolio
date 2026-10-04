#!/usr/bin/env node
/**
 * attach-item-markers.mjs — one-time (idempotent) marker placement in the hubs.
 *
 * The hub pages are hand-maintained HTML: /work and /reel have no source in
 * this repository, and /store is authored in `store-src/store.html`. Rather
 * than hand-typing 65 item URLs into them — which would drift the moment a
 * slug changed — each hub card gets an empty *marker pair*:
 *
 *     <!--ITEMLINK:work/expire--><!--/ITEMLINK-->
 *
 * `scripts/render-pages.mjs` fills whatever sits between the two markers with
 * the link generated from `src/data`, on every build, and the markers stay in
 * place so the fill is idempotent. Nothing here is a URL: it is a pointer to
 * the route the data owns.
 *
 * The same idea lists every entry on the human-facing /sitemap page:
 *
 *     <!--ITEMLINKS:work--><!--/ITEMLINKS:work-->
 *
 * Run `node scripts/attach-item-markers.mjs --check` to verify the markers are
 * present and match the data, or without arguments to attach any that are
 * missing. Re-running it never duplicates a marker.
 */

import { cues, productions, releases, read, write } from './lib/data.mjs';

const problems = [];
let attached = 0;

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, '');

/* ------------------------------------------------------------------- /work */

{
  const file = 'work/index.html';
  let html = read(file);
  // Only the filmography clause: the film-sample and related-archive cards
  // reuse the same markup and must not point at production entries.
  const clause = /<section class="clause" id="productions">[\s\S]*?<\/section>/.exec(html);
  if (!clause) problems.push(`${file}: filmography clause not found`);
  const cards = clause ? [...clause[0].matchAll(/<li class="hub-card">[\s\S]*?<\/li>/g)] : [];
  let touched = 0;
  const matched = new Set();

  for (const card of cards) {
    const h3 = /<h3>[\s\S]*?<\/h3>/.exec(card[0]);
    if (!h3) continue;
    const text = norm(h3[0].replace(/<[^>]+>/g, ''));
    const production = productions.find((p) => text.startsWith(norm(p.title)));
    if (!production) continue;
    if (matched.has(production.slug)) {
      problems.push(`${file}: two cards claim the production ${production.slug}`);
      continue;
    }
    matched.add(production.slug);
    if (card[0].includes(`<!--ITEMLINK:work/${production.slug}-->`)) continue;
    const stamp = /<p class="stamp">[\s\S]*?<\/p>/.exec(card[0]);
    if (!stamp) {
      problems.push(`${file}: card "${production.title}" has no <p class="stamp"> to attach to`);
      continue;
    }
    const replaced = stamp[0].replace(
      /<\/p>$/,
      ` · <!--ITEMLINK:work/${production.slug}--><!--/ITEMLINK--></p>`
    );
    html = html.replace(card[0], card[0].replace(stamp[0], replaced));
    touched++;
  }

  if (touched && !process.argv.includes('--check')) {
    write(file, html);
    attached += touched;
    console.log(`attached ${touched} production marker(s) in ${file}`);
  }
  const present = [...read(file).matchAll(/<!--ITEMLINK:work\/([a-z0-9-]+)-->/g)].map((m) => m[1]);
  for (const p of productions) {
    if (!present.includes(p.slug)) problems.push(`${file}: no marker for production ${p.slug}`);
  }
}

/* ------------------------------------------------------------------- /reel */

{
  const file = 'reel/index.html';
  let html = read(file);
  const blocks = [...html.matchAll(/<details class="faq-item" id="track-track-(\d+)"[^>]*>[\s\S]*?<\/details>/g)];
  let touched = 0;

  for (const block of blocks) {
    const src = `/audio/track-${String(Number(block[1])).padStart(2, '0')}.mp3`;
    const cue = cues.find((c) => c.src === src);
    if (!cue) {
      problems.push(`${file}: no cue in src/data for ${src}`);
      continue;
    }
    if (block[0].includes(`<!--ITEMLINK:reel/${cue.slug}-->`)) continue;
    const answer = /<div class="answer">[\s\S]*?<p>[\s\S]*?<\/p>/.exec(block[0]);
    if (!answer) {
      problems.push(`${file}: cue ${cue.title} has no answer paragraph to attach to`);
      continue;
    }
    const replaced = answer[0].replace(
      /<\/p>$/,
      ` · <!--ITEMLINK:reel/${cue.slug}--><!--/ITEMLINK--></p>`
    );
    html = html.replace(block[0], block[0].replace(answer[0], replaced));
    touched++;
  }

  if (touched && !process.argv.includes('--check')) {
    write(file, html);
    attached += touched;
    console.log(`attached ${touched} cue marker(s) in ${file}`);
  }
  const present = [...read(file).matchAll(/<!--ITEMLINK:reel\/([a-z0-9-]+)-->/g)].map((m) => m[1]);
  for (const c of cues) {
    if (!present.includes(c.slug)) problems.push(`${file}: no marker for cue ${c.slug}`);
  }
}

/* ------------------------------------------------------------------ /store */

{
  const file = 'store-src/store.html';
  let html = read(file);
  const cards = [...html.matchAll(/<article class="card">[\s\S]*?<\/article>/g)];
  let touched = 0;

  for (const card of cards) {
    const title = /data-text="([^"]+)"/.exec(card[0]);
    if (!title) {
      problems.push(`${file}: a card has no data-text title`);
      continue;
    }
    const release = releases.find((r) => norm(r.title) === norm(title[1]));
    if (!release) {
      problems.push(`${file}: no catalogue item in src/data matches "${title[1]}"`);
      continue;
    }
    if (card[0].includes(`<!--ITEMLINK:store/${release.slug}-->`)) continue;
    const copy = /<p class="card-copy">[\s\S]*?<\/p>/.exec(card[0]);
    if (!copy) {
      problems.push(`${file}: item ${release.title} has no card copy to attach to`);
      continue;
    }
    const replaced = copy[0].replace(
      /<\/p>$/,
      ` <!--ITEMLINK:store/${release.slug}--><!--/ITEMLINK--></p>`
    );
    html = html.replace(card[0], card[0].replace(copy[0], replaced));
    touched++;
  }

  if (touched && !process.argv.includes('--check')) {
    write(file, html);
    attached += touched;
    console.log(`attached ${touched} catalogue marker(s) in ${file}`);
  }
  const present = [...read(file).matchAll(/<!--ITEMLINK:store\/([a-z0-9-]+)-->/g)].map((m) => m[1]);
  for (const r of releases) {
    if (!present.includes(r.slug)) problems.push(`${file}: no marker for catalogue item ${r.slug}`);
  }
}

/* --------------------------------------------------------- /sitemap (page) */

{
  const file = 'legal-src/pages/sitemap.html';
  let html = read(file);
  const needSections = ['work', 'reel', 'store'].filter(
    (s) => !html.includes(`<!--ITEMLINKS:${s}-->`)
  );

  if (needSections.length) {
    const marker = `      <section class="clause" id="machine-readable">`;
    if (!html.includes(marker)) {
      problems.push(`${file}: cannot find the machine-readable section to insert after`);
    } else {
      const section = `      <section class="clause" id="entries">
        <h2><span class="no">vi</span>Every entry, one URL</h2>
        <p>Nine productions, thirty-two showreel cues and twenty-four catalogue items each have their own page, their own canonical URL and their own structured data. Every link below is generated from the same source as the entry itself.</p>
        <h3>Selected productions (9)</h3>
        <ul><!--ITEMLINKS:work--><!--/ITEMLINKS:work--></ul>
        <h3>Showreel cues (32)</h3>
        <ul><!--ITEMLINKS:reel--><!--/ITEMLINKS:reel--></ul>
        <h3>Catalogue items (24)</h3>
        <ul><!--ITEMLINKS:store--><!--/ITEMLINKS:store--></ul>
      </section>

`;
      const navItem = `        <li><a href="#entries"><span class="idx">vi</span>Every entry</a></li>\n`;
      const navAnchor = `        <li><a href="#machine-readable"><span class="idx">v</span>For search engines</a></li>\n`;
      html = html.replace(navAnchor, navAnchor + navItem);
      html = html.replace(/      <section class="clause" id="machine-readable">/,
        section + '      <section class="clause" id="machine-readable">');
      if (!process.argv.includes('--check')) {
        write(file, html);
        attached++;
        console.log(`inserted ${needSections.join(', ')} entry list(s) in ${file}`);
      }
    }
  }

  const htmlAfter = read(file);
  for (const s of ['work', 'reel', 'store']) {
    if (!htmlAfter.includes(`<!--ITEMLINKS:${s}-->`)) {
      problems.push(`${file}: missing <!--ITEMLINKS:${s}--> marker`);
    }
  }
}

/* ------------------------------------------------------------------- report */

if (problems.length) {
  console.error(`\nattach-item-markers: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  x  ${p}`);
  process.exit(1);
}

console.log(
  `attach-item-markers: ${attached ? attached + ' attachment(s) written. ' : ''}` +
    `${productions.length} productions, ${cues.length} cues, ${releases.length} catalogue items marked.`
);
