/** Homepage-only overrides, shared by the static snapshot and mounted React UI.
 * Real layout boxes (not overlapping pseudo-elements) keep touch targets distinct.
 * Small-screen typography is intentionally not a desktop-wide font-size floor.
 */
export const MOBILE_UX_CSS = `
@media (max-width:767px), (pointer:coarse) {
  footer a {
    display:inline-flex; align-items:center; justify-content:center;
    min-width:44px; min-height:44px; padding:8px;
    max-width:100%; overflow-wrap:anywhere;
  }
  footer .flex { gap:8px; }
  main input[type="range"] {
    min-height:44px; height:44px; min-width:44px; cursor:pointer;
  }
  #showreel button { min-width:44px; min-height:44px; }
  .zp-vcard a, .zp-vactions button {
    display:inline-flex; align-items:center; justify-content:center;
    min-width:44px; min-height:44px;
  }
  .zp-vactions { gap:8px; }
  #top a[href="/store"] { display:inline-flex; align-items:center; min-height:44px; padding:8px; }
  :where(a,button):active { outline:2px solid #e65650; outline-offset:2px; }
}
@media (max-width:479px) {
  footer a { font-size:12px; line-height:1.5; }
  main :is(.text-\\[8px\\],.text-\\[9px\\],.text-\\[10px\\],.text-\\[11px\\]),
  .zp-cue-times, .zp-cue-state, .zp-cue-current {
    font-size:12px; line-height:1.5;
  }
  #contact :is(input,select,textarea) { font-size:16px; }
  #showreel button { max-width:100%; }
}
:where(a,button,input[type="range"]):focus-visible {
  outline:2px solid #f0ebe3; outline-offset:3px;
}
/* Poster titles are already visible; expose the decorative reveal on keyboard
   focus too, without inventing a tap-to-reveal step before activation. */
.group:focus-within .group-hover\\:opacity-100 { opacity:1; }
`;

export function ensureMobileUxAssets(html) {
  const block = `<style id="zp-mobile-ux">${MOBILE_UX_CSS}</style>`;
  const existing = /<style id="zp-mobile-ux">[\s\S]*?<\/style>\s*/g;
  return html.replace(existing, '').replace('</head>', `${block}\n</head>`);
}
