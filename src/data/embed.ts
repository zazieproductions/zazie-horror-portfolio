/**
 * Film-sample delivery: one place for the player URL, the HD parameters and the
 * poster that stands in for the player until someone asks for the film.
 *
 * Two things decide how sharp an embedded YouTube film looks, and the site has
 * to get both right:
 *
 *   1. The size of the player. YouTube picks the rendition from the player's own
 *      pixel width (roughly: below ~726px it will not go past 360-480p, from
 *      ~1089px it serves 720p, and a 1080p rendition needs a player wider than
 *      ~1633px), regardless of what the URL asks for. This is why the film
 *      stages are as wide as the layout allows and why nothing is ever CSS
 *      scaled up: item pages widen their single-column stage for entries with a
 *      film (`doc-layout--film` in src/item/item.css) and the homepage breaks
 *      its active card out to a cinematic width.
 *   2. `vq=hd1080`. YouTube has never documented it and has removed it more
 *      than once, but it is still honoured by the current embed when the ladder
 *      has a rendition to give; where it is ignored the size rule above still
 *      applies, so it is a hint, never a requirement.
 *
 * `hd=1` is deliberately absent: it was deprecated with the Flash player and is
 * ignored by the HTML5 embed. The obsolete Flash player is not missed.
 *
 * The homepage keeps its own copy of these strings inside the early inline
 * player in index.html (it has to run before the bundle parses), and
 * tools/film-player.test.mjs fails the build if the two copies drift apart.
 */

import type { Image, VideoSample } from './types.js';

/** Player parameters appended to every youtube-nocookie.com embed URL. */
export const YOUTUBE_EMBED_PARAMS = 'vq=hd1080&rel=0&color=white&playsinline=1&iv_load_policy=3&fs=1';

/** Permissions the YouTube player needs (fullscreen and PiP included). */
export const YOUTUBE_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';

/** Permissions the Drive preview needs. */
export const DRIVE_ALLOW = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen';

export type EmbedKind = VideoSample['kind'];

/** Origin to warm when a visitor shows intent to play a film. */
export const EMBED_ORIGINS: Record<EmbedKind, string> = {
  youtube: 'https://www.youtube-nocookie.com',
  drive: 'https://drive.google.com',
};

function base(embedUrl: string): string {
  return embedUrl.split('?')[0];
}

/**
 * The iframe src. `autoplay` is only ever passed from a click handler: the src
 * is set inside the gesture, so the browser treats playback as user-initiated
 * and does not have to be muted to start.
 */
export function playerSrc(kind: EmbedKind, embedUrl: string, autoplay: boolean): string {
  if (kind === 'youtube') return `${base(embedUrl)}?${autoplay ? 'autoplay=1&' : ''}${YOUTUBE_EMBED_PARAMS}`;
  return autoplay ? `${base(embedUrl)}?autoplay=1` : base(embedUrl);
}

export function playerAllow(kind: EmbedKind): string {
  return kind === 'youtube' ? YOUTUBE_ALLOW : DRIVE_ALLOW;
}

/** Iframe title, shared by the static markup and the click handler. */
export function playerTitle(sample: Pick<VideoSample, 'title'>): string {
  return `${sample.title}: film sample (embedded player)`;
}

/**
 * Where the poster links when JavaScript is unavailable, or when the visitor
 * opens the film in a new tab/window instead of the in-page player.
 */
export function watchUrlFor(sample: Pick<VideoSample, 'kind' | 'embedUrl' | 'watchUrl'>): string {
  if (sample.watchUrl) return sample.watchUrl;
  return base(sample.embedUrl).replace(/\/preview$/, '/view');
}

export interface EmbedPoster extends Image {
  /** Served when the HD variant is missing (an old or deleted upload). */
  fallbackSrc?: string;
}

/**
 * The still that stands in for the player. YouTube's `hqdefault` thumbnail is
 * 480x360 with the film letterboxed into 4:3, so it is only ever the fallback:
 * the same video's `maxresdefault` variant is a true 16:9 1280x720 frame, and
 * it costs one lazy image request instead of the player's megabyte. Drive and
 * self-hosted stills are used exactly as recorded.
 */
export function posterFor(sample: Pick<VideoSample, 'thumbnail'>): EmbedPoster {
  const image = sample.thumbnail;
  const yt = /^https:\/\/i\.ytimg\.com\/vi\/([\w-]{6,})\/[\w.]+$/.exec(image.src);
  if (!yt) return { ...image };
  return {
    src: `https://i.ytimg.com/vi/${yt[1]}/maxresdefault.jpg`,
    fallbackSrc: image.src,
    alt: image.alt,
    width: 1280,
    height: 720,
  };
}
