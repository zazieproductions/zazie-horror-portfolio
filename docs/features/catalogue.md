# Feature: catalogue (`/store`)

- Hub source: `store-src/` (`store.html/.css/.js` + `build.sh`) → generated
  `store/index.html` + `store.html` twin + hashed `store-*` assets.
- 24 items in `src/data/releases.ts` → flat `store/<slug>.html` pages.
- Checkout is delegated to Bandcamp / itch.io / Gumroad / eBay; pages omit
  mutable price/stock schema and keep the marketplace authoritative.
- Full history and the redirect-loop lesson: root `STORE.md`.
