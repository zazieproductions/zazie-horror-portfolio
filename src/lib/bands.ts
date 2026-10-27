/**
 * src/lib/bands.ts
 * ----------------------------------------------------------------------------
 * Turns a "document plate" page into the banded layout the portfolio home uses.
 *
 *   in:   <div class="doc"> > .shell.doc-layout > (.doc-index + .doc-body > sections)
 *   out:  <div class="doc doc-banded"> > .section-jump + section.band* > .shell > .doc-body
 *
 * WHY THIS IS A FUNCTION AND NOT HAND-WRITTEN MARKUP
 *
 * The 65 item pages are generated from one template, so their layout has to be
 * produced, not typed. The 18 hub and document pages were converted with this
 * same algorithm; keeping it here means one definition of the banded structure
 * rather than a template that has to be kept in step with 18 static files by
 * hand. See BANDS.md for the migration record.
 *
 * TWO INVARIANTS, both checked by the build:
 *
 *   1. Content is moved VERBATIM. No re-indentation, no reordering: a
 *      `.copy-plate` <pre> on /licensing carries a whitespace-significant
 *      credit line that a copy button hands to the visitor, and a <figure>
 *      sitting between two clauses must stay between those two bands.
 *   2. Every section keeps its own classes and its <h2> exactly where they
 *      were, so each existing selector keeps matching - `.clause > h2`,
 *      `.faq-group > h2`, `.site-map > ul`, and item.css's `.doc-body
 *      .table-wrap`. The band supplies the full-bleed surface and the shell;
 *      legal.css supplies the display-scale head. Nothing is moved, so nothing
 *      can silently break.
 */

/** Elements that never have a closing tag, so they never affect nesting. */
const VOID = new Set([
  'img', 'br', 'hr', 'meta', 'link', 'input', 'source', 'area', 'base',
  'col', 'embed', 'param', 'track', 'wbr',
]);

/** One token of markup: a comment, or an open/close/self-closing tag. */
const TOKEN_SOURCE = '<!--[\\s\\S]*?-->|<\\s*(\\/?)\\s*([a-zA-Z][a-zA-Z0-9-]*)([^<>]*?)(\\/?)\\s*>';

function tokens(from: number): RegExp {
  // A fresh RegExp each time: a shared /g object carries lastIndex between
  // calls, which would silently resume one scan inside another.
  const re = new RegExp(TOKEN_SOURCE, 'g');
  re.lastIndex = from;
  return re;
}

/** Absolute index just past the element whose open tag starts at `start`. */
function matchEnd(source: string, start: number): number {
  const head = /^<\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(source.slice(start));
  if (!head) throw new Error(`bands: no element at offset ${start}`);
  const tag = head[1]!.toLowerCase();
  const gt = source.indexOf('>', start);
  if (gt < 0) throw new Error(`bands: unterminated <${tag}>`);
  if (source.slice(start, gt + 1).endsWith('/>')) return gt + 1;

  const re = tokens(gt + 1);
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    if (match[0].startsWith('<!--')) continue;
    const name = match[2]!.toLowerCase();
    if (VOID.has(name) || match[4] === '/') continue;
    if (match[1] === '/') {
      if (name === tag && --depth === 0) return re.lastIndex;
    } else if (name === tag) {
      depth += 1;
    }
  }
  throw new Error(`bands: unbalanced <${tag}> at offset ${start}`);
}

interface Kid {
  tag: string;
  attrs: string;
  /** Absolute offsets in the string passed to `children`. */
  from: number;
  to: number;
}

/** Direct element children of the element opening at `start`. */
function children(source: string, start: number): Kid[] {
  const open = source.indexOf('>', start) + 1;
  const end = matchEnd(source, start);
  const closeLen = (source.slice(open, end).match(/<\/[a-zA-Z][a-zA-Z0-9-]*\s*>\s*$/) ?? [''])[0].length;
  const innerEnd = end - closeLen;

  const out: Kid[] = [];
  const re = tokens(open);
  let depth = 0;
  let current: Kid | null = null;
  let match: RegExpExecArray | null;

  while ((match = re.exec(source)) && match.index < innerEnd) {
    if (match[0].startsWith('<!--')) continue;
    const name = match[2]!.toLowerCase();
    const isVoid = VOID.has(name) || match[4] === '/';

    if (match[1] === '/') {
      if (depth > 0) depth -= 1;
      if (depth === 0 && current && current.tag === name) {
        current.to = re.lastIndex;
        out.push(current);
        current = null;
      }
      continue;
    }
    if (depth === 0 && !current) {
      current = { tag: name, attrs: match[3] ?? '', from: match.index, to: -1 };
      if (isVoid) {
        current.to = re.lastIndex;
        out.push(current);
        current = null;
      }
    }
    if (!isVoid) depth += 1;
  }
  if (current) throw new Error(`bands: unbalanced <${current.tag}> inside the element at offset ${start}`);
  return out;
}

function attribute(attrs: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`).exec(attrs);
  return match ? match[1]! : null;
}

/** The sticky Contents rail becomes a horizontal jump bar under the masthead. */
function sectionJump(markup: string): string {
  const links = [...markup.matchAll(/<a\s+href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((match) => ({
      id: match[1]!,
      // The rail prefixes each label with an archive numeral in a span; the
      // band head already carries that numeral, so the chip keeps the words.
      label: match[2]!
        .replace(/<span class="idx">[\s\S]*?<\/span>/, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    }))
    .filter((link) => link.label);
  if (!links.length) return '';

  const items = links.map((link) => `        <li><a href="#${link.id}">${link.label}</a></li>`).join('\n');
  return `  <nav class="section-jump" aria-label="On this page">
    <div class="shell section-jump-inner">
      <p>Contents</p>
      <ul>
${items}
      </ul>
    </div>
  </nav>

`;
}

/** Above this many sections a page stops alternating surfaces. Terms carries
 *  25, privacy 15, licensing 14: alternating void/ink that often reads as
 *  stripes rather than as rhythm, and these are documents people rely on. */
const CALM_AT = 10;

/**
 * Rewrite the document plate in a whole page into bands.
 * Returns the input unchanged if it carries no plate to convert.
 */
export function bandifyDocument(source: string): string {
  const docOpen = source.search(/<div class="doc"[^>]*>/);
  if (docOpen < 0) return source;
  const docEnd = matchEnd(source, docOpen);
  const docRegion = source.slice(docOpen, docEnd);

  const layoutOpen = docRegion.search(/<div class="shell doc-layout"[^>]*>/);
  if (layoutOpen < 0) return source;

  let jump = '';
  let body: Kid | null = null;
  for (const kid of children(docRegion, layoutOpen)) {
    if (kid.tag === 'nav' && /\bdoc-index\b/.test(kid.attrs)) jump = sectionJump(docRegion.slice(kid.from, kid.to));
    if (kid.tag === 'div' && /\bdoc-body\b/.test(kid.attrs)) body = kid;
  }
  if (!body || body.to < 0) return source;

  const bodyMarkup = docRegion.slice(body.from, body.to);
  const kids = children(bodyMarkup, 0);

  /* Walk children in strict source order, so loose content between two
     sections keeps its position by getting a band of its own. */
  type Block = { kind: 'band'; kid: Kid } | { kind: 'loose'; kids: Kid[] };
  const blocks: Block[] = [];
  let loose: Kid[] = [];
  const flush = (): void => {
    if (loose.length) {
      blocks.push({ kind: 'loose', kids: loose });
      loose = [];
    }
  };

  for (const kid of kids) {
    const cls = attribute(kid.attrs, 'class') ?? '';
    // The mobile chip nav is superseded by .section-jump, which works at every
    // width; dropping it is the one deliberate content removal here.
    if (kid.tag === 'nav' && /\bdoc-jump\b/.test(cls)) continue;
    if (kid.tag === 'section' && /\b(clause|faq-group)\b/.test(cls)) {
      flush();
      blocks.push({ kind: 'band', kid });
    } else {
      loose.push(kid);
    }
  }
  flush();

  const sectionCount = blocks.filter((block) => block.kind === 'band').length;
  if (!sectionCount) return source;

  const calm = sectionCount > CALM_AT;
  const surface = (index: number): string => (calm ? 'band-void' : index % 2 === 0 ? 'band-void' : 'band-ink');
  const slice = (kid: Kid): string => bodyMarkup.slice(kid.from, kid.to);

  let out = `<div class="doc doc-banded${calm ? ' doc-calm' : ''}">\n\n`;
  out += jump;

  let bandNo = 0;
  for (const block of blocks) {
    if (block.kind === 'loose') {
      out += `  <section class="band ${surface(bandNo)} band-lead-in">
    <div class="shell band-inner">
      <div class="doc-body">
${block.kids.map(slice).join('\n')}
      </div>
    </div>
  </section>

`;
      bandNo += 1;
      continue;
    }

    const kid = block.kid;
    const inner = slice(kid);
    const openEnd = inner.indexOf('>') + 1;
    const closeStart = inner.lastIndexOf(`</${kid.tag}`);
    const cls = attribute(kid.attrs, 'class') ?? 'clause';
    const id = attribute(kid.attrs, 'id');
    out += `  <section class="band ${surface(bandNo)}"${id ? ` id="${id}"` : ''}>
    <div class="shell band-inner">
      <div class="doc-body ${cls}">
${inner.slice(openEnd, closeStart).replace(/\s+$/, '')}
      </div>
    </div>
  </section>

`;
    bandNo += 1;
  }
  out += '</div>';

  return source.slice(0, docOpen) + out + source.slice(docEnd);
}
