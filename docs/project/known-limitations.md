# Known limitations

1. **Legacy homepage source is absent.** `index-<hash>.js/.css` is a built
   React bundle; the app source is not in this repo and must not be described
   as editable source. Homepage behaviour changes go through
   `home-src/build.mjs` patching (fragile; test-covered in `tools/home-mount.test.mjs`).
2. **Test/build ordering.** On a fresh clone, `npm test` fails for
   `tools/geo.test.mjs` and `tools/inquiry.test.mjs` until `tsc` has emitted
   `build/`. Pre-existing; workaround documented in
   [testing](../development/testing.md).
3. **Non-reproducible bundle hashes (observed 2026-10-29).** `npm run build`
   passes but rehashes `index-*`/`item-*`/`legal-*`/`inquiry-*` versus the
   committed files on this checkout, and `tools/mobile-ux.test.mjs` fails
   after that rebuild. Treat unexpected hash churn as a signal to inspect,
   not to commit blindly; CI's stale-output gate is the arbiter on its runner.
4. **Audio library is the payload centre** (~30 MP3s in-repo). Growth is
   linear; external storage/LFS is a recorded future option, not current state.
5. **External embeds are fragile by nature** (YouTube/Drive/Bandcamp/marketplace
   CDNs) and governed by CSP allowlists + the `/privacy` inventory.
6. **Committed tree is not fully self-consistent without a build.**
   `index.html` (and one hub page) reference `/inquiry-d8cba1f7.css`, absent
   from the committed tree; `npm run check:links` therefore fails standalone
   at HEAD and passes after `npm run build` regenerates it.
7. **Stale counts in older prose.** Pre-overhaul docs cited 19 hubs / 65 items /
   32 cues / 84 URLs; verified current counts are 17 / 63 / 30 / 80.
