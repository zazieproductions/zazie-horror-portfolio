import { ensureMobileUxAssets } from './mobile-ux.mjs';

const SEO_START = '<!--SEO:START-->';
const SEO_END = '<!--SEO:END-->';
const HOME_POSTERS_START = '<!--HOME-POSTERS:START-->';
const HOME_POSTERS_END = '<!--HOME-POSTERS:END-->';

function replaceMarkedContents(html, startMarker, endMarker, replacement, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`index.html is missing a matching ${label} marker pair`);
  }
  const contentStart = start + startMarker.length;
  return html.slice(0, contentStart) + '\n' + replacement + '\n' + html.slice(end);
}

/** Regenerate the marked homepage regions, then canonicalize mobile CSS last. */
export function renderHomeDocument(html, { seo, posters }) {
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('index.html must wrap its complete <head> with <!--SEO:START--> and <!--SEO:END-->');
  }

  const contentStart = start + SEO_START.length;
  const markedHead = html.slice(contentStart, end).trim();
  if (!/^<head\b/i.test(markedHead) || !/<\/head>\s*$/i.test(markedHead)) {
    throw new Error('index.html SEO markers must enclose one complete <head>...</head>');
  }

  let templateHead = markedHead;
  // Remove the mobile block before stripping SEO. If it stayed between the
  // resources and SEO, each regeneration would leave more blank lines there.
  // ensureMobileUxAssets() reinstalls exactly one current block at the end.
  templateHead = templateHead.replace(/<style id="zp-mobile-ux">[\s\S]*?<\/style>\s*/g, '');
  templateHead = templateHead.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
  templateHead = templateHead.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  // Drop every meta tag re-emitted by the SEO source, including color-scheme;
  // otherwise each complete build accumulates another copy.
  templateHead = templateHead.replace(/<meta\b[^>]*>/gi, (tag) => {
    const name = /\bname\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2]?.toLowerCase() ?? '';
    const property = /\bproperty\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2]?.toLowerCase() ?? '';
    if (name === 'description' || name === 'robots' || name === 'author' || name === 'color-scheme') return '';
    if (name.startsWith('twitter:')) return '';
    if (property.startsWith('og:')) return '';
    return tag;
  });
  templateHead = templateHead.replace(/<link\b[^>]*>/gi, (tag) =>
    /\brel\s*=\s*(["'])canonical\1/i.test(tag) || /\/llms\.txt\b/i.test(tag) ? '' : tag,
  );
  templateHead = templateHead.replace(/<!--[\s\S]*?-->/g, (comment) =>
    /JSON-LD|STRUCTURED DATA/i.test(comment) ? '' : comment,
  );
  const close = templateHead.lastIndexOf('</head>');
  if (close === -1) throw new Error('index.html source head lost its </head> while rebuilding');
  const fullHead = `${templateHead.slice(0, close).trimEnd()}\n${seo}\n</head>`;
  let nextHtml = replaceMarkedContents(html, SEO_START, SEO_END, fullHead, 'SEO');
  nextHtml = replaceMarkedContents(nextHtml, HOME_POSTERS_START, HOME_POSTERS_END, posters, 'home-poster');
  return ensureMobileUxAssets(nextHtml);
}
