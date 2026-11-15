/*
 * hit.js — the site's own page-view counter.
 *
 * One same-origin POST per page load to /api/hit (functions/api/hit.ts). It
 * sends two things and nothing else: the path of this page, and the host of the
 * page that linked here (reduced to a bare host right here, so the address of
 * the page you came from never leaves the browser). No cookie, no identifier,
 * no IP address asked for, nothing kept on the device.
 *
 * It does not run at all if the browser sends Do Not Track or Global Privacy
 * Control, and it fails silently: a visit that is not counted is not worth a
 * visitor's attention.
 *
 * Loaded with `defer` from every served page. scripts/build-hit-beacon.mjs
 * keeps that tag in place.
 */
(function () {
  try {
    var nav = window.navigator || {};
    var dnt = nav.doNotTrack || window.doNotTrack || nav.msDoNotTrack;
    if (dnt === '1' || dnt === 'yes' || nav.globalPrivacyControl === true) return;

    // A prerendered page has not been looked at yet.
    if (document.visibilityState === 'prerender') return;

    var path = window.location.pathname;
    if (!path || path.charAt(0) !== '/') return;

    var referrer = '';
    if (document.referrer) {
      try {
        referrer = new window.URL(document.referrer).host || '';
      } catch (error) {
        referrer = '';
      }
    }

    var body = JSON.stringify({ path: path, referrer: referrer });
    if (typeof window.fetch !== 'function') return;
    window
      .fetch('/api/hit', {
        method: 'POST',
        body: body,
        headers: { 'content-type': 'application/json' },
        credentials: 'omit',
        keepalive: true,
        mode: 'same-origin',
      })
      .catch(function () {});
  } catch (error) {
    /* A counter is never worth an error in the visitor's console. */
  }
})();
