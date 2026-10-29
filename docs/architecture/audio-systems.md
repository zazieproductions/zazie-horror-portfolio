# Audio systems

| System | Source | Runtime behaviour |
|---|---|---|
| Showreel cues | `src/data/cues.ts` (30 cues) → `/reel/<slug>` pages | Native optional MP3 playback; copy readable without audio |
| Audio files | `audio/track-NN.mp3` (30 files; numbering has gaps — no 09/23) | Streamed, `preload="metadata"`; edge-cached |
| Homepage showreel player | Legacy bundle (`index-<hash>.js`) + committed `index.html` | Single shared audio element in the original React app; **source not in repo** — behaviour changes go through `home-src/build.mjs` patching, carefully |
| Reel downloads | `src/reel-download/`, `scripts/build-reel-download.mjs` | Per-cue download without JS; optional in-browser ZIP (fflate) built on demand |
| Selected cues | `selected-cues.js` (root, committed) | Loaded by the homepage; keep in step with cue data |
| Store previews / room tone | `store-src/store.js` | Per-card previews, looping ambience ducked under previews; `preload="none"` |
| Compilation players | `src/data/compilations.ts` + `src/lib/compilations-markup.ts`; mirrored hand-written list on `/reel` | Click-to-load Bandcamp iframes (no Bandcamp request on page load) — **keep both lists in step** |

> [!WARNING]
> Do not transcode, rename or renumber `audio/track-*.mp3` without updating
> `src/data/cues.ts` (`audioPath`), the reel-download track list and the build.
> Positional filenames are referenced by data, not discovered at runtime.

Film samples are **not** self-hosted: lazy `youtube-nocookie.com` iframes plus
one Google Drive preview, with `<picture>` poster covers (`images/project-*.jpg`).
