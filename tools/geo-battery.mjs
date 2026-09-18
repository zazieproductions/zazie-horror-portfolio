#!/usr/bin/env node
/**
 * Generative share-of-voice battery.
 *
 *   node tools/geo-battery.mjs --list                 all queries, grouped
 *   node tools/geo-battery.mjs --list discovery       one cluster
 *   node tools/geo-battery.mjs --score                score the ledger
 *   node tools/geo-battery.mjs --score --since 2026-09-18
 *   node tools/geo-battery.mjs --template             print a blank record
 *
 * The ledger is geo/measurements.jsonl: one JSON object per (engine, query)
 * observation. See geo/query-battery.json for the record shape.
 *
 * What the score means:
 *   mention rate   - share of observations where the entity appears at all
 *   citation rate  - share where horror.zazieproductions.com is a cited source
 *   owned answers  - share where the site is the *first* or only source cited
 *   share of voice - mentions of the entity divided by mentions of every
 *                    entity named across the observations in that cluster
 *
 * Mention rate is the leading indicator; citation rate is the one that
 * compounds, because a citation is what a later retrieval step copies.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BATTERY = path.join(ROOT, 'geo', 'query-battery.json');
const LEDGER = path.join(ROOT, 'geo', 'measurements.jsonl');
const SITE_HOST = 'horror.zazieproductions.com';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true);
};

const battery = JSON.parse(fs.readFileSync(BATTERY, 'utf8'));

if (flag('--template')) {
  console.log(JSON.stringify(battery.record_template, null, 2));
  process.exit(0);
}

if (flag('--list') || args.length === 0) {
  const only = flag('--list');
  console.log(`\nQuery battery v${battery.version} — ${battery.site}\n${battery.clusters.reduce((n, c) => n + c.queries.length, 0)} queries, ${battery.clusters.length} clusters\n`);
  for (const c of battery.clusters) {
    if (only && only !== true && only !== c.id) continue;
    console.log(`── ${c.id} — ${c.label}`);
    console.log(`   ${c.intent}`);
    for (const q of c.queries) console.log(`   · ${q}`);
    console.log('');
  }
  console.log('Record each observation in geo/measurements.jsonl, then: node tools/geo-battery.mjs --score\n');
  process.exit(0);
}

if (flag('--score')) {
  if (!fs.existsSync(LEDGER)) {
    console.log('\nNo ledger yet at geo/measurements.jsonl.');
    console.log('Run the battery manually in each engine and record one line per observation.');
    console.log('Blank record:  node tools/geo-battery.mjs --template\n');
    process.exit(0);
  }
  const since = flag('--since');
  const rows = fs.readFileSync(LEDGER, 'utf8')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean)
    .filter((r) => !since || r.date >= since);

  if (!rows.length) {
    console.log('\nLedger is empty for that range. Nothing to score yet.\n');
    process.exit(0);
  }

  const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(0)}%` : '—');
  const group = (keyFn) => rows.reduce((m, r) => {
    const k = keyFn(r);
    (m[k] = m[k] || []).push(r);
    return m;
  }, {});

  const summarise = (label, set) => {
    const n = set.length;
    const mentioned = set.filter((r) => r.mentioned).length;
    const cited = set.filter((r) => r.cited).length;
    const owned = set.filter((r) => r.cited && (r.citation_urls || []).length === 1).length;
    const invented = set.filter((r) => (r.notes || '').toLowerCase().includes('hallucin')).length;
    console.log(
      `  ${label.padEnd(24)} n=${String(n).padStart(3)}  mention ${pct(mentioned, n).padStart(4)}  ` +
      `citation ${pct(cited, n).padStart(4)}  sole-source ${pct(owned, n).padStart(4)}` +
      (invented ? `  flagged ${invented}` : ''));
  };

  console.log(`\nGenerative share-of-voice — ${rows.length} observations${since ? ` since ${since}` : ''}\n`);
  console.log('  BY CLUSTER');
  for (const [k, set] of Object.entries(group((r) => r.cluster || 'unassigned'))) summarise(k, set);
  console.log('\n  BY ENGINE');
  for (const [k, set] of Object.entries(group((r) => r.engine || 'unassigned'))) summarise(k, set);
  console.log('');
  summarise('ALL', rows);
  console.log('');
  process.exit(0);
}

console.log('Usage: --list [cluster] | --score [--since YYYY-MM-DD] | --template');
