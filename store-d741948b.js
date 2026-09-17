/* Zazie Productions — Store behaviour.
   Progressive enhancement only: without this file every release is visible,
   every card links straight to its marketplace listing, the filter bar,
   previews, ambience and atmosphere effects simply never appear. */
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
  var grid = $("[data-grid]");
  var empty = $("[data-empty]");
  var counter = $("[data-count]");
  var chips = $$(".chip[data-group]");
  var KEYS = ["records", "sfx", "plugins", "motion", "gear"];

  if (shelf && grid && chips.length) {
    var cards = $$("[data-collection]", grid);
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
      else if (h === "shelf") { state.collection = "all"; state.delivery = "all"; apply(); }
    };
    window.addEventListener("hashchange", readHash);
    readHash();
    apply();
  }

  /* --- Cover art fallback ------------------------------------------------
     Cover images are served by each marketplace CDN. If one is ever pulled,
     the card keeps its composure and shows the monogram plate instead. */
  $$(".card-media img").forEach(function (img) {
    var host = img.parentElement;
    var fail = function () { host.classList.add("is-missing"); };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener("error", fail, { once: true });
  });

  /* --- Scroll reveal ------------------------------------------------------ */
  var revealables = $$(".reveal, .stats li");
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

  /* --- Card tilt + spotlight (fine pointers only) ------------------------- */
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
          card.style.setProperty("--ry", ((px - 0.5) * 7).toFixed(2) + "deg");
          card.style.setProperty("--rx", ((0.5 - py) * 7).toFixed(2) + "deg");
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

  /* --- Torch: pointer-following glow ------------------------------------- */
  if (fine && !reduce) {
    var torchRaf = 0;
    window.addEventListener("pointermove", function (e) {
      if (torchRaf) return;
      torchRaf = requestAnimationFrame(function () {
        torchRaf = 0;
        root.style.setProperty("--tx", e.clientX + "px");
        root.style.setProperty("--ty", e.clientY + "px");
        root.classList.add("torch-on");
      });
    }, { passive: true });
    document.addEventListener("pointerleave", function () { root.classList.remove("torch-on"); });
  }

  /* --- VHS tracking roll, now and then ----------------------------------- */
  var vhs = $(".vhs-tracking");
  if (vhs && !reduce) {
    var roll = function () {
      if (!document.hidden) {
        vhs.classList.add("active");
        setTimeout(function () { vhs.classList.remove("active"); }, 450);
      }
      setTimeout(roll, 9000 + Math.random() * 14000);
    };
    setTimeout(roll, 5000 + Math.random() * 6000);
  }

  /* --- Audio: in-card previews + room ambience --------------------------- */
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
      btn.setAttribute("data-label-play", "Preview " + title);
      btn.setAttribute("aria-label", "Preview " + title);
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
        btn.setAttribute("aria-label", "Stop preview of " + title);
        ambientLevel();
      });
    });
  }

  if (ambBtn) {
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
      } else {
        var p = ambience.play();
        if (p && p.catch) p.catch(function () { ambBtn.setAttribute("aria-pressed", "false"); });
        ambBtn.setAttribute("aria-pressed", "true");
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
