import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { createBrotliCompress, createGzip } from 'node:zlib';
import { fileURLToPath } from 'node:url';

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
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

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
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
};

const COMPRESSIBLE = /^(?:text\/|application\/(?:javascript|json|xml|wasm|xhtml\+xml))/i;
const H3_ALT_SVC = 'h3=":443"; ma=86400';

const file = (rel) => path.join(__dirname, rel);
const isFile = (rel) => {
  try {
    return fs.statSync(file(rel)).isFile();
  } catch {
    return false;
  }
};

/** Prefer Brotli, then gzip, while leaving already-compressed media alone. */
function negotiatedEncoding(req, contentType, size) {
  if (size < 1024 || !COMPRESSIBLE.test(contentType || '')) return null;
  const header = String(req.headers['accept-encoding'] || '').toLowerCase();
  const quality = (name) => {
    const match = header.match(new RegExp(`(?:^|,)\\s*${name}(?:\\s*;\\s*q=([0-9.]+))?`));
    return match ? Number(match[1] ?? 1) : 0;
  };
  if (quality('br') > 0) return 'br';
  if (quality('gzip') > 0) return 'gzip';
  return null;
}

function sendFile(req, res, rel, status = 200, extraHeaders = {}) {
  const absolute = file(rel);
  const stat = fs.statSync(absolute);
  const contentType = MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream';
  const encoding = negotiatedEncoding(req, contentType, stat.size);
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': path.extname(rel).toLowerCase() === '.html' || rel === 'home-defer.js'
      ? 'public, max-age=0, must-revalidate'
      : 'public, max-age=31536000',
    'Alt-Svc': H3_ALT_SVC,
    ...extraHeaders,
  };
  if (encoding) {
    headers['Content-Encoding'] = encoding;
    headers.Vary = 'Accept-Encoding';
  } else {
    headers['Content-Length'] = stat.size;
  }
  res.writeHead(status, headers);
  const source = fs.createReadStream(absolute);
  if (!encoding) {
    source.pipe(res);
    return;
  }
  const compressor = encoding === 'br' ? createBrotliCompress() : createGzip();
  pipeline(source, compressor, res, () => {});
}

/** Exact legacy redirects from _redirects; wildcard routes are handled by the 404 fallback. */
const explicitRedirects = new Map();
for (const raw of fs.readFileSync(file('_redirects'), 'utf8').split(/\r?\n/)) {
  const line = raw.replace(/#.*$/, '').trim();
  if (!line) continue;
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

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let urlPath = decodeURIComponent(parsed.pathname);

  const explicit = explicitRedirects.get(urlPath);
  if (explicit) {
    res.writeHead(explicit.status, { Location: explicit.to + parsed.search });
    res.end();
    return;
  }

  // Serve the clean URL for a real flat .html file through one permanent
  // alias redirect. Unknown .html paths are not redirected to another miss;
  // they fall through to the real noindex 404 below.
  if (urlPath !== '/' && urlPath.endsWith('.html') && urlPath !== '/404.html' && urlPath !== '/index.html') {
    const targetPath = urlPath.slice(0, -'.html'.length);
    if (resolve(targetPath)) {
      res.writeHead(308, { Location: targetPath + parsed.search });
      res.end();
      return;
    }
  }
  // Do not trim a trailing slash before resolution. Existing directory hubs
  // have a real index.html and still resolve; flat item paths have no directory
  // twin and therefore reach the noindex 404 below.
  const rel = resolve(urlPath);
  if (!rel) {
    const notFound = '404.html';
    if (isFile(notFound)) {
      sendFile(req, res, notFound, 404, {
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'noindex, follow',
      });
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Alt-Svc': H3_ALT_SVC });
    res.end('404 Not Found');
    return;
  }

  sendFile(req, res, rel, 200, { 'Access-Control-Allow-Origin': '*' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
