# Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm test`: `ERR_MODULE_NOT_FOUND build/data/*.js` | Fresh clone; `tsc` hasn't run | `npm run build` (or `npx tsc`), then re-test |
| `prerender: item-manifest.json is missing` | Ran prerender before Vite | Run full `npm run build` |
| Build passes locally but `deploy.yml` says "Generated site output is stale" | Committed output ≠ runner's build | Run `npm run build`, commit regenerated files; see [verification](../deployment/verification.md) |
| Bundle hashes changed after a docs-only change | Environment-dependent rehashing (see [known limitations](../project/known-limitations.md)) | Revert generated churn (`git checkout -- '*.html' '*.js' '*.css'`) if your change didn't intend it |
| New page 404s locally but file exists | Wrong shape: items are flat `work/<slug>.html`, hubs are `<hub>/index.html` + root twin | See [routing](../architecture/routing.md) |
| Returning visitors see old page | `sw.js` cache not bumped | Bump `CACHE_NAME` in `sw.js` with any precache change |
| CSP blocks a new embed/script | Host not allowlisted | Add host to `tools/headers.mjs`, rebuild (regenerates `_headers` check), disclose in `/privacy` if it's a third party |
| GitHub green but production unchanged | Four different "successes" | Decision tree in [verification](../deployment/verification.md) |
