/**
 * Homepage psychological-horror scoring section.
 *
 * Shared by the static first paint and the patched React render. Scientific
 * language is deliberately framed as compositional practice, not as a promise
 * that a particular frequency produces the same physiological response in
 * every listener.
 */

export const PSYCHOACOUSTIC_SECTION_ID = 'psychoacoustic-score';
export const PSYCHOACOUSTIC_SECTION_CLASS =
  'zp-psycho-section relative isolate overflow-hidden border-y border-blood/20 bg-ink py-16 sm:py-24 md:py-32';

export function psychoacousticSectionInnerHtml() {
  return `
    <div class="zp-psycho-signal" aria-hidden="true">
      <svg viewBox="0 0 520 260" role="presentation" focusable="false">
        <path d="M0 130h73l14-2 9-4 11 12 12-27 13 47 12-68 13 85 12-59 12 25 12-11h30l10-2 10-8 12 20 14-34 14 62 13-75 13 90 13-53 11 17h59l14-2 11-7 12 14 12-24 13 40 13-50 12 59 13-33 14 6h40" />
        <path class="zp-psycho-echo" d="M0 130h520" />
      </svg>
    </div>
    <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
      <div class="zp-psycho-header-grid grid gap-6 border-b border-white/10 lg:grid-cols-12">
        <div class="lg:col-span-7">
          <p class="mb-4 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-blood sm:text-[11px] sm:tracking-[0.4em]">
            <span class="zp-psycho-status" aria-hidden="true"></span>
            Psychological horror · the composer's question
          </p>
          <h2 id="psychoacoustics-title" class="max-w-3xl font-display text-4xl leading-none tracking-tight text-bone sm:text-5xl md:text-6xl">
            Why do certain frequencies make the body prepare to die?
          </h2>
        </div>
        <div class="lg:col-span-5">
          <p class="text-base leading-relaxed text-mist sm:text-lg">
            I became obsessed with a single question: why can a sound make the body brace for danger before the mind knows what it heard?
          </p>
          <p class="mt-4 text-sm leading-relaxed text-mist sm:text-base">
            I wanted to make the audience feel watched, cornered, hunted—before the threat had a name.
          </p>
        </div>
      </div>

      <div class="zp-psycho-middle grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div class="lg:col-span-5">
          <p class="mb-4 text-[10px] uppercase tracking-[0.35em] text-blood sm:text-[11px]">The difference</p>
          <blockquote class="zp-psycho-pullquote">
            <p class="font-display text-2xl leading-snug text-bone sm:text-3xl">
              Traditional scoring can make you cry or feel heroic. I wanted to discover what happens when it does neither—when it makes you feel hunted.
            </p>
          </blockquote>
          <p class="mt-6 text-sm leading-relaxed text-mist sm:text-base">
            That question became five years of focused acoustic research. I studied neurobiology, the history of sonic warfare, animal distress calls, and auditory pareidolia—the brain's habit of hearing voices and patterns in noise.
          </p>
          <p class="mt-4 text-sm leading-relaxed text-mist sm:text-base">
            I began stripping away familiar chord resolutions when they softened the dread, and composing with instability, texture, and silence instead.
          </p>
        </div>

        <div class="lg:col-span-7">
          <div class="mb-2 flex items-center justify-between gap-4 border-b border-white/10 pb-2">
            <p class="text-[10px] uppercase tracking-[0.35em] text-blood sm:text-[11px]">Three materials · one story</p>
            <p class="text-[10px] uppercase tracking-[0.25em] text-mist">Field notes 01—03</p>
          </div>
          <ol class="zp-psycho-techniques" aria-label="Three compositional materials used to create psychological dread">
            <li class="zp-psycho-technique">
              <span class="zp-psycho-number" aria-hidden="true">01</span>
              <div>
                <h3 class="font-display text-xl text-bone sm:text-2xl">Infrasound · below 20 Hz</h3>
                <p class="mt-1 text-sm leading-relaxed text-mist sm:text-base">
                  It's tempting to tie that unease to distant earthquakes and unseen predators. But infrasound isn't a universal fear switch: playback, level, and context matter. I use the low end as pressure, not a promise.
                </p>
              </div>
            </li>
            <li class="zp-psycho-technique">
              <span class="zp-psycho-number" aria-hidden="true">02</span>
              <div>
                <h3 class="font-display text-xl text-bone sm:text-2xl">Two violins · a minor second</h3>
                <p class="mt-1 text-sm leading-relaxed text-mist sm:text-base">
                  Set two lines a minor second apart, then let one drift slightly out of tune. The friction can suggest the rough edge of a human cry—without playing a literal scream.
                </p>
              </div>
            </li>
            <li class="zp-psycho-technique">
              <span class="zp-psycho-number" aria-hidden="true">03</span>
              <div>
                <h3 class="font-display text-xl text-bone sm:text-2xl">Silence · 0.8 seconds too long</h3>
                <p class="mt-1 text-sm leading-relaxed text-mist sm:text-base">
                  I sometimes hold a pause just beyond the scene's natural breath. The extra 0.8 seconds is not a formula; it's a deliberate space for the audience to imagine what the frame withholds.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <div class="zp-psycho-bottom">
        <div class="zp-psycho-proof" aria-label="Composer experience and research">
          <div class="zp-psycho-proof-item">
            <span class="zp-psycho-proof-value">14</span>
            <span class="zp-psycho-proof-label">years sharpening the craft</span>
          </div>
          <div class="zp-psycho-proof-item">
            <span class="zp-psycho-proof-value">47</span>
            <span class="zp-psycho-proof-label">films &amp; game projects</span>
          </div>
          <div class="zp-psycho-proof-item">
            <span class="zp-psycho-proof-value">5</span>
            <span class="zp-psycho-proof-label">years of acoustic research</span>
          </div>
        </div>
        <div class="zp-psycho-invitation">
          <div class="max-w-2xl">
            <p class="mb-2 text-[10px] uppercase tracking-[0.35em] text-blood sm:text-[11px]">For the scene that won't let go</p>
            <h3 class="font-display text-2xl leading-tight text-bone sm:text-3xl">
              Your score doesn't need to announce the monster. It can make the audience feel its attention.
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-mist sm:text-base">
              Bring me the moment that should feel unsafe before anything happens. We'll find the sound the picture is asking for.
            </p>
          </div>
          <div class="zp-psycho-actions">
            <a href="#contact" class="zp-psycho-cta">Talk through a scene <span aria-hidden="true">→</span></a>
            <a href="#showreel" class="zp-psycho-listen">Listen to the reel <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </div>
      <p class="zp-psycho-caveat">
        These are compositional tools, not guaranteed physiological effects. Responses vary with the scene, performance, mix, playback system, and listener.
      </p>
    </div>`;
}

export function psychoacousticSectionHtml() {
  return `<section id="${PSYCHOACOUSTIC_SECTION_ID}" aria-labelledby="psychoacoustics-title" class="${PSYCHOACOUSTIC_SECTION_CLASS}">${psychoacousticSectionInnerHtml()}</section>`;
}

export const PSYCHOACOUSTIC_SECTION_CSS = `
  /* Psychological-horror field notes: a still, restrained analogue signal plate. */
  .zp-psycho-section{isolation:isolate}
  .zp-psycho-section::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 62% 58% at 88% 24%,rgba(113,12,18,.19),transparent 72%),linear-gradient(120deg,rgba(255,255,255,.018),transparent 42%)}
  .zp-psycho-header-grid{padding-bottom:2.25rem}
  .zp-psycho-middle{padding-block:2.5rem}
  @media(min-width:640px){.zp-psycho-header-grid{gap:2.5rem;padding-bottom:3rem}.zp-psycho-middle{padding-block:3rem}}
  @media(min-width:1024px){.zp-psycho-header-grid{align-items:end;gap:2rem}}
  .zp-psycho-signal{position:absolute;top:-4.5rem;right:-5rem;width:min(52vw,38rem);height:auto;color:#e65650;opacity:.14;pointer-events:none}
  .zp-psycho-signal svg{display:block;width:100%;height:auto;overflow:visible}
  .zp-psycho-signal path{fill:none;stroke:currentColor;stroke-width:1.1;vector-effect:non-scaling-stroke}
  .zp-psycho-signal .zp-psycho-echo{opacity:.2;stroke-width:.6}
  .zp-psycho-status{position:relative;width:.45rem;height:.45rem;border:1px solid #e65650;border-radius:50%;box-shadow:0 0 12px rgba(230,86,80,.6)}
  .zp-psycho-status::after{content:"";position:absolute;inset:.11rem;border-radius:50%;background:#e65650}
  .zp-psycho-pullquote{padding:1.15rem 1.3rem;border-left:2px solid #e65650;background:linear-gradient(90deg,rgba(196,30,30,.11),rgba(196,30,30,0) 90%)}
  .zp-psycho-techniques{margin:0;padding:0;list-style:none}
  .zp-psycho-technique{display:grid;grid-template-columns:2.25rem minmax(0,1fr);gap:.8rem;padding:1.15rem 0;border-bottom:1px solid rgba(255,255,255,.1)}
  .zp-psycho-technique:first-child{padding-top:1.1rem}
  .zp-psycho-number{padding-top:.35rem;color:#e65650;font-family:var(--font-mono,monospace);font-size:.7rem;letter-spacing:.14em}
  .zp-psycho-bottom{display:grid;gap:1.5rem;border-top:1px solid rgba(255,255,255,.1);padding-top:1.5rem}
  .zp-psycho-proof{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid rgba(255,255,255,.1);background:rgba(3,3,3,.32)}
  .zp-psycho-proof-item{display:flex;min-width:0;flex-direction:column;justify-content:center;padding:1rem 1.1rem}
  .zp-psycho-proof-item+.zp-psycho-proof-item{border-left:1px solid rgba(255,255,255,.1)}
  .zp-psycho-proof-value{font-family:var(--font-display,'Cormorant Garamond',Georgia,serif);font-size:2.5rem;line-height:.95;color:#f0ebe3}
  .zp-psycho-proof-label{margin-top:.45rem;color:#aaa39c;font-size:.65rem;line-height:1.45;letter-spacing:.13em;text-transform:uppercase}
  .zp-psycho-invitation{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:1.5rem 0 .25rem}
  .zp-psycho-actions{display:flex;flex-shrink:0;flex-direction:column;align-items:flex-start;gap:.8rem}
  .zp-psycho-cta{display:inline-flex;min-height:48px;align-items:center;justify-content:center;gap:.8rem;border:1px solid #c41e1e;background:#c41e1e;padding:.8rem 1.2rem;color:#f0ebe3;font-size:.68rem;letter-spacing:.17em;text-transform:uppercase;transition:background .2s,border-color .2s}
  .zp-psycho-cta:hover,.zp-psycho-cta:focus-visible{border-color:#e65650;background:#a71919}
  .zp-psycho-cta:focus-visible,.zp-psycho-listen:focus-visible{outline:2px solid #e65650;outline-offset:3px}
  .zp-psycho-listen{min-height:40px;padding:.55rem .2rem;color:#c4bdb5;font-size:.67rem;letter-spacing:.14em;text-decoration:underline;text-decoration-color:#e65650;text-underline-offset:4px;text-transform:uppercase;transition:color .2s}
  .zp-psycho-listen:hover{color:#f0ebe3}
  .zp-psycho-caveat{margin:1.4rem 0 0;color:#8f8983;font-size:.7rem;line-height:1.55}
  @media(max-width:767px){.zp-psycho-signal{top:-1.5rem;right:-7rem;width:26rem}.zp-psycho-invitation{align-items:flex-start;flex-direction:column;gap:1rem}.zp-psycho-actions{width:100%;align-items:stretch}.zp-psycho-cta{width:100%}}
  @media(max-width:540px){.zp-psycho-proof{grid-template-columns:1fr}.zp-psycho-proof-item{flex-direction:row;align-items:baseline;justify-content:flex-start;gap:.9rem;padding:.7rem 1rem}.zp-psycho-proof-item+.zp-psycho-proof-item{border-top:1px solid rgba(255,255,255,.1);border-left:0}.zp-psycho-proof-value{min-width:2rem;font-size:2rem}.zp-psycho-proof-label{margin-top:0}}
  @media(prefers-reduced-motion:reduce){.zp-psycho-cta,.zp-psycho-listen{transition:none}}
`;
