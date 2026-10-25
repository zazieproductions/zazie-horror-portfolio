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
    `<img src="${coverUrl(item)}" alt="Cover art for ${esc(item.album)}" width="700" height="700" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  const label = `Play ${item.title} from ${item.album}, ${item.duration}. Opens the Bandcamp player.`;
  return (
    `<div class="zp-stage">` +
    img +
    `<span class="zp-badge">${item.kind}</span>` +
    `<span class="zp-dur">${esc(item.duration)}</span>` +
    `<button class="zp-bc-load" type="button" aria-label="${esc(label)}"><span class="zp-play">${PLAY_ICON}</span></button>` +
    `</div>`
  );
}

function card(item: CompilationItem): string {
  const slug = compilationSlug(item);
  const albumSlug = compilationAlbumSlug(item);
  const articleIdAttr = albumSlug && albumSlug !== slug ? ` id="${albumSlug}"` : '';
  const links: string[] = [`<a href="#${slug}">Permalink</a>`];
  if (item.trackUrl) links.push(`<a href="${item.trackUrl}" target="_blank" rel="noopener">Track on Bandcamp</a>`);
  if (item.albumUrl) {
    links.push(`<a href="${item.albumUrl}" target="_blank" rel="noopener">${item.kind === 'Compilation' ? 'Full compilation' : 'Full release'}</a>`);
  }
  const title = `${item.title} - ${item.duration} - Bandcamp player`;
  return (
    `<li class="zp-comp-card" id="${slug}">` +
    `<article class="zp-comp-article"${articleIdAttr} aria-labelledby="${slug}-title">` +
    `<div class="zp-bc" data-bc-src="${playerUrl(item)}" data-bc-title="${esc(title)}">` +
    stage(item) +
    `<div class="zp-slot"><div class="zp-slot-inner"></div></div>` +
    `</div>` +
    `<div class="zp-comp-body">` +
    `<p class="zp-comp-meta">${esc(item.kind)} · ${esc(item.album)} · ${esc(item.duration)}</p>` +
    `<h3 id="${slug}-title"><a class="zp-comp-title-link" href="#${slug}">${esc(item.title)}</a></h3>` +
    `<p class="zp-comp-note">${esc(item.note)}</p>` +
    `<p class="zp-bc-nojs">The in-page player needs JavaScript. Use the Bandcamp links below to listen.</p>` +
    `<p class="zp-comp-links">${links.join('')}</p>` +
    `</div>` +
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
    `<p class="mb-3 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-blood sm:text-[11px]"><span class="h-px w-8 bg-blood/60" aria-hidden="true"></span>Compilations</p>` +
    `<h2 class="font-display text-3xl leading-[1.05] tracking-tight text-bone sm:text-4xl md:text-5xl">Tracks and releases</h2>` +
    `<p class="mt-4 text-base leading-relaxed text-mist">Selected compilation tracks and two Bandcamp releases. Select a cover to play; Bandcamp loads only when you do.</p>` +
    `</div>` +
    `<ul class="zp-comp-grid">${compilations.map(card).join('')}</ul>` +
    `<p class="mt-6 text-base tracking-wide text-mist">Playback runs in Bandcamp&rsquo;s own player. Full catalogue on <a href="https://zazieproductions.bandcamp.com" target="_blank" rel="noopener" class="text-blood underline underline-offset-4 hover:text-bone">Bandcamp</a>, in the <a href="/reel#compilations" class="text-blood underline underline-offset-4 hover:text-bone">showreel compilation archive</a>, and in the <a href="/store" class="text-blood underline underline-offset-4 hover:text-bone">store</a>.</p>`
  );
}

/** The whole section, as it appears in index.html. */
export function compilationsSectionHtml(): string {
  return `<section id="compilations" aria-label="Selected compilations and releases" class="${SECTION_CLASS}"><div class="${CONTAINER_CLASS}">${compilationsInnerHtml()}</div></section>`;
}

export const COMPILATIONS_CSS = `
  /* Homepage compilations: cover art cards with a click-to-load Bandcamp player. */
  .zp-comp-grid{display:grid;gap:1.25rem;margin:0;padding:0;list-style:none}
  @media (min-width:640px){.zp-comp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (min-width:1024px){.zp-comp-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem}}
  .zp-comp-card{position:relative;display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid #1e1e1e;background:linear-gradient(180deg,#0b0b0b,#030303);scroll-margin-top:5.5rem;transition:transform .45s cubic-bezier(.2,.7,.2,1),border-color .3s,box-shadow .45s}
  .zp-comp-article{display:flex;flex:1;flex-direction:column;min-width:0}
  .zp-comp-card:hover,.zp-comp-card:focus-within,.zp-comp-card.zp-open{border-color:rgba(230,86,80,.65);box-shadow:0 22px 44px -22px rgba(196,30,30,.45),0 0 0 1px rgba(230,86,80,.18)}
  .zp-comp-card:hover{transform:translateY(-3px)}
  .zp-bc{display:block}
  .zp-stage{position:relative;aspect-ratio:1/1;overflow:hidden;background:#121212}
  .zp-stage img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .9s cubic-bezier(.2,.7,.2,1),filter .5s}
  .zp-comp-card:hover .zp-stage img{transform:scale(1.05)}
  .zp-stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(3,3,3,.5) 0,rgba(3,3,3,0) 28%,rgba(3,3,3,0) 55%,rgba(3,3,3,.82) 100%)}
  .zp-badge,.zp-dur{position:absolute;z-index:2;padding:.3rem .6rem;border:1px solid rgba(240,235,227,.14);background:rgba(3,3,3,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#f0ebe3;font-size:.6875rem;line-height:1;letter-spacing:.22em;text-transform:uppercase}
  .zp-badge{top:.8rem;left:.8rem}
  .zp-dur{right:.8rem;bottom:.8rem;font-variant-numeric:tabular-nums;letter-spacing:.12em}
  .zp-bc-load{position:absolute;inset:0;z-index:3;display:none;align-items:center;justify-content:center;margin:0;padding:0;border:0;background:transparent;cursor:pointer;transition:opacity .35s}
  .zp-bc-js .zp-bc-load{display:flex}
  .zp-play{position:relative;display:grid;place-items:center;width:4.25rem;height:4.25rem;border-radius:50%;background:rgba(196,30,30,.94);color:#f0ebe3;box-shadow:0 0 0 1px rgba(255,255,255,.14),0 12px 32px rgba(0,0,0,.6);transition:transform .35s cubic-bezier(.2,.7,.2,1),background .3s}
  .zp-play svg{display:block;width:1.55rem;height:1.55rem;margin-left:.18rem;fill:currentColor}
  .zp-play::before{content:"";position:absolute;inset:-.55rem;border-radius:50%;border:1px solid rgba(255,42,42,.5);opacity:0;animation:zp-ring 2.8s ease-out infinite}
  @keyframes zp-ring{0%{opacity:.7;transform:scale(.85)}70%,100%{opacity:0;transform:scale(1.35)}}
  .zp-bc-load:hover .zp-play,.zp-bc-load:focus-visible .zp-play{transform:scale(1.1);background:#e02a2a}
  .zp-bc-load:focus-visible{outline:2px solid #ff2a2a;outline-offset:-5px}
  .zp-open .zp-bc-load{opacity:0;pointer-events:none}
  .zp-slot{display:grid;grid-template-rows:0fr;background:#121212;transition:grid-template-rows .5s cubic-bezier(.2,.7,.2,1)}
  .zp-open .zp-slot{grid-template-rows:1fr}
  .zp-slot-inner{min-height:0;overflow:hidden;background:linear-gradient(100deg,#121212 30%,#1b1b1b 50%,#121212 70%) 0 0/200% 100%;animation:zp-shimmer 1.6s linear infinite}
  .zp-slot iframe{display:block;width:100%;height:120px;border:0;opacity:0;transition:opacity .45s .1s}
  .zp-slot iframe.zp-ready{opacity:1}
  @keyframes zp-shimmer{to{background-position:-200% 0}}
  .zp-comp-body{display:flex;flex:1;flex-direction:column;gap:.55rem;padding:1.15rem 1.35rem 1.35rem}
  .zp-comp-meta{margin:0;font-size:.875rem;letter-spacing:.16em;text-transform:uppercase;color:#e65650}
  .zp-comp-card h3{margin:0;font-family:var(--font-display,'Cormorant Garamond',serif);font-weight:400;font-size:1.65rem;line-height:1.15;color:#f0ebe3;overflow-wrap:anywhere}
  .zp-comp-title-link{color:inherit;text-decoration:none;transition:color .2s}
  .zp-comp-title-link:hover,.zp-comp-title-link:focus-visible{color:#e65650;text-decoration:underline;text-underline-offset:3px}
  .zp-comp-note{margin:0;font-size:1rem;line-height:1.65;color:#c2bdb6}
  .zp-bc-nojs{margin:0;font-size:1rem;line-height:1.65;color:#c2bdb6}
  .zp-bc-js .zp-bc-nojs{display:none}
  .zp-comp-links{display:flex;flex-wrap:wrap;gap:.5rem;margin:auto 0 0;padding-top:.5rem}
  .zp-comp-links a{padding:.45rem .8rem;border:1px solid #2e2e2e;color:#f0ebe3;font-size:.8125rem;letter-spacing:.12em;text-transform:uppercase;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#e65650;transition:border-color .25s,color .25s,background .25s}
  .zp-comp-links a::after{content:" \\2197";color:#e65650}
  .zp-comp-links a[href^="#"]::after{content:" #";color:#e65650}
  .zp-comp-links a:hover,.zp-comp-links a:focus-visible{border-color:#e65650;background:rgba(230,86,80,.1);color:#f0ebe3}
  @media (prefers-reduced-motion:reduce){
    .zp-comp-card,.zp-stage img,.zp-play,.zp-slot,.zp-slot iframe{transition:none}
    .zp-comp-card:hover{transform:none}.zp-comp-card:hover .zp-stage img{transform:none}
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
