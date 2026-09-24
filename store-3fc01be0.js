/* Zazie Productions catalogue behaviour.
   Progressive enhancement only. Without this file every release is visible,
   every card links straight to its listing, and the filter bar, previews,
   room tone, torch, cursor and tilt simply never appear. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("has-js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* --- Filtering --------------------------------------------------------- */
  var shelf = $("[data-shelf]");
  var groups = $$(".group", shelf || document);
  var empty = $("[data-empty]");
  var counter = $("[data-count]");
  var chips = $$(".chip[data-group]");
  var KEYS = ["records", "sfx", "plugins", "motion", "scores", "gear", "tools"];

  if (shelf && groups.length && chips.length) {
    var cards = $$("[data-collection]", shelf);
    var state = { collection: "all", delivery: "all" };

    var apply = function () {
      var shown = 0;
      cards.forEach(function (card) {
        var match =
          (state.collection === "all" || card.getAttribute("data-collection") === state.collection) &&
          (state.delivery === "all" || card.getAttribute("data-delivery") === state.delivery);
        card.hidden = !match;
        if (match) shown++;
      });
      groups.forEach(function (g) {
        var visible = $$("[data-collection]", g).filter(function (c) { return !c.hidden; }).length;
        g.hidden = visible === 0;
        var n = $("[data-group-count]", g);
        if (n) {
          if (!n.getAttribute("data-full")) n.setAttribute("data-full", n.textContent);
          var total = $$("[data-collection]", g).length;
          n.textContent = visible === total ? n.getAttribute("data-full") : visible + " of " + total;
        }
      });
      shelf.classList.toggle("is-filtered", shown === 0);
      if (counter) counter.innerHTML = "<b>" + shown + "</b> of " + cards.length + " releases";
      if (empty) empty.hidden = shown !== 0;
      chips.forEach(function (chip) {
        var on = state[chip.getAttribute("data-group")] === chip.getAttribute("data-value");
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        state[chip.getAttribute("data-group")] = chip.getAttribute("data-value");
        apply();
        if (window.history && history.replaceState) {
          history.replaceState(null, "", state.collection === "all" ? "#shelf" : "#" + state.collection);
        }
      });
    });

    var readHash = function () {
      var h = (location.hash || "").replace("#", "");
      if (KEYS.indexOf(h) > -1) { state.collection = h; apply(); }
      else if (h === "digital" || h === "physical") { state.delivery = h; apply(); }
      else if (h === "shelf" || h === "tools") { state.collection = "all"; state.delivery = "all"; apply(); }
    };
    window.addEventListener("hashchange", readHash);
    readHash();
    apply();
  }

  /* --- Cover art fallback -------------------------------------------------
     Sleeves are served by each marketplace CDN. If one is ever pulled the
     card shows its monogram plate instead of a broken image. */
  $$(".card-media img, .vitrine img, .vault-sleeves img").forEach(function (img) {
    var host = img.parentElement;
    var fail = function () { host.classList.add("is-missing"); };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener("error", fail, { once: true });
  });

  /* --- Scroll reveal ------------------------------------------------------ */
  var revealables = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealables.forEach(function (el, i) {
      if (!el.style.getPropertyValue("--i")) el.style.setProperty("--i", String(i % 6));
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  /* --- Masthead: tighten once the page has scrolled ---------------------- */
  var masthead = $(".masthead");
  if (masthead) {
    var onScroll = function () { masthead.classList.toggle("is-stuck", window.scrollY > 24); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* --- Card tilt and sheen (fine pointers only) --------------------------- */
  if (fine && !reduce) {
    $$(".card").forEach(function (card) {
      var raf = 0;
      card.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          card.classList.add("is-tilting");
          card.style.setProperty("--ry", ((px - 0.5) * 6).toFixed(2) + "deg");
          card.style.setProperty("--rx", ((0.5 - py) * 6).toFixed(2) + "deg");
          card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
          card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        });
      });
      card.addEventListener("pointerleave", function () {
        card.classList.remove("is-tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* --- Torch and cursor: one pointer listener feeds both ----------------- */
  if (fine && !reduce) {
    root.classList.add("cur");
    var cx = -100, cy = -100, rx = -100, ry = -100, moving = false, cursorRaf = 0;

    var frame = function () {
      rx += (cx - rx) * 0.18;
      ry += (cy - ry) * 0.18;
      root.style.setProperty("--crx", rx.toFixed(1) + "px");
      root.style.setProperty("--cry", ry.toFixed(1) + "px");
      if (Math.abs(cx - rx) > 0.3 || Math.abs(cy - ry) > 0.3) cursorRaf = requestAnimationFrame(frame);
      else cursorRaf = 0;
    };

    window.addEventListener("pointermove", function (e) {
      cx = e.clientX; cy = e.clientY;
      root.style.setProperty("--cx", cx + "px");
      root.style.setProperty("--cy", cy + "px");
      root.style.setProperty("--tx", cx + "px");
      root.style.setProperty("--ty", cy + "px");
      if (!moving) { moving = true; root.classList.add("torch-on"); }
      if (!cursorRaf) cursorRaf = requestAnimationFrame(frame);
    }, { passive: true });

    document.addEventListener("pointerleave", function () {
      moving = false;
      root.classList.remove("torch-on");
    });

    var hoverTargets = "a, button, [role=button], input, label";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(hoverTargets)) root.classList.add("cur-hover");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest(hoverTargets)) root.classList.remove("cur-hover");
    });
    document.addEventListener("pointerdown", function () { root.classList.add("cur-down"); });
    document.addEventListener("pointerup", function () { root.classList.remove("cur-down"); });
  }

  /* --- VHS tracking roll, now and then ----------------------------------- */
  var vhs = $(".vhs-tracking");
  if (vhs && !reduce) {
    var roll = function () {
      if (!document.hidden) {
        vhs.classList.add("active");
        setTimeout(function () { vhs.classList.remove("active"); }, 450);
      }
      setTimeout(roll, 11000 + Math.random() * 16000);
    };
    setTimeout(roll, 6000 + Math.random() * 6000);
  }

  /* --- Audio: in-card previews and room tone ----------------------------- */
  var previews = $$("[data-preview]");
  var ambBtn = $("[data-ambience]");
  var preview = null, ambience = null, current = null;

  var ambientLevel = function () {
    if (!ambience) return;
    var target = current ? 0.06 : 0.22;
    var step = function () {
      var d = target - ambience.volume;
      if (Math.abs(d) < 0.01) { ambience.volume = target; return; }
      ambience.volume += d * 0.15;
      requestAnimationFrame(step);
    };
    step();
  };

  var stopPreview = function () {
    if (!current) return;
    var btn = current;
    current = null;
    preview.pause();
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", btn.getAttribute("data-label-play"));
    btn.style.setProperty("--p", "0");
    var lbl = $(".preview-label", btn);
    if (lbl) lbl.textContent = "Listen";
    ambientLevel();
  };

  if (previews.length) {
    preview = new Audio();
    preview.preload = "none";
    preview.addEventListener("timeupdate", function () {
      if (current && preview.duration) {
        current.style.setProperty("--p", ((preview.currentTime / preview.duration) * 100).toFixed(1));
      }
    });
    preview.addEventListener("ended", stopPreview);
    preview.addEventListener("error", stopPreview);

    previews.forEach(function (btn) {
      var title = btn.getAttribute("data-title") || "this release";
      btn.setAttribute("data-label-play", "Listen: " + title);
      btn.setAttribute("aria-label", "Listen: " + title);
      var lbl = $(".preview-label", btn);
      if (lbl) lbl.textContent = "Listen";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (current === btn) { stopPreview(); return; }
        stopPreview();
        current = btn;
        preview.src = btn.getAttribute("data-preview");
        preview.currentTime = 0;
        var p = preview.play();
        if (p && p.catch) p.catch(stopPreview);
        btn.setAttribute("aria-pressed", "true");
        btn.setAttribute("aria-label", "Stop: " + title);
        if (lbl) lbl.textContent = "Playing";
        ambientLevel();
      });
    });
  }

  if (ambBtn) {
    var ambLabel = $(".amb-label", ambBtn);
    ambBtn.addEventListener("click", function () {
      if (!ambience) {
        ambience = new Audio(ambBtn.getAttribute("data-ambience"));
        ambience.loop = true;
        ambience.preload = "none";
        ambience.volume = 0;
      }
      var on = ambBtn.getAttribute("aria-pressed") === "true";
      if (on) {
        ambience.pause();
        ambBtn.setAttribute("aria-pressed", "false");
        if (ambLabel) ambLabel.textContent = "Room tone";
      } else {
        var p = ambience.play();
        if (p && p.catch) p.catch(function () {
          ambBtn.setAttribute("aria-pressed", "false");
          if (ambLabel) ambLabel.textContent = "Room tone";
        });
        ambBtn.setAttribute("aria-pressed", "true");
        if (ambLabel) ambLabel.textContent = "Room tone on";
        ambientLevel();
      }
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopPreview();
  });

  /* --- Colophon ---------------------------------------------------------- */
  var year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
