## Summary
<!-- What changed and why. Link the record/doc that motivated it. -->

## Source vs generated
- [ ] I edited source, ran `npm run build`, and committed regenerated output together
- [ ] This change touches no generated output
- [ ] `sw.js` CACHE_NAME bumped (required if precached assets changed)

## Validation (report honestly — "not run" is an acceptable answer)
| Check | Result |
|---|---|
| `npm run build` | |
| `npm run typecheck` | |
| `npm test` | |
| `npm run check:links` / `check:forms` / `check:headers` | |
| `npm run check:docs` (doc changes) | |
| `npm run lint:slop` | |

## Documentation
- [ ] README / `docs/` / dated record updated, or not needed because: …
- [ ] Counts (hubs/items/URLs) re-derived from `src/data/` if content changed

## Risks
<!-- Deployment, caching, CSP, routing or media risks. "None known" if so. -->
