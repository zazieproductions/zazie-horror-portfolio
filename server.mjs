import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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
 *
 * Self hosted film samples (/media/<slug>/...) are served with HTTP Range
 * support, the HLS media types and the same noindex/no-store-elsewhere hints
 * as the production `_headers` rule. Set MEDIA_ROOT to a directory that holds
 * <slug>/master.m3u8 to preview a ladder that is not committed yet (for
 * example the output of `node tools/encode-film.mjs ... --out build/test-media/eclipsed`:
 * `MEDIA_ROOT=build/test-media node server.mjs`).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const MEDIA_ROOT = process.env.MEDIA_ROOT ? path.resolve(process.env.MEDIA_ROOT) : path.join(__dirname, 'media');

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
  '.mp4': 'video/mp4',
  '.m4s': 'video/iso.segment',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=utf-8',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
};

const file = (rel) => (rel.startsWith('media/') ? path.join(MEDIA_ROOT, rel.slice('media/'.length)) : path.join(__dirname, rel));
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
      const body = fs.readFileSync(file(notFound));
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'noindex, follow',
      });
      res.end(body);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(rel).toLowerCase();
  if (rel.startsWith('media/')) {
    serveMedia(req, res, file(rel), MIME[ext] || 'application/octet-stream');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=31536000',
  });
  fs.createReadStream(file(rel)).pipe(res);
});

/** Range-capable media response mirroring the production /media/* header rule. */
function serveMedia(req, res, absolute, type) {
  const { size } = fs.statSync(absolute);
  const headers = {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    let end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` });
      res.end();
      return;
    }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(absolute, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...headers, 'Content-Length': size });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(absolute).pipe(res);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
