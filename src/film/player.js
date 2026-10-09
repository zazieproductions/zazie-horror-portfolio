/* zp-film: the self hosted film sample player.
 *
 * One source of truth for every surface that plays a sample from this domain:
 *   - the home page's instant inline player (this file is inlined verbatim
 *     into index.html between the zp-film markers; tools/film-player.test.mjs
 *     fails if the two copies drift),
 *   - the React bundle on the home page, which calls window.zpFilm after it
 *     mounts (the inline copy always runs first, so the global is there),
 *   - the per-item archive pages, which bundle this file through
 *     src/item/main.ts.
 *
 * The picture is a plain <video> with the browser's own controls: nothing sits
 * on top of it, nothing is rotated, scaled or cropped, and fullscreen is the
 * native control. Sources are either an HLS playlist (.m3u8: Safari and iOS
 * play it natively, every other browser gets the vendored hls.js, loaded on
 * demand) or a single MP4. Playlists and segments live under /media on this
 * domain, so no third party is contacted and nothing is published elsewhere.
 *
 * If the self hosted stream cannot be played (not uploaded yet, blocked, or an
 * unsupported browser), the mount falls back to the provider embed the card
 * names in data-drive, exactly as before this player existed.
 */
(function (root) {
  'use strict';
  var HLS_LIB = '/hls-d5c095ec.js';
  var HLS_MIME = 'application/vnd.apple.mpegurl';
  var DRIVE_ALLOW = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen';
  var libPromise = null;

  function loadHlsLib() {
    if (root.Hls) return Promise.resolve(root.Hls);
    if (!libPromise) {
      libPromise = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = HLS_LIB;
        script.async = true;
        script.onload = function () {
          if (root.Hls) resolve(root.Hls);
          else reject(new Error('hls.js did not register'));
        };
        script.onerror = function () {
          libPromise = null;
          reject(new Error('hls.js failed to load'));
        };
        document.head.appendChild(script);
      });
    }
    return libPromise;
  }

  function isPlaylist(src) {
    return /\.m3u8(?:[?#]|$)/i.test(src);
  }
  function hasNativeHls(video) {
    var answer = video.canPlayType ? video.canPlayType(HLS_MIME) : '';
    return answer === 'probably' || answer === 'maybe';
  }
  function hasMediaSource() {
    return !!(root.MediaSource || root.ManagedMediaSource);
  }
  function play(video) {
    try {
      var result = video.play();
      if (result && result.catch) result.catch(function () {});
    } catch (err) {}
  }

  /* The provider fallback: the standard Drive preview, unchanged. */
  function driveFrame(id, title) {
    var frame = document.createElement('iframe');
    frame.className = 'zp-vembed absolute inset-0 h-full w-full border-0';
    frame.src = 'https://drive.google.com/file/d/' + id + '/preview?autoplay=1';
    frame.title = (title || 'Film sample') + ': film sample (embedded player)';
    frame.setAttribute('allow', DRIVE_ALLOW);
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    return frame;
  }

  function createVideo(opts) {
    var video = document.createElement('video');
    video.className = 'zp-film';
    video.setAttribute('controls', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.setAttribute('controlslist', 'nodownload');
    video.setAttribute('data-film', opts.src);
    if (opts.poster) video.setAttribute('poster', opts.poster);
    video.setAttribute('aria-label', (opts.title || 'Film sample') + ': film sample player');
    return video;
  }

  function destroy(video) {
    if (!video || video.__zpDestroyed) return;
    video.__zpDestroyed = true;
    if (video.__zpHls) {
      try { video.__zpHls.destroy(); } catch (err) {}
      video.__zpHls = null;
    }
    try { video.pause(); } catch (err) {}
    try { video.removeAttribute('src'); video.load(); } catch (err) {}
    var shared = root.__zpPlayer;
    if (shared && shared.el === video) shared.el = null;
  }

  function attach(video, src, fail) {
    if (!isPlaylist(src) || hasNativeHls(video)) {
      video.src = src;
      play(video);
      return;
    }
    if (!hasMediaSource()) { fail(); return; }
    loadHlsLib().then(function (Hls) {
      if (video.__zpDestroyed) return;
      if (!Hls.isSupported()) { fail(); return; }
      var hls = new Hls({ enableWorker: false, capLevelToPlayerSize: true, backBufferLength: 30 });
      var recovered = false;
      video.__zpHls = hls;
      hls.on(Hls.Events.ERROR, function (_, data) {
        if (!data || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) {
          recovered = true;
          try { hls.recoverMediaError(); return; } catch (err) {}
        }
        fail();
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      play(video);
    }, fail);
  }

  /**
   * Put the player for `opts.src` inside `container` and start it.
   * opts: { src, poster, title, drive (fallback preview id), onFallback(frame) }
   * Returns the <video>. A player that an earlier copy of the page started for
   * the same source (window.__zpPlayer.el) is moved in and resumed rather than
   * rebuilt, so the React mount never restarts the film.
   */
  function mount(container, opts) {
    var shared = root.__zpPlayer || (root.__zpPlayer = {});
    var previous = shared.el && !shared.el.__zpDestroyed ? shared.el : null;
    if (previous && shared.src === opts.src && previous.parentNode !== container) {
      container.appendChild(previous);
      previous.__zpOpts = opts;
      play(previous);
      return previous;
    }
    if (previous) {
      // A player nobody unmounted (a DOM replaced underneath it) must not keep
      // streaming in the background.
      destroy(previous);
      if (previous.parentNode) previous.parentNode.removeChild(previous);
    }
    var video = createVideo(opts);
    var failed = false;
    function fail() {
      if (failed || video.__zpDestroyed) return;
      failed = true;
      var parent = video.parentNode;
      var current = video.__zpOpts || opts;
      destroy(video);
      if (parent) parent.removeChild(video);
      var frame = current.drive ? driveFrame(current.drive, current.title) : null;
      if (frame && parent) parent.appendChild(frame);
      if (current.onFallback) current.onFallback(frame, parent);
    }
    video.__zpOpts = opts;
    video.addEventListener('error', function () {
      // Native loads report a missing or unplayable source here; hls.js reports
      // its own errors through its ERROR event instead.
      if (!video.__zpHls) fail();
    });
    container.appendChild(video);
    shared.el = video;
    shared.src = opts.src;
    play(video); // inside the visitor's gesture, before any network round trip
    attach(video, opts.src, fail);
    try { video.focus({ preventScroll: true }); } catch (err) {}
    return video;
  }

  /** Stop and remove whatever mount() put in `container` (video or fallback frame). */
  function unmount(container) {
    if (!container) return;
    var video = container.querySelector ? container.querySelector('video.zp-film') : null;
    if (video) {
      destroy(video);
      if (video.parentNode === container) container.removeChild(video);
    }
    var frame = container.querySelector ? container.querySelector('iframe') : null;
    if (frame && frame.parentNode === container) container.removeChild(frame);
  }

  root.zpFilm = { mount: mount, unmount: unmount, driveFrame: driveFrame, HLS_LIB: HLS_LIB };
})(typeof window !== 'undefined' ? window : globalThis);
