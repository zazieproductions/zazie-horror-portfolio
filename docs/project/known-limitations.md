# Known limitations

1. **Legacy homepage source is absent.** `index-<hash>.js/.css` is a built
   React bundle; the app source is not in this repo and must not be described
   as editable source. Homepage behaviour changes go through
   `home-src/build.mjs` patching (fragile; test-covered in `tools/home-mount.test.mjs`).
2. **Test/build ordering.** On a fresh clone, `npm test` fails for
   `tools/geo.test.mjs` and `tools/inquiry.test.mjs` until `tsc` has emitted
   `build/`. Run `npm run build` first; see [testing](../development/testing.md).
3. **Generated output is a release contract (repaired 2026-10-29).** The former
   mobile-stylesheet failure and `index-*`/`item-*`/`legal-*` hash churn were
   traced to head-writer ordering and stale committed artifacts, not an
   inherently nondeterministic build. `home-src/document.mjs` is the final
   homepage head writer; CI builds twice and rejects any generated diff or
   untracked output. Inspect unexpected churn before committing it.
4. **Audio library is the payload centre** (~30 MP3s in-repo). Growth is
   linear; external storage/LFS is a recorded future option, not current state.
5. **External embeds are fragile by nature** (YouTube/Drive/Bandcamp/marketplace
   CDNs) and governed by CSP allowlists + the `/privacy` inventory.
6. **Stale counts in older prose.** Pre-overhaul docs cited 19 hubs / 65 items /
   32 cues / 84 URLs; verified current counts are 17 / 63 / 30 / 80.
