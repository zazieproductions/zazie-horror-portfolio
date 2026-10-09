/** Types for the plain-JS player in ./player.js (see that file for the contract). */

export interface FilmMountOptions {
  /** Root-absolute HLS playlist (.m3u8) or MP4 on this domain. */
  src: string;
  poster?: string;
  title?: string;
  /** Google Drive file id used for the standard preview embed if the self hosted stream cannot play. */
  drive?: string;
  /** Called once the fallback frame (or nothing, when no drive id exists) has replaced the video. */
  onFallback?: (frame: HTMLIFrameElement | null, container: HTMLElement | null) => void;
}

export interface ZpFilm {
  mount(container: HTMLElement, opts: FilmMountOptions): HTMLVideoElement;
  unmount(container: HTMLElement | null): void;
  driveFrame(id: string, title?: string): HTMLIFrameElement;
  readonly HLS_LIB: string;
}

declare global {
  interface Window {
    zpFilm: ZpFilm;
    __zpPlayer?: { id?: string | null; src?: string; el?: HTMLVideoElement | null };
  }
}

export {};
