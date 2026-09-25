import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
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
};

const CLEAN_ROUTES = [
  '/work', '/reel', '/composer', '/process', '/services', '/contact',
  '/store', '/legal', '/faq', '/terms', '/privacy', '/licensing', '/purchases', '/accessibility',
  '/sitemap'
];

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let urlPath = decodeURIComponent(parsed.pathname);

  // Normalize trailing slash for clean routes
  const trimmed = urlPath.replace(/\/$/, '') || '/';
  if (CLEAN_ROUTES.includes(trimmed) || CLEAN_ROUTES.includes(urlPath)) {
    // Serve directory index.html for /work -> /work/index.html, etc.
    const candidate = path.join(__dirname, trimmed, 'index.html');
    if (fs.existsSync(candidate)) {
      urlPath = path.posix.join(trimmed, 'index.html');
    } else if (fs.existsSync(path.join(__dirname, trimmed + '.html'))) {
      urlPath = trimmed + '.html';
    } else if (trimmed === '/store' && fs.existsSync(path.join(__dirname, 'store.html'))) {
      urlPath = '/store.html';
    }
  }

  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  let filePath = path.join(__dirname, urlPath);

  // Directory URLs resolve to their index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Fallback to .html if not found
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      // Try 404 page
      const notFoundPath = path.join(__dirname, '404.html');
      if (fs.existsSync(notFoundPath)) {
        const data = fs.readFileSync(notFoundPath);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end(data);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
  });

  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
