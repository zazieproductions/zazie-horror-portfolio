// 1. Service Worker for instant sub-5ms repeat visits anytime anyone visits
//    updateViaCache:none - the sw.js update check must always see fresh bytes,
//    so no returning visitor (or the studio) is stuck on an old cached build.
if("serviceWorker" in navigator&&!/bot|crawl|spider|google|bing|yandex|slurp|duckduck|baidu|applebot|lighthouse|headless/i.test(navigator.userAgent)){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).catch(()=>{})},{once:true})}

// 2. Below-fold media is intentionally scheduled by native loading=lazy or
// by an explicit user action. Do not warm the whole portfolio from the home
// page: that starves the hero on mobile and defeats the browser's media queue.

// 3. Early cinema player (loads before React and delegates through later mounts)
//    Real embedded iframes only - playback never leaves the page.
//    - youtube-nocookie.com: privacy-enhanced host, same player, no extra
//      cookies until the visitor presses play.
//    - the active card spans the full grid row and breaks out to a
//      cinematic width (see the .zp-vcard rules above). Player size is what
//      YouTube's adaptive ladder reads, so this is what buys the sharp
//      rendition - no CSS upscaling is involved.
//    - allow/allowfullscreen both carry "fullscreen" so the in-player
//      fullscreen button is permitted by Permissions Policy.
//    - window.__zpPlayer hands the active id to the React bundle so the
//      mount does not tear the playing card down.
var ZP_ALLOW_YT = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
var ZP_ALLOW_DRIVE = "autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen";
var ZP_PARAMS = "rel=0&color=white&playsinline=1&iv_load_policy=3&fs=1";
function zpSrc(yt, drive, autoplay) {
  var a = autoplay ? "autoplay=1" : "";
  if (yt) {
    return "https://www.youtube-nocookie.com/embed/" + yt + "?" + (a ? a + "&" : "") + ZP_PARAMS;
  }
  // Keep Drive's standard preview UI; its controls are owned by the provider.
  return "https://drive.google.com/file/d/" + drive + "/preview" + (a ? "?" + a : "");
}
function zpCloseAll() {
  var live = document.querySelectorAll(".zp-vcard.is-playing");
  for (var i = 0; i < live.length; i++) {
    live[i].classList.remove("is-playing", "is-drive");
    var fsBtn = live[i].querySelector(".zp-drive-fs");
    if (fsBtn) fsBtn.remove();
    var card = live[i].querySelector("[data-video-card].is-live");
    if (card) {
      card.classList.remove("is-live");
      var frame = card.querySelector("iframe");
      if (frame) frame.remove();
      // it is a poster again, so it is a button again
      var t = card.getAttribute("data-title") || "Film sample";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "Play " + t + " film sample");
    }
  }
}
function zpBuildFrame(yt, drive, title) {
  var frame = document.createElement("iframe");
  frame.className = "zp-vembed absolute inset-0 h-full w-full border-0";
  frame.src = zpSrc(yt, drive, true);
  frame.title = title + ": film sample (embedded player)";
  frame.setAttribute("allow", yt ? ZP_ALLOW_YT : ZP_ALLOW_DRIVE);
  frame.setAttribute("allowfullscreen", "");
  frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  return frame;
}
function zpBuildDriveFullscreen(title) {
  // If element fullscreen is unavailable, keep the native video controls instead.
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) return null;
  var fsBtn = document.createElement("button");
  fsBtn.type = "button";
  fsBtn.className = "zp-drive-fs";
  fsBtn.setAttribute("aria-label", "Fullscreen " + title);
  fsBtn.title = "Fullscreen " + title;
  fsBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  fsBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    var article = e.currentTarget.closest(".zp-vcard");
    var target = article && article.querySelector(".zp-vframe");
    if (!target) return;
    try {
      var result = target.requestFullscreen ? target.requestFullscreen() : target.webkitRequestFullscreen();
      if (result && result.catch) result.catch(function() {});
    } catch (err) {}
  });
  return fsBtn;
}
function zpReveal(el) {
  try {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  } catch (err) {}
}
function zpActivate(card) {
  var yt = card.getAttribute("data-yt");
  var drive = card.getAttribute("data-drive");
  var title = card.getAttribute("data-title") || "Film sample";
  zpCloseAll();
  card.classList.add("is-live");
  // the card is a player now, not a play button: stop announcing it as one
  card.removeAttribute("role");
  card.setAttribute("tabindex", "-1");
  card.setAttribute("aria-label", title + ": film sample player");
  card.appendChild(zpBuildFrame(yt, drive, title));
  var article = card.closest(".zp-vcard");
  if (article) {
    article.classList.add("is-playing");
    if (drive) {
      article.classList.add("is-drive");
      var actions = article.querySelector(".zp-vactions");
      var fsBtn = zpBuildDriveFullscreen(title);
      if (actions && fsBtn) actions.insertBefore(fsBtn, actions.firstChild);
    }
    zpReveal(article);
  }
  document.body.classList.add("zp-player-open");
  window.__zpPlayer = { id: yt || drive };
}
document.addEventListener("click", (e) => {
  const card = e.target.closest ? e.target.closest("[data-video-card]") : null;
  if (!card || card.querySelector("iframe")) return; // clicks inside the player never reach us
  e.preventDefault();
  zpActivate(card);
});

document.addEventListener("pointerenter", (e) => {
  // A brief mouse hover is a useful intent signal, but do not warm YouTube
  // while a touch user scrolls past a card or while the pointer merely crosses it.
  if (e.pointerType && e.pointerType !== "mouse") return;
  const card = e.target.closest ? e.target.closest("[data-video-card]") : null;
  if (!card) return;
  const yt = card.getAttribute("data-yt");
  if (yt && !document.querySelector(`link[href*="${yt}"]`)) {
    window.setTimeout(() => {
      if (!card.matches(":hover") || document.querySelector(`link[href*="${yt}"]`)) return;
      const l = document.createElement("link");
      l.rel = "prefetch";
      l.href = zpSrc(yt, null, false);
      document.head.appendChild(l);
    }, 240);
  }
}, true);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = document.activeElement && document.activeElement.closest ? document.activeElement.closest("[data-video-card]") : null;
  if (card && !card.querySelector("iframe")) {
    e.preventDefault();
    zpActivate(card);
  }
});

// 4. React Bundle Mount
const boot = () => {
  const go = () => import("/index-4d715571.js");
  "requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 1200 }) : setTimeout(go, 250);
};
document.readyState === "complete" ? boot() : window.addEventListener("load", boot, { once: true });
