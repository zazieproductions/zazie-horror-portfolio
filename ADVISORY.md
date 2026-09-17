# Content advisory: behaviour, copy and maintenance record

A horror-themed, deliberately quiet warning that runs **before** anything can
be watched or heard. It exists so nobody meets the work unwarned, and it is
built to be the least distracting thing on the page: no autoplay audio, no
strobe, one button, one screen, once per visit.

Terms covered: **paranoia · blood · flashy images · dissonant + screechy
sound · dread · disturbing content**, i.e. the register expected in
experimental and horror film.

## 1. Where it lives

| Piece | Location |
| --- | --- |
| Gate decision (before paint) | `index.html` `<head>`, `<script id="zp-advisory-gate">` |
| Panel styling | `index.html` `<head>`, `<style id="zp-advisory-style">` |
| Panel markup | `index.html` `<body>`, `<div id="zp-advisory">` — **outside `#root`**, like the tape, so a React takeover cannot strip it |
| Panel driver | `index.html` end of `<body>`, the `ZP CONTENT ADVISORY — panel driver` block |
| Persistent plain-text line + reopen control | `index.html` footer, `<div id="advisory">` (`/#advisory`) |
| Store page line | `store-src/store.html` hero, `.hero-advisory` (styles in `store-src/store.css`) — rendered through `./store-src/build.sh` |

Six names are in the document at all times: the panel, its heading, and the
footer paragraph. Crawlers and no-JS visitors read the advisory as plain text;
nothing is gated when JavaScript never runs.

## 2. When it shows

* Once per browser session (`sessionStorage.zpAdvisorySeen`).
* On preview/dev hosts (`e2b.app`, `pages.dev`, `localhost`, `127.0.0.1`) it
  replays on every load, like the tape does, so it can be reviewed.
* `?advisory=1` or `#advisory` forces a replay anywhere.
* It always shows under `prefers-reduced-motion` — it is information, not
  decoration. What changes there is presentation only: no fade, no sheen, no
  breathing marker.
* Bots are not sniffed for the gate itself; it is a single static panel.

## 3. Handoff (advisory → tape → site)

The tape's gate (`window.zpBootGate`) and its driver (the one-shot
`window.zpBootRun`) are re-armable, so the two full-screen pieces never
overlap:

1. The advisory gate sets `window.zpAdvisoryPending`, so `zpBootGate()`
   declines to arm the tape at parse time.
2. On acknowledge (`I understand · Enter the archive`, `Esc`, or the panel's
   close path) the driver clears `zpAdvisoryPending`, then calls
   `zpBootGate()` and `zpBootRun()`.
3. `zpBootRun()` is one-shot (`bootStarted` latch): reopening the advisory from
   the footer can never start a second tape.

Under reduced motion the tape never arms, so acknowledging lands straight on
the site.

## 4. Failsafes

* No JS → no gate, no overlay, advisory still readable in the footer.
* Any error in the gate or driver → the tape runs as it did before.
* Panel markup missing or blocked → a watchdog in the boot driver releases the
  tape 1.2 s after parse, so a broken panel can never hold the site hostage.
* `@media print` hides the panel.
* Focus is trapped in the panel while it is open, `Esc` closes it, focus
  returns to the control that opened it, and `#root` is `aria-hidden` for as
  long as the panel is up.

## 5. Changing the copy

* Terms live in three places and should stay in step: the panel list
  (`.zp-adv-list`), the footer paragraph (`#advisory`), and the store hero
  (`.hero-advisory`).
* Panel prose lives in `.zp-adv-lead` (what this is) and `.zp-adv-note` (the
  reassurance that nothing plays on its own, plus the play-first contract).
* Keep the button label an acknowledgment, not an imperative. Keep new
  animation calm: slow fades and long sheens only — the page warns about
  flashy images, so it must not flash.

## 6. Verification performed

* jsdom suite (30 assertions) against `index.html`: gate fires on a fresh
  session, the six terms are present, dialog role/`aria-modal`/labels,
  focus on open, `#root` hidden from AT, acknowledge → `zpAdvisorySeen` set →
  tape armed and typing, footer control reopens without a second tape, `Esc`
  closes, in-session repeat suppressed, `?advisory=1` forces, reduced motion
  still warns but suppresses the tape, no-JS static document carries the
  terms, and the missing-markup watchdog releases the tape.
* `node --check` on all 13 inline scripts; HTML tag balance; CSS parsed clean
  by `css-tree` (advisory block, tape block, `store.css`).

**Not verifiable here:** no browser binary can be fetched in this environment
(the Chrome-for-Testing and Playwright download hosts are unreachable), so the
panel was not captured as a rendered screenshot. Layout was reasoned about
against the overlay's flex/`margin:auto` + `overflow-y:auto` pattern at 1440 ×
900, 390 × 844 and 900 × 420.
