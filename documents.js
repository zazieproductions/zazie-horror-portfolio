/* Open the relevant section for links to a clause or an anchor inside it. */
(function () {
  function revealHash() {
    if (!location.hash) return;
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    var target = document.getElementById(id);
    if (!target) return;
    var details = target.matches('section.clause') ? target.querySelector(':scope > details.doc-section') : target.closest('details.doc-section');
    if (details) {
      details.open = true;
      requestAnimationFrame(function () { target.scrollIntoView(); });
    }
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();
  var closedBeforePrint = [];
  window.addEventListener('beforeprint', function () {
    closedBeforePrint = Array.from(document.querySelectorAll('details.doc-section:not([open])'));
    closedBeforePrint.forEach(function (item) { item.open = true; });
  });
  window.addEventListener('afterprint', function () {
    closedBeforePrint.forEach(function (item) { item.open = false; });
    closedBeforePrint = [];
  });
}());
