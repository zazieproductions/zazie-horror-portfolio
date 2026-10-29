/**
 * Compilation players in the press kit: markup, styles and the click-to-load
 * script.
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

/**
 * The players live inside the press kit (tier IV, "Official Profiles, Credits &
 * Streaming"), under the profile directory, so there is no homepage section and
 * no second heading: the covers are a continuation of that tier.
 *
 * `#compilations` stays on the wrapper so older links still land on the players.
 */
export function compilationsTierHtml(): string {
  return (
    `<div id="compilations" class="zp-comp-block" role="group" aria-label="Selected compilations and releases">` +
    `<ul class="zp-comp-grid">${compilations.map(card).join('')}</ul>` +
    `</div>`
  );
}

export const COMPILATIONS_CSS = `
  /* Compilation players: cover-forward cards inside the press kit's tier IV. */
  .zp-comp-block{margin-top:2rem;padding-top:2rem;border-top:1px solid rgba(240,235,227,.1)}
  .zp-comp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.9rem 1rem;max-width:40rem;margin:0 auto;padding:0;list-style:none}
  @media (min-width:900px){.zp-comp-grid{grid-template-columns:repeat(3,minmax(0,1fr));max-width:44rem}}
  .zp-comp-card{position:relative;min-width:0;overflow:hidden;border:1px solid rgba(240,235,227,.1);border-radius:2px;background:rgba(255,255,255,.018);scroll-margin-top:5.5rem;transition:border-color .22s ease,background-color .22s ease,box-shadow .22s ease}
  .zp-comp-article{display:flex;height:100%;flex-direction:column;min-width:0}
  .zp-comp-card:hover,.zp-comp-card:focus-within,.zp-comp-card.zp-open{border-color:rgba(230,86,80,.48);background:linear-gradient(135deg,rgba(139,0,0,.14) 0%,rgba(223,196,139,.06) 100%);box-shadow:0 14px 30px -22px rgba(196,30,30,.7)}
  .zp-bc{display:flex;flex-direction:column}
  .zp-stage{position:relative;aspect-ratio:1/1;overflow:hidden;background:#121212}
  .zp-open .zp-stage{aspect-ratio:2/1}
  .zp-stage img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
  .zp-comp-card:hover .zp-stage img{transform:scale(1.05)}
  .zp-stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(3,3,3,.1) 0,rgba(3,3,3,0) 45%,rgba(3,3,3,.55) 100%)}
  .zp-bc-load{position:absolute;inset:0;z-index:3;display:none;align-items:center;justify-content:center;margin:0;padding:0;border:0;background:transparent;cursor:pointer;transition:opacity .3s}
  .zp-bc-js .zp-bc-load{display:flex}
  .zp-play{position:relative;display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:50%;background:rgba(196,30,30,.94);color:#f0ebe3;box-shadow:0 0 0 1px rgba(255,255,255,.16),0 6px 16px rgba(0,0,0,.55);transition:transform .3s cubic-bezier(.2,.7,.2,1),background .3s}
  .zp-play svg{display:block;width:1rem;height:1rem;margin-left:.1rem;fill:currentColor}
  .zp-play::before{content:"";position:absolute;inset:-.4rem;border-radius:50%;border:1px solid rgba(255,42,42,.45);opacity:0;animation:zp-ring 3.2s ease-out infinite}
  @keyframes zp-ring{0%{opacity:.6;transform:scale(.85)}70%,100%{opacity:0;transform:scale(1.3)}}
  .zp-bc-load:hover .zp-play,.zp-bc-load:focus-visible .zp-play{transform:scale(1.08);background:#e02a2a}
  .zp-bc-load:focus-visible{outline:2px solid #ff2a2a;outline-offset:-4px}
  .zp-open .zp-bc-load{opacity:0;pointer-events:none}
  .zp-slot{display:grid;grid-template-rows:0fr;background:#121212;transition:grid-template-rows .45s cubic-bezier(.2,.7,.2,1)}
  .zp-open .zp-slot{grid-template-rows:1fr}
  .zp-slot-inner{min-height:0;overflow:hidden;background:linear-gradient(100deg,#121212 30%,#1b1b1b 50%,#121212 70%) 0 0/200% 100%;animation:zp-shimmer 1.6s linear infinite}
  .zp-slot iframe{display:block;width:100%;height:120px;border:0;opacity:0;transition:opacity .4s .1s}
  .zp-slot iframe.zp-ready{opacity:1}
  @keyframes zp-shimmer{to{background-position:-200% 0}}
  .zp-comp-body{display:flex;min-width:0;flex-direction:column;gap:.15rem;padding:.7rem .8rem .8rem}
  .zp-comp-card:has(.zp-bc-load:focus-visible){outline-offset:2px}
  .zp-comp-card h3{margin:0;font-family:var(--font-display,'Cormorant Garamond',serif);font-weight:500;font-size:1.05rem;line-height:1.2;color:#f0ebe3;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
  .zp-comp-track{margin:0;font-size:.78rem;line-height:1.35;color:#9e9890;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;line-clamp:1;overflow:hidden}
  .zp-comp-listen{color:inherit;text-decoration:underline;text-decoration-color:rgba(230,86,80,.6);text-underline-offset:2px;transition:color .2s,text-decoration-color .2s}
  .zp-comp-listen:hover,.zp-comp-listen:focus-visible{color:#e65650;text-decoration-color:currentColor}
  @media (max-width:899px){.zp-comp-card.zp-open{grid-column:1/-1}}
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
