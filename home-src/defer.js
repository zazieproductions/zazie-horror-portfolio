/*
 * The homepage ships its complete below-fold copy inside noscript fallbacks so
 * crawlers and no-JS visitors still receive the archive. With JavaScript on,
 * keep that copy out of the live DOM until the visitor reaches it. React is
 * also requested on intent rather than competing with the hero on first load.
 */
(() => {
  const mainHolder = document.getElementById('zp-deferred-content');
  const footerHolder = document.getElementById('zp-deferred-footer');
  const sentinel = document.getElementById('zp-deferred-sentinel');
  if (!mainHolder || !footerHolder || !sentinel) return;

  const state = {
    materialized: false,
    appPromise: null,
    appReady: false,
    replaying: false,
  };

  function parseFallback(holder) {
    const template = document.createElement('template');
    if (holder.childElementCount) {
      while (holder.firstChild) template.content.appendChild(holder.firstChild);
    } else {
      template.innerHTML = holder.textContent || '';
    }
    return template.content;
  }

  function materialize() {
    if (state.materialized) return;
    const main = mainHolder.parentNode;
    const root = footerHolder.parentNode;
    if (main) main.insertBefore(parseFallback(mainHolder), mainHolder);
    if (root) root.insertBefore(parseFallback(footerHolder), footerHolder);
    mainHolder.remove();
    footerHolder.remove();
    sentinel.remove();
    state.materialized = true;
    window.dispatchEvent(new Event('zp:home-content-ready'));
  }

  function loadApp() {
    materialize();
    if (state.appPromise) return state.appPromise;

    state.appPromise = new Promise((resolve, reject) => {
      const deadline = Date.now() + 6000;
      const attempt = () => {
        const loader = window.__zpLoadReactHome;
        if (typeof loader === 'function') {
          Promise.resolve(loader()).then(resolve, reject);
          return;
        }
        if (Date.now() >= deadline) {
          reject(new Error('Homepage app loader did not become available'));
          return;
        }
        window.setTimeout(attempt, 25);
      };
      attempt();
    }).then((value) => {
      state.appReady = true;
      return value;
    });
    state.appPromise.catch(() => {});
    return state.appPromise;
  }

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    history.replaceState(null, '', `#${id}`);
  }

  function replay(find) {
    if (state.replaying) return;
    state.replaying = true;
    window.requestAnimationFrame(() => {
      const target = typeof find === 'function' ? find() : document.querySelector(find);
      if (target) target.click();
      state.replaying = false;
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const link = target.closest('a[href^="#"]');
    if (link) {
      const id = link.getAttribute('href').slice(1);
      if (id && id !== 'top' && !document.getElementById(id)) {
        event.preventDefault();
        materialize();
        window.requestAnimationFrame(() => scrollToId(id));
        loadApp().catch(() => {});
        return;
      }
    }

    const showreel = target.closest('button[data-zp-showreel]');
    if (showreel && !state.appReady) {
      event.preventDefault();
      loadApp().then(() => replay(() => [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Play the showreel')))).catch(() => {});
      return;
    }

    const poster = target.closest('[data-home-poster]');
    if (poster && !state.appReady) {
      const slug = poster.getAttribute('data-home-poster');
      loadApp().then(() => replay(() => [...document.querySelectorAll('[data-home-poster]')].find((button) => button.getAttribute('data-home-poster') === slug))).catch(() => {});
      return;
    }

    const menu = target.closest('button[aria-label="Open menu"]');
    if (menu && !state.appReady) {
      event.preventDefault();
      loadApp().then(() => replay('button[aria-label="Open menu"]')).catch(() => {});
    }
  }, true);

  const loadWhenNearContent = () => {
    materialize();
    loadApp().catch(() => {});
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        loadWhenNearContent();
      }
    });
    observer.observe(sentinel);
  } else {
    window.addEventListener('scroll', loadWhenNearContent, { once: true, passive: true });
  }

  // Keep the static page available briefly, then bring up the full app for a
  // visitor who stays on the hero without scrolling or clicking.
  window.addEventListener('load', () => {
    window.setTimeout(loadWhenNearContent, 10000);
  }, { once: true });
})();
