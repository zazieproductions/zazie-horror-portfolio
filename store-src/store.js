/* Zazie Productions — Store behaviour.
   Progressive enhancement only: without this file every release is visible,
   every card links straight to its marketplace listing, and the filter
   bar stays hidden. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("has-js");

  /* --- Filtering --------------------------------------------------------- */
  var shelf = document.querySelector("[data-shelf]");
  var grid = document.querySelector("[data-grid]");
  var empty = document.querySelector("[data-empty]");
  var counter = document.querySelector("[data-count]");
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-group]"));

  if (shelf && grid && chips.length) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-collection]"));
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

    var fromHash = (location.hash || "").replace("#", "");
    ["sfx", "plugins", "motion", "gear"].forEach(function (key) {
      if (fromHash === key) state.collection = key;
    });
    if (fromHash === "digital" || fromHash === "physical") state.delivery = fromHash;

    apply();
  }

  /* --- Cover art fallback ------------------------------------------------
     Cover images are served by each marketplace CDN. If one is ever pulled,
     the card keeps its composure and shows the monogram plate instead. */
  Array.prototype.slice.call(document.querySelectorAll(".card-media img")).forEach(function (img) {
    var host = img.parentElement;
    var fail = function () { host.classList.add("is-missing"); };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener("error", fail, { once: true });
  });

  /* --- Colophon ---------------------------------------------------------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
