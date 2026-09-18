# Method band copy: what is deployed, and the two poles it can swing to

The band lives in three places and is kept in step by hand (the homepage has two
copies: the prerendered `index.html` that crawlers read, and the React bundle
that `createRoot().render()` puts in front of visitors).

- `index.html` `<section id="method">` + `index-*.js` `Method` component
- `/process` clause `#method`
- `/composer` `#approach`, one paragraph

## Deployed: dark + psychological, with a sonic-theory spine and a conversion spine

Homepage label reads **"The method · how the dread is built"**. Above it, the
section lead is now one sentence shared by both copies (it used to differ; the
prerendered version said "clear spotting, revisions, and delivery", the bundle
said something else entirely):

> Themes, harmony, texture, and tension shaped to picture: the dread is
> diagnosed before the first note, the low end is placed where the body feels it
> first, and every cue is engineered with a trajectory and a residue.

The bundle's display headline (what visitors actually read; the prerendered
`<h2>` keeps the SEO-tuned wording for crawlers) is now:

> **The score is not decoration. It is the pressure the film is under.**

Then the statement, then one darker sub-line:

> Fear you can name is only the surface. The work happens underneath it: in
> expectancy, in what low frequency does to the body, in what the audience is
> still carrying when the credits roll.

| # | Movement | Kicker | Spine |
| --- | --- | --- | --- |
| I | Psychological audit | Before the first note, the diagnosis | each dread has a signature; scoring the wrong one is how a film ends up loud instead of frightening |
| II | Sonic terrain design | The world of the cut, built as sound | bottom octave felt before heard; threat as approach; a startle needs a quiet before it |
| III | Trajectory scoring | Where it starts, where it peaks, what it leaves | tension spent deliberately, paid off where the director decides |

Conversion spine under the cards: proof line (`29 original cues · 5.0
collaborator rating · reply within 48 hours`), then two CTAs — *Hear it in the
reel* (`/reel`) and *Start a scoring inquiry* (`/contact`).

`/process` carries the same three movements at a deeper register, with the
working vocabulary named: **auditory looming**, **infrasound**, **prepulse**,
and the psychology of expectation ("dread is the gap between what the ear is
promised and what arrives").

## Variant A — sonic theory maximal

Swap the three card bodies for these. Use when the reader is a director,
supervisor or editor who wants craft, not a pitch.

- **I · Psychological audit** — "Dread is diagnosed before it is written.
  Existential dread moves slowly, in long tones and unstable harmony. Paranoia
  tightens: short repeats, intervals that never settle. Grief sustains and
  refuses cadence. Contamination spreads. The audit establishes which of these
  the film is about, because the psychology of expectation says dread is the
  gap between what the ear is promised and what arrives — and a score aimed at
  the wrong fear cannot be rescued later."
- **II · Sonic terrain design** — "A sonic ecosystem that breathes with the
  world of the cut. Auditory looming does the work of threat: sound that rises
  and closes reads as approach before the picture shows it. The bottom octave is
  felt in the sternum, not heard. Infrasound is placed deliberately, never as a
  trick. Prepulse does the rest — a startle lands hardest when a quiet has
  prepared it. Custom instruments, found sounds, bowed metal, waterphone."
- **III · Trajectory scoring** — "Every cue is a curve: expectation, tension,
  violation, aftermath. Where anxiety starts, where it peaks, what residue it
  leaves when the film goes black. Tension is a budget: spent on purpose, paid
  off where the director decides, never all at once and never by accident."

## Variant B — high converting maximal

Same layout, sold instead of explained. Use when the reader arrives cold from
search or a festival page and needs a reason to act in ten seconds.

- **I · Psychological audit** — "Before a note is written, the film is
  diagnosed: what it is actually afraid of, cue by cue, agreed with you at
  spotting. No library cues, no stock stings, nothing composed by a generative
  model. You get a spotting document that says what each cue is for."
- **II · Sonic terrain design** — "Original instruments and sounds built for
  your picture — sub-bass you feel in the chest, textures no other film can
  borrow. Everything is yours, written to your cut, and stems land
  timecode-matched on the dub stage."
- **III · Trajectory scoring** — "Your audience's tension is a budget. This
  spends it where you want it spent and pays it off where you choose, so the
  film lands the way you cut it. Two revision rounds per cue are included,
  plus a consolidation pass after full delivery."
- **CTA row** — "Micro-budget from $50 · shorts from $2,500 · features from
  $8,000 · reply within 48 hours", with the same two buttons.

## Swapping

The homepage band is a self-contained block in `index.html` (classes are all
already in `index-ba4ce5d7.css`) and one insertion in the bundle at the
`"data-source-loc":"src/components/Method.tsx:52:1"` anchor. Editing the bundle
means renaming it to its new raw sha256 prefix and updating the import in
`index.html` plus the `sw.js` precache entry and `CACHE_NAME`, the same
discipline every earlier bundle change in this repo has followed.

Deployed state as of this file being written: bundle `index-8bb73e69.js`
(429,874 bytes), `CACHE_NAME = 'zazie-v7'`.
