/**
 * Homepage "Compilations" section: markup, styles and the click-to-load script.
 *
 * The same HTML is written into index.html and, via dangerouslySetInnerHTML,
 * into the patched React bundle, so the prerendered page and the client render
 * agree (see home-src/build.mjs). Nothing is requested from bandcamp.com until
 * the visitor presses a "Load Bandcamp player" button: the script creates the
 * iframe at that moment (privacy notice, sections 6 and 7).
 */

import { compilations, type CompilationItem } from '../data/compilations.js';

export const BANDCAMP_EMBED_PREFIX = 'https://bandcamp.com/EmbeddedPlayer/';

const esc = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function playerUrl(item: CompilationItem): string {
  const album = item.albumId ? `album=${item.albumId}/` : '';
  const track = item.albumId ? `/track=${item.trackId}` : '';
  const trackOnly = item.albumId ? '' : `track=${item.trackId}/`;
  return `${BANDCAMP_EMBED_PREFIX}${album}${trackOnly}size=large/bgcol=121212/linkcol=c41e1e/tracklist=false/artwork=small${track}/transparent=true/`;
}

/** Bandcamp's 700px square cover for an artwork id. */
export function coverUrl(item: CompilationItem): string {
  return `https://f4.bcbits.com/img/a${item.artId}_16.jpg`;
}

function cover(item: CompilationItem): string {
  const href = item.albumUrl ?? item.trackUrl ?? '';
  const img =
    `<img src="${coverUrl(item)}" alt="Cover art for ${esc(item.album)}" width="700" height="700" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  return `<a class="zp-comp-cover" href="${href}" target="_blank" rel="noopener">${img}</a>`;
}

function card(item: CompilationItem): string {
  const links: string[] = [];
  if (item.trackUrl) links.push(`<a href="${item.trackUrl}" target="_blank" rel="noopener">Track on Bandcamp</a>`);
  if (item.albumUrl) {
    links.push(`<a href="${item.albumUrl}" target="_blank" rel="noopener">${item.kind === 'Compilation' ? 'Full compilation' : 'Full release'}</a>`);
  }
  const title = `${item.title} - ${item.duration} - Bandcamp player`;
  return (
    `<li class="zp-comp-card">` +
    cover(item) +
    `<p class="zp-comp-meta"><span>${item.kind}</span> <span>${esc(item.album)}</span></p>` +
    `<h3>${esc(item.title)}</h3>` +
    `<p class="zp-comp-note">${esc(item.note)}</p>` +
    `<div class="zp-bc" data-bc-src="${playerUrl(item)}" data-bc-title="${esc(title)}">` +
    `<button class="zp-bc-load" type="button"><span aria-hidden="true">&#9654;</span> Load Bandcamp player</button>` +
    `<p class="zp-bc-nojs">The in-page player needs JavaScript. Use the Bandcamp link below to listen.</p>` +
    `</div>` +
    `<p class="zp-comp-links">${links.join(' <span aria-hidden="true">&middot;</span> ')}</p>` +
    `</li>`
  );
}

/** Section classes, shared by the static markup and the React wrapper. */
export const SECTION_CLASS = 'relative border-y border-blood/15 bg-ink py-16 sm:py-24 md:py-28';
export const CONTAINER_CLASS = 'relative mx-auto max-w-7xl px-4 sm:px-6 md:px-8';

/** Everything inside the section's container div. */
export function compilationsInnerHtml(): string {
  return (
    `<div class="mb-10 max-w-2xl sm:mb-12">` +
    `<p class="mb-3 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-blood sm:text-[11px]"><span class="h-px w-8 bg-blood/60" aria-hidden="true"></span>Compilations</p>` +
    `<h2 class="font-display text-3xl leading-[1.05] tracking-tight text-bone sm:text-4xl md:text-5xl">Heard on compilations. <span class="mt-1 block italic text-mist">Tracks and releases on Bandcamp.</span></h2>` +
    `<p class="mt-4 text-sm leading-relaxed text-mist sm:text-base">Pieces contributed to label compilations, plus two releases of my own. Press a button to load the Bandcamp player; the player itself is not requested from Bandcamp until you do.</p>` +
    `</div>` +
    `<ul class="zp-comp-grid">${compilations.map(card).join('')}</ul>` +
    `<p class="mt-6 text-[11px] tracking-wide text-mist">Playback runs in Bandcamp&rsquo;s own player. Full catalogue on <a href="https://zazieproductions.bandcamp.com" target="_blank" rel="noopener" class="text-blood hover:underline">Bandcamp</a> and in the <a href="/store" class="text-blood hover:underline">store</a>.</p>`
  );
}

/** The whole section, as it appears in index.html. */
export function compilationsSectionHtml(): string {
  return `<section id="compilations" class="${SECTION_CLASS}"><div class="${CONTAINER_CLASS}">${compilationsInnerHtml()}</div></section>`;
}

export const COMPILATIONS_CSS = `
  /* Homepage compilations: click-to-load Bandcamp players. */
  .zp-comp-grid{display:grid;gap:1rem;margin:0;padding:0;list-style:none}
  @media (min-width:640px){.zp-comp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (min-width:1024px){.zp-comp-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  .zp-comp-card{display:flex;flex-direction:column;gap:.65rem;min-width:0;padding:1.25rem;border:1px solid #1e1e1e;background:#030303;transition:border-color .3s}
  .zp-comp-card:hover,.zp-comp-card:focus-within{border-color:rgba(196,30,30,.55)}
  .zp-comp-cover{display:block;margin:-1.25rem -1.25rem .35rem;background:#121212;aspect-ratio:1/1;overflow:hidden}
  .zp-comp-cover img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s ease,opacity .3s}
  .zp-comp-cover:hover img{transform:scale(1.03)}
  .zp-comp-cover:focus-visible{outline:2px solid #ff2a2a;outline-offset:-2px}
  @media (prefers-reduced-motion:reduce){.zp-comp-cover img{transition:none}.zp-comp-cover:hover img{transform:none}}
  .zp-comp-meta{display:flex;flex-direction:column;gap:.15rem;margin:0;font-size:.625rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(154,149,144,.8)}
  .zp-comp-meta span:first-child{color:#c41e1e}
  .zp-comp-card h3{margin:0;font-family:var(--font-display,'Cormorant Garamond',serif);font-weight:400;font-size:1.5rem;line-height:1.15;color:#f0ebe3;overflow-wrap:anywhere}
  .zp-comp-note{margin:0;font-size:.8125rem;line-height:1.75;color:#9a9590}
  .zp-bc{margin-top:auto;min-height:120px;display:flex;flex-direction:column;justify-content:center}
  .zp-bc iframe{display:block;width:100%;height:120px;border:0;background:#121212}
  .zp-bc-load{display:none;align-items:center;justify-content:center;gap:.6rem;width:100%;min-height:120px;padding:.75rem 1rem;border:1px solid #1e1e1e;background:#121212;color:#f0ebe3;font:inherit;font-size:.6875rem;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:border-color .25s,background .25s}
  .zp-bc-js .zp-bc-load{display:flex}
  .zp-bc-load:hover{border-color:rgba(196,30,30,.7);background:#171717}
  .zp-bc-load:focus-visible{outline:2px solid #ff2a2a;outline-offset:3px}
  .zp-bc-load span{color:#c41e1e}
  .zp-bc-nojs{margin:0;font-size:.75rem;line-height:1.7;color:#9a9590}
  .zp-bc-js .zp-bc-nojs{display:none}
  .zp-comp-links{margin:0;font-size:.75rem;letter-spacing:.04em;color:#9a9590}
  .zp-comp-links a{color:#f0ebe3;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(196,30,30,.6)}
  .zp-comp-links a:hover{text-decoration-color:#ff2a2a}
`;

/**
 * Delegated on the document so it survives React re-renders. The iframe source
 * is read from the page's own markup and must be a Bandcamp embedded-player URL.
 */
export const COMPILATIONS_JS = `(function(){
  var PREFIX = ${JSON.stringify(BANDCAMP_EMBED_PREFIX)};
  document.documentElement.classList.add("zp-bc-js");
  document.addEventListener("click", function (event) {
    var target = event.target;
    var btn = target && target.closest ? target.closest(".zp-bc-load") : null;
    if (!btn) return;
    var box = btn.closest(".zp-bc");
    var src = box ? box.getAttribute("data-bc-src") || "" : "";
    if (!box || src.indexOf(PREFIX) !== 0) return;
    var frame = document.createElement("iframe");
    frame.src = src;
    frame.title = box.getAttribute("data-bc-title") || "Bandcamp player";
    frame.setAttribute("allow", "autoplay; encrypted-media");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute("seamless", "");
    box.replaceChild(frame, btn);
    frame.focus();
  });
})();`;
