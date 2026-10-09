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
 *   3. the self hosted film sample player: a production page whose sample is
 *      streamed from this domain prerenders a poster button, and a tap turns
 *      it into a native <video> through the shared player (src/film/player.js,
 *      the same code the home page runs). If the stream cannot play, the
 *      player puts the provider preview in its place;
 *   4. nothing else. The <head> this script runs under is the same head that
 *      was prerendered, so the hydrated DOM never disagrees with the crawl.
 */

import './item.css';
import '../film/player.js';

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

/* --- Self hosted film sample ------------------------------------------- */

for (const embed of Array.from(document.querySelectorAll<HTMLElement>('.entry-embed[data-film]'))) {
  const button = embed.querySelector<HTMLButtonElement>('.entry-play');
  const src = embed.dataset.film;
  if (!button || !src) continue;
  button.addEventListener('click', () => {
    if (embed.classList.contains('is-live')) return;
    embed.classList.add('is-live');
    for (const player of players) if (!player.paused) player.pause();
    window.__zpPlayer = { id: src };
    window.zpFilm.mount(embed, {
      src,
      poster: embed.dataset.poster,
      title: embed.dataset.title,
      drive: embed.dataset.drive,
      onFallback: () => embed.classList.add('is-drive'),
    });
  });
}
