import { ensureMobileUxAssets } from './mobile-ux.mjs';

const SEO_START = '<!--SEO:START-->';
const SEO_END = '<!--SEO:END-->';
const HOME_POSTERS_START = '<!--HOME-POSTERS:START-->';
const HOME_POSTERS_END = '<!--HOME-POSTERS:END-->';
export const GENERATED_SEO_START = '<!--SEO:GENERATED:START-->';
export const GENERATED_SEO_END = '<!--SEO:GENERATED:END-->';

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

  // Remove the mobile block before regenerating SEO so repeated passes cannot
  // accumulate whitespace ahead of it; the final ensure installs one block.
  let templateHead = markedHead.replace(/<style id="zp-mobile-ux">[\s\S]*?<\/style>\s*/g, '');
  templateHead = replaceMarkedContents(templateHead, GENERATED_SEO_START, GENERATED_SEO_END, seo, 'generated SEO');
  const close = templateHead.lastIndexOf('</head>');
  if (close === -1) throw new Error('index.html source head lost its </head> while rebuilding');
  const fullHead = `${templateHead.slice(0, close).trimEnd()}\n</head>`;
  let nextHtml = replaceMarkedContents(html, SEO_START, SEO_END, fullHead, 'SEO');
  nextHtml = replaceMarkedContents(nextHtml, HOME_POSTERS_START, HOME_POSTERS_END, posters, 'home-poster');
  return ensureMobileUxAssets(nextHtml);
}
