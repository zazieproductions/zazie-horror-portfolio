import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { headersFor } from './tools/headers.mjs';

/**
 * Local static server — a mirror of how Cloudflare Pages answers this tree.
 *
 * The routing here is deliberately the *host's* routing, not a convenience
 * shim, because the whole item-URL design depends on it:
 *
 *   /work                     → work.html if it exists (the root twin),
 *                               else work/index.html            [200]
 *   /work/                    → work/index.html                 [200]
 *   /work/expire              → work/expire.html (flat file)    [200]
 *   /work/expire.html         → 308 to /work/expire
 *   /work/expire/             → 404.html with HTTP 404 (no slash twin)
 *   /work/does-not-exist      → 404.html with HTTP 404
 *
 * The slashless item path resolves from its flat `.html` file, without a
 * redirect hop. A trailing slash only resolves when the matching hub has a
 * real `index.html`; item and unknown paths do not get normalized into a
 * second URL. The `_redirects` fallback and 404.html keep unknown requests as
 * real, noindex 404s.
 *
 * Headers and compression mirror production:
 *
 *   security + Cache-Control   from tools/headers.mjs, the same module
 *                              tools/check-headers.mjs validates `_headers`
 *                              against, so local and edge cannot drift
 *   content encoding           Brotli when the client offers it, Gzip next,
 *                              identity otherwise — Cloudflare Pages does the
 *                              same at the edge, and this is what makes the
 *                              compression claim testable locally
 *   ETag / 304                 strong ETag per representation + Vary, so a
 *                              revalidating client gets an empty 304 instead of
 *                              the whole document
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const IS_HTTPS = process.env.LOCAL_HTTPS === '1';
const ALLOW_EMBED = process.env.ALLOW_EMBED === '1';

function responseHeaders(urlPath, { html = false, extra = {} } = {}) {
  const headers = { ...headersFor(urlPath, { https: IS_HTTPS, html }), ...extra };
  if (ALLOW_EMBED) {
    delete headers['X-Frame-Options'];
    if (headers['Content-Security-Policy']) {
      headers['Content-Security-Policy'] = headers['Content-Security-Policy']
        .split(';')
        .map((directive) => directive.trim())
        .filter((directive) => directive && !/^frame-ancestors\b/i.test(directive))
        .join('; ');
    }
  }
  return headers;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aif': 'audio/aiff',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/** Types worth compressing. Already-compressed media is streamed as-is. */
const COMPRESSIBLE = new Set([
  'text/html; charset=utf-8',
  'text/css; charset=utf-8',
  'text/javascript; charset=utf-8',
  'application/json',
  'image/svg+xml',
  'application/xml',
  'text/plain; charset=utf-8',
  'application/manifest+json',
]);

/** Below this, compression costs more than it saves. */
const COMPRESSION_FLOOR = 1024;

const BROTLI_OPTIONS = {
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
  },
};

const file = (rel) => path.join(__dirname, rel);
const isFile = (rel) => {
  try {
    return fs.statSync(file(rel)).isFile();
  } catch {
    return false;
  }
};

/** Exact legacy redirects from _redirects; wildcard routes are handled by the 404 fallback. */
const explicitRedirects = new Map();
for (const raw of fs.readFileSync(file('_redirects'), 'utf8').split(/\r?\n/)) {
  // Cloudflare Pages treats only lines that START with '#' as comments; a '#'
  // inside a rule is a real fragment of the target (e.g. '/composer /#about').
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [from, to, rawStatus] = line.split(/\s+/);
  if (!from || !to || /[*:(]/.test(from)) continue;
  explicitRedirects.set(from, { to, status: Number(rawStatus) || 301 });
}

/** The file the host would serve for this path, or null. */
function resolve(urlPath) {
  const rel = urlPath.replace(/^\/+/, '');
  if (urlPath === '/' || rel === '') return 'index.html';
  if (isFile(rel)) return rel; // exact asset (includes flat <slug>.html files)
  if (isFile(rel + '.html')) return rel + '.html'; // /work/expire → work/expire.html
  if (isFile(path.posix.join(rel, 'index.html'))) return path.posix.join(rel, 'index.html'); // /work → work/index.html
  return null;
}

/**
 * Pick the best encoding the client actually accepts, honouring q=0 refusals.
 * `br` is preferred: at these file sizes it is ~15% smaller than gzip here.
 */
function negotiatedEncoding(req) {
  const header = String(req.headers['accept-encoding'] || '').toLowerCase();
  if (!header) return null;
  const quality = (name) => {
    const match = new RegExp(`(?:^|,)\\s*${name}\\s*(?:;\\s*q=([0-9.]+))?`).exec(header);
    if (!match) return 0;
    return match[1] === undefined ? 1 : Number(match[1]);
  };
  const br = quality('br');
  const gzip = quality('gzip');
  if (br > 0 && br >= gzip) return 'br';
  if (gzip > 0) return 'gzip';
  return null;
}

function encode(buffer, encoding) {
  if (encoding === 'br') return zlib.brotliCompressSync(buffer, BROTLI_OPTIONS);
  return zlib.gzipSync(buffer, { level: 9 });
}

const etagOf = (buffer) => `"${crypto.createHash('sha1').update(buffer).digest('base64url').slice(0, 27)}"`;

/** Send a full response with the site's policy headers. */
function respond(req, res, { status = 200, urlPath, body, type, extra = {} }) {
  const html = String(type || '').startsWith('text/html');
  const headers = responseHeaders(urlPath, { html, extra });
  if (type) headers['Content-Type'] = type;

  const etag = body ? etagOf(body) : null;
  const ifNoneMatch = req.headers['if-none-match'];
  if (etag) {
    headers.ETag = etag;
    if (ifNoneMatch && ifNoneMatch.split(/\s*,\s*/).includes(etag)) {
      res.writeHead(304, headers);
      res.end();
      return;
    }
  }

  let payload = body;
  const encoding = body && COMPRESSIBLE.has(type) && body.length >= COMPRESSION_FLOOR
    ? negotiatedEncoding(req)
    : null;
  // Vary even when this representation was below the floor: a cache must not
  // hand a compressed copy to a client that did not ask for one.
  if (COMPRESSIBLE.has(type)) headers.Vary = 'Accept-Encoding';
  if (encoding && payload) {
    payload = encode(payload, encoding);
    headers['Content-Encoding'] = encoding;
  }

  headers['Content-Length'] = payload ? payload.length : 0;
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || !payload) res.end();
  else res.end(payload);
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let urlPath = decodeURIComponent(parsed.pathname);

  const explicit = explicitRedirects.get(urlPath);
  if (explicit) {
    res.writeHead(explicit.status, responseHeaders(urlPath, { extra: { Location: explicit.to + parsed.search } }));
    res.end();
    return;
  }

  // .html alias redirects no longer live here. They are declared in _redirects
  // (the same rules deployed to Cloudflare Pages): legacy hub aliases as 301,
  // flat item aliases as generated 308 rules. Keeping the redirect logic in
  // _redirects makes this local mirror faithful to the edge: a missing rule
  // surfaces as a real response here instead of being silently papered over.
  // Unknown .html paths fall through to resolve() and then to the real
  // noindex 404 below.
  // Do not trim a trailing slash before resolution. Existing directory hubs
  // have a real index.html and still resolve; flat item paths have no directory
  // twin and therefore reach the noindex 404 below.
  const rel = resolve(urlPath);
  if (!rel) {
    if (isFile('404.html')) {
      respond(req, res, {
        status: 404,
        urlPath: '/404.html',
        body: fs.readFileSync(file('404.html')),
        type: 'text/html; charset=utf-8',
        extra: { 'Access-Control-Allow-Origin': '*', 'X-Robots-Tag': 'noindex, follow' },
      });
      return;
    }
    res.writeHead(404, { ...headersFor(urlPath, { https: IS_HTTPS }), 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const type = MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream';

  // Compressible text is read whole so it can be encoded, tagged and
  // revalidated. Media is streamed: nothing to gain, and audio is large.
  if (COMPRESSIBLE.has(type)) {
    respond(req, res, { urlPath, body: fs.readFileSync(file(rel)), type, extra: { 'Access-Control-Allow-Origin': '*' } });
    return;
  }

  const stats = fs.statSync(file(rel));
  const etag = `"${stats.size.toString(16)}-${stats.mtimeMs.toString(16)}"`;
  const headers = responseHeaders(urlPath, {
    extra: {
      'Content-Type': type,
      'Access-Control-Allow-Origin': '*',
      ETag: etag,
    },
  });
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    res.end();
    return;
  }
  headers['Content-Length'] = stats.size;
  res.writeHead(200, headers);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(file(rel)).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT} (Brotli/Gzip negotiation on)`);
});
