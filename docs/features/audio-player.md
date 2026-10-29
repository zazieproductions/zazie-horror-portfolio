# Feature: audio player & showreel

- 30 cues in `src/data/cues.ts`, one page each under `/reel/<slug>`, MP3s in
  `audio/track-NN.mp3`. Item pages use native optional playback.
- Homepage player behaviour (single shared audio element, sticky bar, mood
  browsing) lives in the legacy bundle — no editable source in this repo.
  Changes route through `home-src/build.mjs` patches and the tests in
  `tools/showreel.test.mjs` / `tools/selected-cues.test.mjs`.
- Downloads: `/reel` offers per-cue saves and an on-demand in-browser ZIP
  (`src/reel-download/`); MP3s are stored unmodified. Downloads grant no
  project-use or redistribution rights.
