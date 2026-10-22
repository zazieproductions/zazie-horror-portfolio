/**
 * Progressive enhancement for the per-item archive pages.
 *
 * The pages are complete without this file: every paragraph, every link, every
 * image and every native audio element is in the static markup. What this adds
 * is small and honest:
 *
 *   1. one shared player - starting a cue pauses any other cue on the page,
 *      which matters on production pages that offer several palette cues;
 *   2. play state on <html>, so the stylesheet can mark the cue being listened
 *      to without touching the document head;
 *   3. click-to-load film samples - the embedded player iframe (and the
 *      provider's ~300KB player stack) is created only when a visitor presses
 *      play on the facade; without this file the <noscript> iframe in the
 *      static markup serves the same video;
 *   4. nothing else. The <head> this script runs under is the same head that
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

/* ------------------------------------------------------- film-sample facade */

const YT_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
const DRIVE_ALLOW = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen';
/** The same parameter set the homepage cinema player has always used. */
const YT_PARAMS = 'rel=0&color=white&playsinline=1&iv_load_policy=3&fs=1';

const facades = Array.from(document.querySelectorAll<HTMLButtonElement>('button.embed-facade'));

for (const facade of facades) {
  const embedSrc = facade.dataset.embedSrc ?? '';
  const kind = facade.dataset.embedKind ?? 'youtube';
  const title = facade.dataset.embedTitle ?? 'Embedded film sample';
  if (!embedSrc) continue;

  // Warm DNS/TLS the moment a visitor shows intent, not before: the head stays
  // free of third-party hints nobody asked for.
  const hint = (): void => {
    try {
      const origin = new URL(embedSrc).origin;
      if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        document.head.appendChild(link);
      }
    } catch { /* an unparsable src simply plays without the hint */ }
  };
  facade.addEventListener('pointerenter', hint, { once: true });
  facade.addEventListener('focusin', hint, { once: true });

  facade.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = kind === 'youtube'
      ? `${embedSrc}?autoplay=1&${YT_PARAMS}`
      : `${embedSrc}?autoplay=1`;
    iframe.title = `${title} (embedded player)`;
    iframe.allow = kind === 'youtube' ? YT_ALLOW : DRIVE_ALLOW;
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    facade.replaceWith(iframe);
  });
}
