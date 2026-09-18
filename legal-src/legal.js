/* Zazie Productions — legal, rights and operating documents.
   Progressive enhancement only. Without this file every clause is visible,
   every FAQ answer is open, the section index is a plain list of links, and
   the device inspector simply stays closed. No third-party request is made
   from this file and nothing is written to storage except where the visitor
   presses a button that says so. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("has-js");

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* --- Masthead state + reading progress --------------------------------- */
  var masthead = $(".masthead");
  var bar = $(".progress");
  var ticking = false;

  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset || 0;
      if (masthead) masthead.classList.toggle("is-stuck", y > 24);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var pct = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;
        bar.style.width = pct.toFixed(2) + "%";
      }
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --- Scroll reveal ----------------------------------------------------- */
  var revealables = $$(".reveal");
  if (revealables.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  /* --- Section index: mark the clause you are reading --------------------- */
  var indexLinks = $$('.doc-index a[href^="#"]');
  if (indexLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    indexLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (target) byId[id] = a;
    });
    var seen = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { seen[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0; });
      var best = null;
      var bestRatio = 0;
      Object.keys(seen).forEach(function (id) {
        if (seen[id] > bestRatio) { bestRatio = seen[id]; best = id; }
      });
      indexLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
      if (best && byId[best]) byId[best].setAttribute("aria-current", "true");
    }, { rootMargin: "-6rem 0px -60% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* --- FAQ: accordion, deep links, counters ------------------------------- */
  var items = $$(".faq-item");
  if (items.length) {
    var targetId = (window.location.hash || "").replace("#", "");
    var openCount = 0;

    items.forEach(function (d) {
      /* Markup ships with every answer open so the page is complete with
         JavaScript off. Collapse on load, keeping a deep-linked answer open. */
      if (d.id === targetId) {
        d.open = true;
      } else {
        d.open = false;
      }
      if (d.open) openCount++;
      d.addEventListener("toggle", function () {
        if (d.open) {
          openCount = Math.min(items.length, openCount + 1);
        } else {
          openCount = Math.max(0, openCount - 1);
        }
        paint();
      });
    });

    var counter = $("[data-faq-count]");
    var toggleAll = $("[data-faq-all]");

    var paint = function () {
      if (counter) counter.innerHTML = "<b>" + openCount + "</b> of " + items.length + " open";
      if (toggleAll) {
        toggleAll.textContent = openCount === items.length ? "Collapse all" : "Expand all";
        toggleAll.setAttribute("aria-expanded", openCount === items.length ? "true" : "false");
      }
    };
    paint();

    if (toggleAll) {
      toggleAll.addEventListener("click", function () {
        var expand = openCount !== items.length;
        items.forEach(function (d) { d.open = expand; });
        openCount = expand ? items.length : 0;
        paint();
      });
    }

    /* Open a question linked from elsewhere, then put focus on it. */
    var openHash = function () {
      var id = (window.location.hash || "").replace("#", "");
      if (!id) return;
      var el = document.getElementById(id);
      if (!el || !el.classList.contains("faq-item")) return;
      el.open = true;
      openCount = Math.min(items.length, openCount + 1);
      paint();
      var summary = $("summary", el);
      if (summary) {
        summary.setAttribute("tabindex", "-1");
        window.setTimeout(function () { summary.focus({ preventScroll: false }); }, 60);
      }
    };
    window.addEventListener("hashchange", openHash);
    if (targetId) openHash();
  }

  /* --- Copy plates -------------------------------------------------------- */
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var source = document.getElementById(btn.getAttribute("data-copy"));
      if (!source) return;
      var text = source.textContent || "";
      var done = function () {
        var label = btn.getAttribute("data-label") || btn.textContent;
        btn.setAttribute("data-done", "1");
        btn.textContent = "Copied";
        window.setTimeout(function () {
          btn.removeAttribute("data-done");
          btn.textContent = label;
        }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
      } else {
        fallback(text, done);
      }
    });
  });

  function fallback(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    } catch (err) {
      btnFailed();
    }
  }

  function btnFailed() {
    $$("[data-copy]").forEach(function (b) {
      b.textContent = "Select the text instead";
    });
  }

  /* --- Device inspector ---------------------------------------------------
     Reads only what the visitor's own browser already holds for this origin
     and prints it. No network, no storage writes, no third party.            */
  var panel = $("[data-device]") || ($("[data-device-out]") ? $("[data-device-out]").closest(".device") : null);
  if (panel) {
    var run = $("[data-device-run]");
    var clear = $("[data-device-clear]");
    var out = $("[data-device-out]");
    var empty = $("[data-device-empty]");
    var status = $("[data-device-status]");

    var row = function (label, value, cls) {
      return '<li><span class="k">' + label + '</span><span class="v ' + (cls || "") + '">' + value + "</span></li>";
    };
    var esc = function (s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    };

    var inspect = function () {
      var rows = [];
      var findings = 0;

      /* Cookies */
      var cookie = "";
      try { cookie = document.cookie || ""; } catch (e) { cookie = ""; }
      var cookieNames = cookie.split(";").map(function (c) { return c.split("=")[0].trim(); }).filter(Boolean);
      if (cookieNames.length) findings += cookieNames.length;
      rows.push(row("document.cookie", cookieNames.length ? esc(cookieNames.join(", ")) + " (" + cookieNames.length + ")" : "empty", cookieNames.length ? "hit" : "ok"));

      /* localStorage */
      var ls = [];
      try { ls = Object.keys(window.localStorage || {}); } catch (e) { ls = ["blocked"]; }
      if (ls.length && ls[0] !== "blocked") findings += ls.length;
      rows.push(row("localStorage", ls.length ? esc(ls.join(", ")) + " (" + ls.length + ")" : "empty", ls.length && ls[0] !== "blocked" ? "hit" : "ok"));

      /* sessionStorage */
      var ss = [];
      try { ss = Object.keys(window.sessionStorage || {}); } catch (e) { ss = ["blocked"]; }
      if (ss.length && ss[0] !== "blocked") findings += ss.length;
      rows.push(row("sessionStorage", ss.length ? esc(ss.join(", ")) + " (" + ss.length + ")" : "empty", ss.length && ss[0] !== "blocked" ? "hit" : "ok"));

      /* IndexedDB */
      var idb = "not used by this site";
      if (window.indexedDB && window.indexedDB.databases) {
        idb = "check below";
        window.indexedDB.databases().then(function (list) {
          var el = document.querySelector('[data-key="idb"]');
          if (el) el.textContent = list && list.length ? list.map(function (d) { return d.name; }).join(", ") : "none";
        }).catch(function () {});
      }
      rows.push('<li><span class="k">IndexedDB</span><span class="v ok" data-key="idb">' + idb + "</span></li>");

      /* Service worker + caches */
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          var el = document.querySelector('[data-key="sw"]');
          if (el) el.textContent = regs.length ? regs.length + " registered (offline cache)" : "none";
        }).catch(function () {});
        rows.push('<li><span class="k">Service worker</span><span class="v ok" data-key="sw">checking</span></li>');
      } else {
        rows.push(row("Service worker", "unsupported", "ok"));
      }

      if ("caches" in window) {
        window.caches.keys().then(function (keys) {
          var el = document.querySelector('[data-key="cache"]');
          if (!el) return;
          if (!keys.length) { el.textContent = "none"; return; }
          findings += keys.length;
          el.textContent = keys.join(", ");
          el.className = "v hit";
          Promise.all(keys.map(function (k) {
            return window.caches.open(k).then(function (c) { return c.keys().then(function (r) { return r.length; }); });
          })).then(function (counts) {
            var total = counts.reduce(function (a, b) { return a + b; }, 0);
            el.textContent = keys.join(", ") + " (" + total + " cached responses)";
          }).catch(function () {});
        }).catch(function () {});
        rows.push('<li><span class="k">CacheStorage</span><span class="v ok" data-key="cache">checking</span></li>');
      } else {
        rows.push(row("CacheStorage", "unsupported", "ok"));
      }

      /* Third-party scripts actually running on this page */
      var ext = $$("script[src]").filter(function (s) {
        try { return new URL(s.src, window.location.href).origin !== window.location.origin; } catch (e) { return false; }
      });
      rows.push(row("Third-party scripts on this page", ext.length ? ext.length + " (see privacy notice)" : "none", ext.length ? "hit" : "ok"));

      if (out) out.innerHTML = rows.join("");
      if (empty) empty.hidden = true;
      panel.hidden = false;
      if (status) {
        status.textContent = findings
          ? "Found " + findings + " item(s) stored by this origin. Details below."
          : "Nothing stored by this origin except what your browser reports above.";
      }
    };

    if (run) run.addEventListener("click", inspect);

    if (clear) {
      clear.addEventListener("click", function () {
        var tasks = [];
        try { window.localStorage.clear(); } catch (e) {}
        try { window.sessionStorage.clear(); } catch (e) {}
        if ("caches" in window) {
          tasks.push(window.caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return window.caches.delete(k); }));
          }));
        }
        Promise.all(tasks).then(function () {
          if (status) status.textContent = "Cleared. Cookies set by your host or CDN cannot be removed from here; see the privacy notice.";
          inspect();
        }).catch(function () {
          if (status) status.textContent = "Your browser blocked part of that. Clear site data from your browser settings instead.";
        });
      });
    }
  }

  /* --- Colophon ---------------------------------------------------------- */
  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
