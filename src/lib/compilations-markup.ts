/**
 * Homepage "Compilations" section: markup, styles and the click-to-load script.
 *
 * The same HTML is written into index.html and, via dangerouslySetInnerHTML,
 * into the patched React bundle, so the prerendered page and the client render
 * agree (see home-src/build.mjs). Nothing is requested from bandcamp.com until
 * the visitor presses play on a cover: the script creates the iframe at that
 * moment and slides it open under the cover (privacy notice, sections 6 and 7).
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

export function compilationSlug(item: CompilationItem): string {
  return item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function compilationAlbumSlug(item: CompilationItem): string {
  return item.album
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.2v13.6a.6.6 0 0 0 .92.5l10.6-6.8a.6.6 0 0 0 0-1L8.92 4.7A.6.6 0 0 0 8 5.2z"/></svg>';

/** The cover is the player's front door: play sits on the art, the player opens beneath it. */
function stage(item: CompilationItem): string {
  const img =
    `<img src="${coverUrl(item)}" alt="${esc(item.alt)}" width="700" height="700" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  const label = `Play ${item.title} from ${item.album}, ${item.duration}. Opens the Bandcamp player.`;
  return (
    `<div class="zp-stage">` +
    img +
    `<button class="zp-bc-load" type="button" aria-label="${esc(label)}"><span class="zp-play">${PLAY_ICON}</span></button>` +
    `</div>`
  );
}

function card(item: CompilationItem): string {
  const slug = compilationSlug(item);
  const albumSlug = compilationAlbumSlug(item);
  const articleIdAttr = albumSlug && albumSlug !== slug ? ` id="${albumSlug}"` : '';
  // The song title doubles as the no-JavaScript listening link, without adding
  // another label to the card. Some tracks only have an album URL.
  const listenUrl = item.trackUrl || item.albumUrl;
  const song = listenUrl
    ? `<a class="zp-comp-listen" href="${esc(listenUrl)}" target="_blank" rel="noopener" aria-label="${esc(item.title)} on Bandcamp (opens in a new tab)">${esc(item.title)}</a>`
    : esc(item.title);
  // A single title is enough when the release and song have the same name.
  const titles = item.album === item.title
    ? `<h3 id="${slug}-title">${song}</h3>`
    : `<h3 id="${slug}-title">${esc(item.album)}</h3><p class="zp-comp-track">${song}</p>`;
  const title = `${item.title} - ${item.duration} - Bandcamp player`;
  return (
    `<li class="zp-comp-card" id="${slug}">` +
    `<article class="zp-comp-article"${articleIdAttr} aria-label="${esc(item.title)} from ${esc(item.album)}">` +
    `<div class="zp-bc" data-bc-src="${playerUrl(item)}" data-bc-title="${esc(title)}">` +
    stage(item) +
    `<div class="zp-slot"><div class="zp-slot-inner"></div></div>` +
    `</div>` +
    `<div class="zp-comp-body">${titles}</div>` +
    `</article>` +
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
    `<p class="mb-3 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-blood sm:text-[11px]"><span class="h-px w-8 bg-blood/60" aria-hidden="true"></span>Compilation Features</p>` +
    `<h2 class="font-display text-3xl leading-[1.05] tracking-tight text-bone sm:text-4xl md:text-5xl">Selected Works</h2>` +
    `</div>` +
    `<ul class="zp-comp-grid">${compilations.map(card).join('')}</ul>`
  );
}

/** The whole section, as it appears in index.html. */
export function compilationsSectionHtml(): string {
  return `<section id="compilations" aria-label="Selected compilations and releases" class="${SECTION_CLASS}"><div class="${CONTAINER_CLASS}">${compilationsInnerHtml()}</div></section>`;
}

export const COMPILATIONS_CSS = `
  /* Homepage compilations: compact rows of small cover art + title, with a click-to-load Bandcamp player. */
  .zp-comp-grid{display:grid;gap:.5rem;margin:0;padding:0;list-style:none}
  @media (min-width:640px){.zp-comp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (min-width:1024px){.zp-comp-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem}}
  .zp-comp-card{position:relative;min-width:0;overflow:hidden;border:1px solid #1e1e1e;background:#0a0a0a;scroll-margin-top:5.5rem;transition:border-color .3s,background .3s,box-shadow .3s}
  .zp-comp-article{display:grid;grid-template-columns:3.25rem minmax(0,1fr);grid-template-areas:"stage body" "player player";align-items:center}
  @media (min-width:640px){.zp-comp-article{grid-template-columns:3.75rem minmax(0,1fr)}}
  .zp-comp-card:hover,.zp-comp-card:focus-within,.zp-comp-card.zp-open{border-color:rgba(230,86,80,.65);background:#101010;box-shadow:0 10px 24px -18px rgba(196,30,30,.6),0 0 0 1px rgba(230,86,80,.16)}
  /* The player wrapper is only a hook for the script; its two children join the row's grid. */
  .zp-bc{display:contents}
  .zp-stage{grid-area:stage;position:relative;align-self:center;aspect-ratio:1/1;overflow:hidden;background:#121212}
  .zp-stage img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.2,.7,.2,1),filter .4s}
  .zp-comp-card:hover .zp-stage img{transform:scale(1.06)}
  .zp-stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(3,3,3,.12) 0,rgba(3,3,3,0) 40%,rgba(3,3,3,.5) 100%)}
  .zp-bc-load{position:absolute;inset:0;z-index:3;display:none;align-items:center;justify-content:center;margin:0;padding:0;border:0;background:transparent;cursor:pointer;transition:opacity .3s}
  .zp-bc-js .zp-bc-load{display:flex}
  .zp-play{position:relative;display:grid;place-items:center;width:1.75rem;height:1.75rem;border-radius:50%;background:rgba(196,30,30,.94);color:#f0ebe3;box-shadow:0 0 0 1px rgba(255,255,255,.16),0 4px 12px rgba(0,0,0,.55);transition:transform .3s cubic-bezier(.2,.7,.2,1),background .3s}
  .zp-play svg{display:block;width:.7rem;height:.7rem;margin-left:.08rem;fill:currentColor}
  .zp-play::before{content:"";position:absolute;inset:-.3rem;border-radius:50%;border:1px solid rgba(255,42,42,.45);opacity:0;animation:zp-ring 3.2s ease-out infinite}
  @keyframes zp-ring{0%{opacity:.6;transform:scale(.85)}70%,100%{opacity:0;transform:scale(1.3)}}
  .zp-bc-load:hover .zp-play,.zp-bc-load:focus-visible .zp-play{transform:scale(1.1);background:#e02a2a}
  .zp-bc-load:focus-visible{outline:2px solid #ff2a2a;outline-offset:-4px}
  .zp-open .zp-bc-load{opacity:0;pointer-events:none}
  .zp-slot{grid-area:player;display:grid;grid-template-rows:0fr;align-self:stretch;background:#121212;transition:grid-template-rows .45s cubic-bezier(.2,.7,.2,1)}
  .zp-open .zp-slot{grid-template-rows:1fr}
  .zp-slot-inner{min-height:0;overflow:hidden;background:linear-gradient(100deg,#121212 30%,#1b1b1b 50%,#121212 70%) 0 0/200% 100%;animation:zp-shimmer 1.6s linear infinite}
  .zp-slot iframe{display:block;width:100%;height:120px;border:0;opacity:0;transition:opacity .4s .1s}
  .zp-slot iframe.zp-ready{opacity:1}
  @keyframes zp-shimmer{to{background-position:-200% 0}}
  .zp-comp-body{display:flex;grid-area:body;min-width:0;flex-direction:column;gap:.1rem;padding:.4rem .7rem .4rem .55rem}
  .zp-comp-card:has(.zp-bc-load:focus-visible){outline-offset:2px}
  .zp-comp-card h3{margin:0;font-family:var(--font-display,'Cormorant Garamond',serif);font-weight:400;font-size:.95rem;line-height:1.25;color:#f0ebe3;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
  .zp-comp-track{margin:0;font-size:.78rem;line-height:1.35;color:#b6b1aa;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;line-clamp:1;overflow:hidden}
  .zp-comp-listen{color:inherit;text-decoration:underline;text-decoration-color:rgba(230,86,80,.6);text-underline-offset:2px;transition:color .2s,text-decoration-color .2s}
  .zp-comp-listen:hover,.zp-comp-listen:focus-visible{color:#e65650;text-decoration-color:currentColor}
  @media (prefers-reduced-motion:reduce){
    .zp-comp-card,.zp-stage img,.zp-play,.zp-slot,.zp-slot iframe{transition:none}
    .zp-comp-card:hover .zp-stage img{transform:none}
    .zp-play::before,.zp-slot-inner{animation:none}
  }
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
    var slot = box ? box.querySelector(".zp-slot-inner") : null;
    var src = box ? box.getAttribute("data-bc-src") || "" : "";
    if (!box || !slot || src.indexOf(PREFIX) !== 0) return;
    var frame = document.createElement("iframe");
    var ready = function () { frame.classList.add("zp-ready"); };
    frame.addEventListener("load", ready);
    window.setTimeout(ready, 4000);
    frame.src = src;
    frame.title = box.getAttribute("data-bc-title") || "Bandcamp player";
    frame.setAttribute("allow", "autoplay; encrypted-media");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute("seamless", "");
    slot.appendChild(frame);
    var card = box.closest(".zp-comp-card");
    if (card) card.classList.add("zp-open");
    if (btn.parentNode) btn.parentNode.removeChild(btn);
    frame.focus();
  });
})();`;
