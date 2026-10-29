# Rollback

1. **Fastest safe path:** revert the offending merge on `main`
   (`git revert -m 1 <merge-sha>`, PR it, merge) — `deploy.yml` redeploys the
   previous tree automatically. Never force-push `main`.
2. **Manual redeploy of a known-good tree:** Actions → *Deploy to Cloudflare
   Pages* → Run workflow from `main` at the good state, or check out the good
   commit locally and (maintainers, with credentials) run
   `npm run build:deploy` equivalent steps documented in `deploy.yml`.
3. **Cloudflare-side:** Pages dashboard → Deployments → roll back to the
   previous deployment if the repo path is unavailable. Note this bypasses
   the repo's stale-output guarantees — reconcile with a repo deploy after.
4. **After any rollback:** run the live route audit
   (`node tools/live-route-audit.mjs https://horror.zazieproductions.com`),
   confirm `sitemap.xml` URLs return 200/expected, and record the incident in
   a dated note (root record or `docs/project/maintenance.md` log).

> [!CAUTION]
> Rollback restores the *previous committed tree*, including its generated
> output and `sw.js` cache name. If the bad deploy bumped `CACHE_NAME`,
> the rollback's older name may still serve cached assets to some visitors
> until caches expire — verify with a hard reload / fresh profile.
