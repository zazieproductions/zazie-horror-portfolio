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
 *   3. nothing else. The <head> this script runs under is the same head that
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
