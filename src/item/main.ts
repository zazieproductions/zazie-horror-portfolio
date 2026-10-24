/**
 * Progressive enhancement for the per-item archive pages.
 *
 * The pages are complete without this file: every paragraph, every link, every
 * image, every film poster and every native audio element is in the static
 * markup. What this adds is small and honest:
 *
 *   1. one shared player - starting a cue pauses any other cue on the page,
 *      which matters on production pages that offer several palette cues;
 *   2. play state on <html>, so the stylesheet can mark the cue being listened
 *      to without touching the document head;
 *   3. click-to-load film samples - the served page carries a still and a real
 *      link to the film's own host, never a provider iframe. A plain click
 *      (the intent to watch in place) swaps in the player, sized to the stage
 *      the stylesheet already reserves, and removes the poster once the player
 *      has actually loaded. A modified click, a middle click or a page with no
 *      JavaScript goes to the host instead, so nothing is lost either way;
 *   4. an HD still that falls back to the small one if the upload has no
 *      1280x720 thumbnail;
 *   5. nothing else. The <head> this script runs under is the same head that
 *      was prerendered, so the hydrated DOM never disagrees with the crawl.
 */

import './item.css';

const documentElement = document.documentElement;
documentElement.classList.add('has-item-js');

const players = Array.from(document.querySelectorAll<HTMLAudioElement>('audio.audio-player'));

if (players.length) {
  documentElement.classList.add('has-audio');

  for (const player of players) {
    player.addEventListener('play', () => {
      documentElement.classList.add('is-playing');
      player.closest('section')?.setAttribute('data-playing', 'true');
      for (const other of players) {
        if (other !== player && !other.paused) other.pause();
      }
    });

    player.addEventListener('pause', () => {
      player.closest('section')?.removeAttribute('data-playing');
      if (players.every((candidate) => candidate.paused)) {
        documentElement.classList.remove('is-playing');
      }
    });

    player.addEventListener('ended', () => {
      player.closest('section')?.removeAttribute('data-playing');
      if (players.every((candidate) => candidate.paused)) {
        documentElement.classList.remove('is-playing');
      }
    });
  }
}

/* ------------------------------------------------------- film samples ---- */

/**
 * The poster's HD still is a different file from the 4:3 `hqdefault` the
 * provider guarantees, so an old upload may not have it. Swap back once, and
 * only once - a missing fallback must not start an error loop.
 */
for (const still of Array.from(document.querySelectorAll<HTMLImageElement>('img.entry-embed-still[data-fallback]'))) {
  const fallback = still.dataset.fallback;
  if (!fallback) continue;
  const swap = () => {
    if (still.getAttribute('src') === fallback) return;
    still.setAttribute('src', fallback);
  };
  if (still.complete && still.naturalWidth === 0) swap();
  still.addEventListener('error', swap, { once: true });
}

/** Warm the origin a click is about to need - a preconnect, never a prefetch. */
const warmed = new Set<string>();

function warm(origin: string): void {
  if (!origin || warmed.has(origin)) return;
  warmed.add(origin);
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = '';
  document.head.appendChild(link);
}

/* The provider the player will be loaded from, per kind. Kept in step with
   EMBED_ORIGINS in src/data/embed.ts. */
const ORIGINS: Record<string, string> = {
  'youtube-nocookie.com': 'https://www.youtube-nocookie.com',
  'drive.google.com': 'https://drive.google.com',
};

function originFor(poster: HTMLAnchorElement): string {
  const src = poster.dataset.embed ?? '';
  try {
    const host = new URL(src, window.location.href).hostname;
    for (const [suffix, origin] of Object.entries(ORIGINS)) {
      if (host === suffix || host.endsWith(`.${suffix}`)) return origin;
    }
  } catch {
    /* A malformed data-embed is the build's problem, not the visitor's. */
  }
  return '';
}

function mountPlayer(stage: HTMLElement, poster: HTMLAnchorElement): void {
  if (stage.dataset.playing === 'true') return;
  const src = poster.dataset.embed;
  if (!src) return;

  stage.dataset.playing = 'true';
  // The still stays painted underneath until the player has loaded, so the
  // frame never flashes black; it is out of the tab order immediately.
  poster.setAttribute('aria-hidden', 'true');
  poster.tabIndex = -1;

  const frame = document.createElement('iframe');
  frame.className = 'entry-embed-frame';
  frame.src = src;
  frame.title = poster.dataset.title ?? 'Film sample (embedded player)';
  frame.setAttribute('allow', poster.dataset.allow ?? '');
  frame.setAttribute('allowfullscreen', '');
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  frame.addEventListener('load', () => {
    // Whoever was on the poster keeps their place: the player takes the focus
    // rather than the page falling back to <body> when the poster goes.
    const hadFocus = document.activeElement === poster || poster.contains(document.activeElement);
    poster.remove();
    if (hadFocus) frame.focus({ preventScroll: true });
  }, { once: true });

  stage.appendChild(frame);
}

const stages = Array.from(document.querySelectorAll<HTMLElement>('[data-video-embed]'));

for (const stage of stages) {
  const poster = stage.querySelector<HTMLAnchorElement>('[data-video-play]');
  if (!poster) continue;

  const intent = () => warm(originFor(poster));
  poster.addEventListener('pointerenter', intent, { once: true });
  poster.addEventListener('focus', intent, { once: true });
  poster.addEventListener('touchstart', intent, { once: true, passive: true });

  poster.addEventListener('click', (event) => {
    // Modified or non-primary clicks belong to the browser (new tab, download):
    // they keep the real link target, which is the film's own host.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (stage.dataset.playing === 'true') return;
    event.preventDefault();
    warm(originFor(poster));
    mountPlayer(stage, poster);
  });
}
