#!/usr/bin/env node
/**
 * check-sitemap.mjs
 * -----------------------------------------------------------------------------
 * Pre-flight validator for horror.zazieproductions.com/sitemap.xml.
 *
 * Runs every check Google Search Console performs (plus the ones it silently
 * penalises you for) so the file is clean *before* you hit "Submit sitemap":
 *
 *   1.  XML is well-formed                       -> GSC "Sitemap could not be read"
 *   2.  Correct root element + namespaces        -> GSC "Invalid XML"
 *   3.  Protocol limits (50k URLs / 50 MB)       -> GSC "Sitemap too large"
 *   4.  loc: absolute, on-host, no params/frag   -> GSC "Invalid URL"
 *   5.  lastmod / publication_date W3C format    -> GSC "Invalid date"
 *   6.  changefreq / priority value ranges       -> GSC "Invalid value"
 *   7.  Child-element order matches the XSD      -> strict validator failures
 *   8.  video:content_loc points to a real file  -> GSC video errors (HTML is NOT
 *       a supported format; YouTube embeds must use video:player_loc only)
 *   9.  No duplicate <loc>                       -> GSC "Duplicate URL"
 *  10.  Every loc resolves to a real page        -> GSC "URL not found (404)"
 *  11.  Page canonical == sitemap loc            -> GSC "Alternate page with
 *                                                   proper canonical tag"
 *  12.  Page is not noindex                      -> GSC "Excluded by noindex"
 *  13.  Nothing is blocked by robots.txt         -> GSC "Blocked by robots.txt"
 *  14.  robots.txt advertises the sitemap        -> discovery
 *  15.  image/video assets exist on disk         -> GSC image/video "not found"
 *
 * Usage:
 *   node tools/check-sitemap.mjs                 # offline / structural checks
 *   node tools/check-sitemap.mjs --live          # + HTTP status of every URL
 *   node tools/check-sitemap.mjs --host example.com --root ./dist
 *
 * Exit code 0 = safe to submit. Exit code 1 = errors found.
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ config */

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const ROOT = path.resolve(__dirname, arg('root', path.join(__dirname, '..')));
const SITEMAP = path.resolve(ROOT, arg('sitemap', 'sitemap.xml'));
const SITE_HOST = arg('host', 'horror.zazieproductions.com');
const LIVE = flag('live');

const SM_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1';
const VIDEO_NS = 'http://www.google.com/schemas/sitemap-video/1.1';

const MAX_URLS = 50000;
const MAX_BYTES = 52428800; // 50 MB uncompressed
const MAX_LOC_LEN = 2048;
const MAX_IMAGES_PER_URL = 1000;
const MAX_TAGS_PER_VIDEO = 32;

/** Schema-declared child order (sequences). Anything not listed is unordered. */
const ORDER = {
  url: ['loc', 'lastmod', 'changefreq', 'priority'],
  image: ['loc', 'caption', 'geo_location', 'title', 'license'],
  video: [
    'thumbnail_loc', 'title', 'description', 'content_loc', 'player_loc', 'duration',
    'expiration_date', 'rating', 'view_count', 'publication_date', 'family_friendly',
    'restriction', 'gallery_loc', 'price', 'requires_subscription', 'uploader',
    'platform', 'live', 'tag', 'category',
  ],
};

const CHANGEFREQ = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);

/** Extensions Google accepts for video:content_loc (HTML / Flash are NOT valid). */
const VIDEO_FILE_RE =
  /\.(mpg|mpeg|mp4|m4v|mov|wmv|asf|avi|ra|ram|rm|flv|mkv|webm|ogv|ogg|3gp|3g2|ts|m3u8|mpd)(\?|#|$)/i;

/* ---------------------------------------------------------------- reporting */

const errors = [];
const warnings = [];
const info = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const note = (m) => info.push(m);

/* --------------------------------------------------------------- XML parser */

class XmlError extends Error {}

function parseXml(src) {
  // Strip the XML declaration, comments and processing instructions first.
  let s = src.replace(/^\uFEFF/, '');
  const decl = /^<\?xml[\s\S]*?\?>\s*/.exec(s);
  if (decl) s = s.slice(decl[0].length);
  if (/^\s*<!/i.test(s) && !/^\s*<!--/.test(s)) {
    // DOCTYPE and friends are not allowed in sitemaps.
    throw new XmlError('DOCTYPE / DTD declarations are not allowed in a sitemap');
  }
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<\?[\s\S]*?\?>/g, '');

  const root = { name: '#document', children: [], ns: {} };
  const stack = [root];
  const re = /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  let consumed = 0;

  const decode = (t) =>
    t
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&amp;/g, '&');

  while ((m = re.exec(s)) !== null) {
    consumed += m[0].length;
    const top = stack[stack.length - 1];

    if (m[5] !== undefined) {
      // Text node
      const text = decode(m[5]);
      if (text.trim()) {
        if (top.children.length && top.children.at(-1).type === 'text') top.children.at(-1).value += text;
        else top.children.push({ type: 'text', value: text });
      }
      continue;
    }

    const [, closing, rawName, rawAttrs, selfClose] = m;

    if (!closing) {
      const attrs = {};
      const ns = {};
      for (const a of rawAttrs.matchAll(/([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
        const value = decode(a[2] !== undefined ? a[2] : a[3]);
        attrs[a[1]] = value;
        if (a[1] === 'xmlns') ns[''] = value;
        else if (a[1].startsWith('xmlns:')) ns[a[1].slice(6)] = value;
      }
      const node = { type: 'element', name: rawName, attrs, ns, children: [], parent: top };
      top.children.push(node);
      if (!selfClose) stack.push(node);
    } else {
      if (top.name !== rawName) {
        throw new XmlError(`mismatched tag: </${rawName}> closes <${top.name}>`);
      }
      stack.pop();
    }
  }

  if (stack.length !== 1) throw new XmlError(`unclosed tag: <${stack.at(-1).name}>`);

  // Anything left over that is not whitespace means stray markup / raw "&".
  const tail = s.slice(consumed).trim();
  if (tail) throw new XmlError(`unexpected trailing content: ${tail.slice(0, 60)}`);
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#)/.test(s)) {
    throw new XmlError('unescaped "&" - ampersands must be written as &amp;');
  }

  return root.children.find((c) => c.type === 'element');
}

/** Resolve a qname against the namespace declarations in scope. */
function resolve(node, qname) {
  const [prefix, local] = qname.includes(':') ? qname.split(':') : ['', qname];
  let cur = node;
  while (cur) {
    if (cur.ns && prefix in cur.ns) return { ns: cur.ns[prefix], local };
    cur = cur.parent;
  }
  if (prefix === '') return { ns: node.ns ? node.ns[''] || '' : '', local };
  return { ns: `?${prefix}`, local };
}

const kids = (el) => el.children.filter((c) => c.type === 'element');
const text = (el) =>
  el && el.children
    ? el.children.filter((c) => c.type === 'text').map((c) => c.value).join('').trim()
    : '';
/** Find a child by its namespace-local name, so <loc> and <image:loc> both match "loc". */
const child = (el, local, ns) =>
  kids(el).find((c) => {
    const r = resolve(c, c.name);
    return r.local === local && (ns === undefined || r.ns === ns);
  });

function checkOrder(el, seq, label) {
  const seen = [];
  let lastIdx = -1;
  for (const k of kids(el)) {
    const { ns, local } = resolve(k, k.name);
    const idx = seq.indexOf(local);
    if (idx === -1) continue; // extension element: order is not constrained here
    if (idx < lastIdx) {
      err(`${label}: <${k.name}> appears out of schema order. Expected: ${seq.map((s) => s).join(' -> ')}`);
      return;
    }
    if (idx === lastIdx) seen.push(local);
    lastIdx = idx;
  }
  for (const dup of new Set(seen)) {
    if (dup !== 'tag' && dup !== 'price' && dup !== 'content_segment_loc') {
      err(`${label}: <${dup}> appears more than once`);
    }
  }
}

/* ------------------------------------------------------------------ helpers */

const W3C_DATE = /^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2})(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

function validDate(v) {
  const m = W3C_DATE.exec(v);
  if (!m) return false;
  const [, y, mo, d, , h = '00', mi = '00'] = m;
  const dt = new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`);
  return !Number.isNaN(dt.getTime()) &&
    Number(y) >= 1990 &&
    dt.getUTCFullYear() === Number(y) &&
    dt.getUTCMonth() + 1 === Number(mo) &&
    dt.getUTCDate() === Number(d);
}

function isFuture(v) {
  const m = W3C_DATE.exec(v);
  if (!m) return false;
  return new Date(v.length === 10 ? `${v}T00:00:00Z` : v).getTime() > Date.now() + 86400000;
}

function resolveLocalFile(urlObj) {
  // Mirror the routing in server.mjs / _redirects so the check matches production.
  let p = decodeURIComponent(urlObj.pathname);
  const trimmed = p.replace(/\/$/, '') || '/';
  const candidates = [];
  if (p === '/') candidates.push('index.html');
  else {
    candidates.push(path.join(trimmed, 'index.html'));
    candidates.push(trimmed + '.html');
    candidates.push(p);
  }
  for (const c of candidates) {
    const abs = path.join(ROOT, c);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

/* ------------------------------------------------------------- robots.txt */

function parseRobots(src) {
  const groups = new Map(); // ua -> {allow:[], disallow:[], sitemaps:[]}
  const sitemaps = [];
  let current = [];
  const ensure = (ua) => {
    const key = ua.toLowerCase();
    if (!groups.has(key)) groups.set(key, { allow: [], disallow: [], crawlDelay: null });
    return groups.get(key);
  };
  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const i = line.indexOf(':');
    if (i === -1) continue;
    const field = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (field === 'user-agent') {
      current = [value.toLowerCase()];
      ensure(value);
    } else if (field === 'disallow') {
      for (const ua of current) ensure(ua).disallow.push(value);
    } else if (field === 'allow') {
      for (const ua of current) ensure(ua).allow.push(value);
    } else if (field === 'sitemap') {
      sitemaps.push(value);
    } else if (field === 'crawl-delay') {
      for (const ua of current) ensure(ua).crawlDelay = value;
    }
  }
  return { groups, sitemaps };
}

/** Wildcard robots path matching (* = any sequence, $ = end of URL). */
function ruleMatches(rule, pathnameAndQuery) {
  const anchoredEnd = rule.endsWith('$');
  let pattern = anchoredEnd ? rule.slice(0, -1) : rule;
  if (pattern === '') return true;
  const rx = '^' + pattern.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(anchoredEnd ? rx + '$' : rx).test(pathnameAndQuery);
}

/** Longest-match-wins, Allow beats Disallow on equal specificity (Google's rule). */
function isAllowed(robots, ua, urlObj) {
  const target = urlObj.pathname + urlObj.search;
  const groups = [robots.groups.get('*'), robots.groups.get(ua.toLowerCase())].filter(Boolean);
  let best = null;
  for (const g of groups) {
    for (const [type, list] of [['allow', g.allow], ['disallow', g.disallow]]) {
      for (const rule of list) {
        if (!ruleMatches(rule, target)) continue;
        const score = rule.replace(/\*/g, '').length;
        if (!best || score > best.score || (score === best.score && type === 'allow')) {
          best = { score, type };
        }
      }
    }
  }
  if (!best) return true;
  return best.type !== 'disallow';
}

/* --------------------------------------------------------------------- run */

console.log(`\nsitemap:  ${path.relative(process.cwd(), SITEMAP)}`);
console.log(`site:     https://${SITE_HOST}`);
console.log(`live:     ${LIVE ? 'on' : 'off (pass --live to HTTP-check every URL)'}\n`);

if (!fs.existsSync(SITEMAP)) {
  console.error(`FATAL: ${SITEMAP} not found`);
  process.exit(1);
}

const raw = fs.readFileSync(SITEMAP, 'utf8');
const bytes = Buffer.byteLength(raw, 'utf8');

/* 1. well-formedness ------------------------------------------------------ */
let root;
try {
  root = parseXml(raw);
} catch (e) {
  console.error(`FATAL: ${SITEMAP} is not well-formed XML -> ${e.message}`);
  process.exit(1);
}
note('XML is well-formed');

if (bytes > MAX_BYTES) err(`file is ${(bytes / 1048576).toFixed(1)} MB - limit is 50 MB uncompressed`);
else note(`size ${(bytes / 1024).toFixed(1)} KB (limit 50 MB)`);

/* 2. root element + namespaces ------------------------------------------- */
const rootNs = resolve(root, root.name);
if (rootNs.local !== 'urlset' && rootNs.local !== 'sitemapindex') {
  err(`root element is <${root.name}> - expected <urlset> or <sitemapindex>`);
  process.exit(1);
}
if (rootNs.ns !== SM_NS) err(`root namespace is "${rootNs.ns}" - expected "${SM_NS}"`);

if (rootNs.local === 'sitemapindex') {
  warn('this is a sitemap index - child sitemaps must be validated separately');
  process.exit(errors.length ? 1 : 0);
}
note(`root <urlset> in the sitemaps.org 0.9 namespace`);

const declaredImage = root.ns && root.ns.image === IMAGE_NS;
const declaredVideo = root.ns && root.ns.video === VIDEO_NS;

/* 3. robots.txt ------------------------------------------------------------ */
const robotsPath = path.join(ROOT, 'robots.txt');
let robots = null;
if (fs.existsSync(robotsPath)) {
  robots = parseRobots(fs.readFileSync(robotsPath, 'utf8'));
  if (!robots.sitemaps.some((s) => s === `https://${SITE_HOST}/sitemap.xml`)) {
    warn('robots.txt does not advertise https://' + SITE_HOST + '/sitemap.xml with a Sitemap: line');
  } else {
    note('robots.txt advertises the sitemap');
  }
  if (!robots.groups.has('*')) warn('robots.txt has no "User-agent: *" group');
} else {
  warn('robots.txt not found next to the sitemap');
}

/* 4. per-URL validation ---------------------------------------------------- */
const urls = kids(root).filter((k) => resolve(k, k.name).local === 'url');

if (urls.length === 0) err('sitemap contains no <url> entries');
if (urls.length > MAX_URLS) err(`${urls.length} URLs - limit is ${MAX_URLS}`);
note(`${urls.length} URL entries`);

const seenLocs = new Map();
let imageCount = 0;
let videoCount = 0;
const liveTargets = [];

for (const urlEl of urls) {
  const locEl = child(urlEl, 'loc');
  if (!locEl) { err(`<url> is missing its required <loc>`); continue; }
  const loc = text(locEl);

  let u;
  try {
    u = new URL(loc);
  } catch {
    err(`<loc> is not an absolute URL: "${loc}"`);
    continue;
  }
  const short = u.pathname || '/';

  if (loc.length > MAX_LOC_LEN) err(`${short}: loc is ${loc.length} chars (limit ${MAX_LOC_LEN})`);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') err(`${short}: unsupported protocol ${u.protocol}`);
  if (u.protocol === 'http:') warn(`${short}: http:// - serve everything over https`);
  if (u.host !== SITE_HOST) err(`${short}: host "${u.host}" is not "${SITE_HOST}"`);
  if (u.search) err(`${short}: contains a query string - submit canonical URLs only`);
  if (u.hash) err(`${short}: contains a fragment - not a crawlable URL`);
  if (/%[0-9A-Fa-f]{2}/.test(u.pathname) && /%[0-9A-Fa-f]{2}/.test(short) === false) {
    /* percent-decoded above; no action needed */
  }
  if (/[^ -~]/.test(loc)) err(`${short}: loc contains non-ASCII characters - they must be percent-encoded`);

  if (seenLocs.has(loc)) err(`${short}: duplicate <loc> (also at entry ${seenLocs.get(loc)})`);
  else seenLocs.set(loc, urls.indexOf(urlEl) + 1);

  /* lastmod / changefreq / priority */
  const lastmod = child(urlEl, 'lastmod');
  if (lastmod) {
    const v = text(lastmod);
    if (!validDate(v)) err(`${short}: lastmod "${v}" is not a valid W3C datetime`);
    else if (isFuture(v)) err(`${short}: lastmod "${v}" is in the future`);
  } else {
    note(`${short}: no lastmod (optional, but recommended)`);
  }
  const cf = child(urlEl, 'changefreq');
  if (cf && !CHANGEFREQ.has(text(cf).toLowerCase())) err(`${short}: invalid changefreq "${text(cf)}"`);
  const pr = child(urlEl, 'priority');
  if (pr) {
    const v = Number(text(pr));
    if (!Number.isFinite(v) || v < 0 || v > 1) err(`${short}: priority must be between 0.0 and 1.0`);
  }

  checkOrder(urlEl, ORDER.url, short);

  /* robots.txt cross-check */
  if (robots) {
    if (!isAllowed(robots, '*', u)) err(`${short}: blocked for User-agent: * by robots.txt`);
    if (robots.groups.has('googlebot') && !isAllowed(robots, 'googlebot', u)) {
      err(`${short}: blocked for Googlebot by robots.txt`);
    }
  }

  /* the page must really exist, be canonical and be indexable */
  const file = resolveLocalFile(u);
  if (!file) {
    err(`${short}: no matching file under ${path.basename(ROOT)} (Google would see a 404)`);
  } else if (file.endsWith('.html')) {
    const html = fs.readFileSync(file, 'utf8');
    const canon = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html);
    if (!canon) {
      warn(`${short}: page has no <link rel="canonical">`);
    } else if (canon[1].replace(/\/$/, '') !== loc.replace(/\/$/, '')) {
      err(
        `${short}: page canonical is "${canon[1]}" but the sitemap submits "${loc}" ` +
        `(GSC will report "Alternate page with proper canonical tag")`
      );
    }
    const robotsMeta = /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i.exec(html);
    if (robotsMeta && /\bnoindex\b/i.test(robotsMeta[1])) {
      err(`${short}: page is noindex but is submitted in the sitemap`);
    }
  }

  /* image extension */
  const images = kids(urlEl).filter((k) => resolve(k, k.name).local === 'image');
  if (images.length && !declaredImage) err('image:image used but the image namespace is not declared on <urlset>');
  if (images.length > MAX_IMAGES_PER_URL) err(`${short}: ${images.length} images - limit is ${MAX_IMAGES_PER_URL}`);
  imageCount += images.length;

  for (const img of images) {
    const iloc = child(img, 'loc');
    if (!iloc) { err(`${short}: <image:image> missing required <image:loc>`); continue; }
    const iurl = text(iloc);
    let iu;
    try { iu = new URL(iurl); } catch { err(`${short}: image:loc is not an absolute URL: "${iurl}"`); continue; }
    checkOrder(img, ORDER.image, `${short} (image ${iu.pathname})`);
    if (iu.host !== SITE_HOST) {
      note(`${short}: image hosted off-site (${iu.host}) - allowed, but Google must be able to crawl it`);
    } else if (!fs.existsSync(path.join(ROOT, decodeURIComponent(iu.pathname)))) {
      err(`${short}: image file missing from disk: ${iu.pathname}`);
    }
  }

  /* video extension */
  const videos = kids(urlEl).filter((k) => resolve(k, k.name).local === 'video');
  if (videos.length && !declaredVideo) err('video:video used but the video namespace is not declared on <urlset>');
  videoCount += videos.length;

  for (const vid of videos) {
    const thumb = text(child(vid, 'thumbnail_loc') || { children: [] });
    const title = text(child(vid, 'title') || { children: [] });
    const desc = text(child(vid, 'description') || { children: [] });
    const label = `${short} (video ${title ? title.slice(0, 40) : thumb})`;

    if (!thumb) err(`${label}: missing required <video:thumbnail_loc>`);
    else {
      try {
        const tu = new URL(thumb);
        if (tu.host === SITE_HOST && !fs.existsSync(path.join(ROOT, decodeURIComponent(tu.pathname)))) {
          err(`${label}: thumbnail missing from disk: ${tu.pathname}`);
        }
      } catch { err(`${label}: thumbnail_loc is not an absolute URL`); }
    }
    if (!title) err(`${label}: missing required <video:title>`);
    if (title && title.length > 100) warn(`${label}: video:title is ${title.length} chars - keep it under 100`);
    if (!desc) err(`${label}: missing required <video:description>`);
    if (desc && desc.length > 2048) err(`${label}: video:description exceeds 2048 chars`);

    const contentLoc = child(vid, 'content_loc');
    const playerLoc = child(vid, 'player_loc');
    if (!contentLoc && !playerLoc) {
      err(`${label}: needs <video:content_loc> or <video:player_loc>`);
    }
    if (contentLoc) {
      const cv = text(contentLoc);
      if (!VIDEO_FILE_RE.test(cv)) {
        err(
          `${label}: video:content_loc "${cv}" is not a media file. ` +
          `Google requires a raw video file (HTML and Flash are unsupported formats). ` +
          `For YouTube, drop content_loc and use only video:player_loc.`
        );
      }
      if (cv === loc) err(`${label}: video:content_loc must not equal the page <loc>`);
    }
    if (playerLoc) {
      const pv = text(playerLoc);
      if (pv === loc) err(`${label}: video:player_loc must not equal the page <loc>`);
      if (contentLoc && text(contentLoc) === pv) {
        err(`${label}: video:content_loc and video:player_loc are identical`);
      }
    }

    const dur = child(vid, 'duration');
    if (dur) {
      const d = Number(text(dur));
      if (!Number.isInteger(d) || d < 1 || d > 86400) err(`${label}: video:duration must be 1-86400 seconds`);
    }
    const pub = child(vid, 'publication_date');
    if (pub && !validDate(text(pub))) err(`${label}: publication_date "${text(pub)}" is not a valid W3C datetime`);
    const ff = child(vid, 'family_friendly');
    if (ff && !/^(yes|no)$/i.test(text(ff))) err(`${label}: family_friendly must be "yes" or "no"`);

    const tags = kids(vid).filter((k) => resolve(k, k.name).local === 'tag');
    if (tags.length > MAX_TAGS_PER_VIDEO) err(`${label}: ${tags.length} tags - limit is ${MAX_TAGS_PER_VIDEO}`);

    checkOrder(vid, ORDER.video, label);
  }

  liveTargets.push(loc);
}

/* 5. coverage report ------------------------------------------------------- */
const pageFiles = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name.endsWith('-src')) continue; walk(abs); }
    else if (e.isFile() && e.name === 'index.html') {
      const rel = path.relative(ROOT, abs).replace(/[/\\]index\.html$/, '');
      const clean = rel === 'index.html' ? '' : rel;
      pageFiles.push('/' + clean);
    }
  }
};
walk(ROOT);
const missing = pageFiles.filter((p) => !seenLocs.has(`https://${SITE_HOST}${p === '/' ? '/' : p}`));
if (missing.length) {
  warn(`pages on disk that are NOT in the sitemap: ${missing.join(', ')}`);
}

/* 6. optional live HTTP check --------------------------------------------- */
let liveFails = 0;
if (LIVE) {
  console.log('live checks:');
  for (const loc of liveTargets) {
    try {
      const res = await fetch(loc, {
        redirect: 'manual',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      });
      const ok = res.status === 200;
      if (!ok) { err(`live: ${loc} -> HTTP ${res.status}`); liveFails++; }
      const tag = ok ? '200' : String(res.status);
      console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${tag.padEnd(4)} ${loc}`);
      if (res.status >= 300 && res.status < 400) {
        err(`live: ${loc} redirects to ${res.headers.get('location')} - submit the final URL only`);
      }
    } catch (e) {
      warn(`live: ${loc} -> request failed (${e.message})`);
    }
  }
}

/* ----------------------------------------------------------------- summary */

console.log('');
for (const i of info) console.log(`  note   ${i}`);
console.log('');
if (warnings.length) {
  console.log(`  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`    !  ${w}`);
  console.log('');
}
if (errors.length) {
  console.log(`  ${errors.length} error(s) - DO NOT SUBMIT:`);
  for (const e of errors) console.log(`    x  ${e}`);
  console.log('');
  process.exit(1);
}

console.log(
  `  PASS - ${urls.length} URLs, ${imageCount} images, ${videoCount} videos. ` +
  `Safe to submit in Google Search Console.\n`
);
process.exit(0);
