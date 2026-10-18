# Proposed legal updates: align terms and licensing with the proposed commissioning model

Status: **proposal for owner and counsel review. Not published. Not in effect.**
Date: 2026-10-18 · Review branch: `arena/5a04007b-zazie-horror-portfolio`

This document isolates proposed operative changes to `terms.html` (source:
`legal-src/pages/terms.html`) and `licensing.html` (source:
`legal-src/pages/licensing.html`) for owner and counsel review. The operative
legal files and their sources remain unchanged in this integration. Commercial
pages have been updated to PR #83's pricing specification while compatible
newer `main` content is retained. The proposed legal changes below are not
approved or in effect; the commercial/legal conflicts must be resolved before
publication.

Nothing here is legal advice. Items 1 and 2 change what the studio is
committed to and are worth an hour with a lawyer (see `RATIFY.md` items 3, 4,
11). Do not apply these edits without written owner approval.

Existing contracts are protected either way: `terms.html` clause 24 already
provides that a change "does not alter a project already quoted", and the new
commercial copy states that payment terms "apply to new commissions only and
do not change existing contracts".

---

## 1. Default rights model (highest value decision)

**Conflict.** `terms.html` clause 10 and `licensing.html` sections 2–4 say the
default grant is a copyright buyout on full payment. The proposed commercial model treats a
**standard project-use licence** as the base: use in the named production,
its festival run and its own release, with copyright staying with the
composer. Exclusivity, copyright assignment, soundtrack exploitation and
expanded uses require a separate written agreement and are never included
automatically. The FAQ (`q-who-owns`), `/services` section III,
`/hire-a-composer` and `/process` already say this.

**Current text** (`licensing.html` §2, echoed in `terms.html` clause 10):

> On payment in full, the studio grants and assigns to the production the
> entire copyright in the commissioned score, as a work made for hire where
> that characterisation is available and otherwise by present assignment of
> all right, title and interest, for the picture and all versions of it, in
> all media now known or later devised, throughout the world, in perpetuity.

**Proposed replacement** for `licensing.html` §2 (and the summary in `terms.html`
clause 10):

> On payment in full, the studio grants the production a non-exclusive
> project-use licence in the commissioned score: synchronisation and use of
> the recorded score in the picture and its versions, including festival
> screenings, press and publicity use, trailers and teasers, and the
> picture's own distribution, in all media and territories, in perpetuity.
> Copyright in the commissioned score stays with the composer. Exclusivity,
> assignment of copyright, soundtrack album exploitation and any expanded
> uses require a separate written agreement and are quoted individually.
> They are never included automatically in a commission.

**Consequential edits if approved:**

- `licensing.html` doc-meta row "Default grant: Buyout on full payment" →
  "Default grant: Standard project-use licence".
- `licensing.html` lead paragraph "The default position is a buyout" →
  "The default position is a standard project-use licence".
- `licensing.html` §3 options table: move "Buyout (default)" to a
  non-default row ("Buyout (copyright assignment): transfers on full payment
  under a separate written agreement; quoted individually") and add a
  "Standard project-use licence (default)" row.
- `licensing.html` §4: "The publisher's share … follows the grant by
  default: with a buyout it is the production's to collect or assign, with a
  licence it stays with the composer." Under the new default the second limb
  applies unless a buyout is separately agreed. No wording change required,
  but confirm the sentence still reads correctly once the buyout is no
  longer the default.
- `terms.html` clause 10 paragraph 1: replace the buyout summary with the
  licence summary above. Paragraphs 2 (rights transfer on payment) and 3
  (soundtrack album separate) stand, with "transfer" in paragraph 2 reading
  as the licence grant until the balance settles.
- Title/meta mentions of "Buyout" on `/licensing` can remain: the page still
  explains buyouts as an option.
- **Define distribution boundaries.** The proposed project-use text includes
  the picture's own release in all media, while the estimator's expanded-
  distribution option separately adds broadcast, streaming and paid video-on-
  demand. Define which windows and promotional uses are in the base licence so
  the two commercial descriptions do not price the same rights twice.

## 2. Revision allowance and extra-round rate

**Conflict.** `terms.html` clause 7 promises "two rounds of notes per cue
during composition and one consolidation pass". The proposed package model includes
**one consolidated revision round** for Individual Scene and Focused scores
and **two** for Extended scores, with each additional round at **$75 minimum
or 10% of the commission fee, whichever is greater**. The current integration
source also models two rounds for custom Feature/Experimental scope, but PR #83's
proposed clause does not state a custom-project allowance. The owner should
confirm whether Feature/Experimental rounds are fixed at two or agreed per
quote before clause 7 is revised. The FAQ (`q-revisions`), `/services` factors
and `/process` describe the commercial model.

**Current text** (`terms.html` clause 7, paragraph 1):

> The included revision allowance is the studio default: two rounds of notes
> per cue during composition and one consolidation pass after the full score
> is delivered. A round means one collected set of notes delivered at one
> time.

**Proposed replacement:**

> The included revision allowance is the studio default: Individual Scene
> commissions include one consolidated revision round; Focused Short-Film
> scores include one consolidated revision round; Extended Short-Film scores
> include two consolidated revision rounds. A revision round means one
> consolidated set of reasonable changes to an agreed creative direction.
> Each additional round costs $75 minimum or 10% of the commission fee,
> whichever is greater. New cues, substantial rewrites, and changes caused
> by picture recuts are separately quoted.

## 3. Standard delivery specification

**Conflict.** `terms.html` clause 8 lists "a stereo full mix, stems by
instrumental family, the agreed alternate mixes, an MP3 reference set and a
cue sheet" as standard delivery. The proposed commercial model specifies **professional
stereo WAV files of the agreed cues with a cue list and timings**; multitrack
stems, alternate mixes, surround/immersive mastering, dialogue editing, final
film mixing, comprehensive audio post and bespoke sound-design packages are
specialist work considered individually after a feasibility check. The FAQ
(`q-deliverables`), `/services` inclusions and `/process` already say this.

**Current text** (`terms.html` clause 8, paragraph 1, first sentence):

> Delivery is electronic, by download link or file transfer, in the formats
> named in the quote. The standard delivery is a stereo full mix, stems by
> instrumental family, the agreed alternate mixes, an MP3 reference set and
> a cue sheet, at 24-bit WAV and 48 kHz unless the project specifies
> otherwise.

**Proposed replacement** (first sentence after the delivery-method sentence):

> The standard delivery is professional stereo WAV files of the agreed cues
> (24-bit, 48 kHz unless the project specifies otherwise) with a cue list
> and timings for the edit.

And add to the same clause:

> Multitrack stems, alternate mixes, surround or immersive mastering,
> dialogue editing, final film mixing, comprehensive audio post-production
> and bespoke sound-design packages are not standard inclusions. Additional
> technical requirements may be considered individually after confirming
> feasibility, and are quoted separately.

Note: `/sound-design` and `/game-scoring` legitimately promise stems for
*those* services (designed atmospheres and adaptive layers are delivered as
stems by nature). Those pages are unaffected.

## 4. Payment trigger wording

**Conflict (minor).** `terms.html` clause 6 says "the balance on delivery of
the final stems". The proposed commercial term is "remaining 50% due **before release
of final approved deliverables**". The FAQ (`q-deposit`), `/contact` and the
inquiry form already say this.

**Current text** (`terms.html` clause 6, paragraph 1, first sentence):

> Fees are quoted net in United States dollars. The studio default is a 50
> percent deposit to book the slot and the balance on delivery of the final
> stems; a different split can be agreed in writing before work starts.

**Proposed replacement** (second clause only):

> …a 50 percent deposit before work begins and the remaining 50 percent due
> before release of the final approved deliverables, subject to the written
> agreement; a different split can be agreed in writing before work starts.

## 5. Stale "production tier" reference

**Conflict (minor).** `terms.html` clause 5 says "The quote records the
runtime, cue count or an estimate of it, the production tier, the delivery
date and the deliverables." There are no production tiers anymore
(Lean/Standard/Signature/Orchestral+ were removed), and quotes are built from
scored minutes, not runtime.

**Proposed replacement:**

> The quote records the scored minutes of music, the cue count or an
> estimate of it, the delivery date, the revision allowance, the licence and
> the deliverables.

## 6. Licence default in RATIFY.md and LEGAL.md

`RATIFY.md` item 3 and `LEGAL.md` describe the buyout default as drafted.
They are historical records of what was drafted and why, not operative
terms. If item 1 above is approved, add a dated addendum to `RATIFY.md`
recording the decision (as `LEGAL.md` already does for past addenda) rather
than rewriting history.

## 7. Suggested order of work

1. Owner decides item 1 (default rights model) with counsel. Everything keys
   off it.
2. Owner confirms items 2–5 (revisions, delivery, payment trigger, tier
   reference).
3. Apply the approved edits to `legal-src/pages/terms.html` and
   `legal-src/pages/licensing.html`, rebuild (`./legal-src/build.sh`), and
   re-run the full build and `npm test`.
4. Record the decisions as a dated addendum in `RATIFY.md`.
5. Only then deploy: commercial pages and legal documents will agree.
