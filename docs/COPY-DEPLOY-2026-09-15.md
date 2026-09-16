# Deployment Copy Pack — downstream surfaces + test protocol — 2026-09-15

Primary (V1, deployed live on horror.zazieproductions.com) and one challenger variant (V2, for test only).
Everything below is paste-ready. Do not run V2 and V1 copy on the same surface at the same time.

---

## PRIMARY (V1) — deployed

### Hero (already live)
> **Stop letting temp music rewrite your film.**
>
> Original scores that play the dread the audience feels *before the film admits why.*
>
> Your audience has already heard that library cue — in someone else's trailer. Rented music reads as a rented film. I write to one picture at a time: themes that know where your cuts fall, dread that survives a festival mix, stems on time for the dub.
>
> [Hear the proof]  [Claim a scoring slot]

### Short positioning paragraph (decks, About blurbs, proposal headers)
> Zazie Kanwar-Torge is a psychological horror composer. He scores anticipation, not action — original music written to picture, one film at a time. Rented music reads as a rented film; every cue here is built, not licensed. Film, TV, games. Student shorts to features.

### Long-form positioning (site about / pitch deck page)
> Temp music gets you through the edit. It will not carry the room. Your audience has already heard that library cue — in someone else's trailer — and borrowed music makes a film feel already seen. Psychological horror only works the other way: the score tells the audience what the story hasn't admitted yet.
>
> That is the whole practice. Themes that know where your cuts fall. Motifs that return when they shouldn't. Silence placed on purpose. Tension built to survive a festival mix, with spotting, stems, alts, and a picture-locked handoff on time for the dub. Not a library pack. Not "we also do foley." A composer who makes the cut feel finished — so directors protect the cut, supervisors protect taste, and producers protect the screening.
>
> The last thing you fix is the first thing they feel. That's why the score gets booked before lock, not after.

### Email — outbound subject lines (ranked)
1. `Your temp track has an audience already`
2. `Scoring [FILM TITLE] before picture lock`
3. `The first thing the room feels`
4. `Rented music reads as a rented film`
5. `One picture at a time — [FESTIVAL/PROJECT] slot open`

### Email — cold opener (first 3 lines)
> [First name] — I watched [TITLE]'s teaser twice. [Specific: "The kitchen scene holds its breath for a beat too long — that's where the audience should be scared, not yet sure why."]
>
> I'm a psychological horror composer, writing original scores to picture — themes, tension, and placed silence, delivered before your mix. I take a limited number of scores per quarter and reply to every complete inquiry within 48 hours.
>
> The reel is 90 seconds: [LINK]. If your pulse changes, reply with runtime and lock date and I'll tell you honestly whether I can serve this cut.

### Email signature one-liner
> Zazie Kanwar-Torge · Psychological Horror Composer · Rented music reads as a rented film — reel: horror.zazieproductions.com

### Social bios (Instagram / X / LinkedIn headline)
- `Psychological horror composer. Original scores written to picture, one film at a time. Rented music reads as a rented film. Inquiries answered in 48h.`
- LinkedIn headline: `Psychological horror composer | original scores written to picture | film · TV · games | "The last thing you fix is the first thing they feel."`

### Schema / citation one-liners (already embedded; reuse verbatim in directories)
- Slogan: `Rented music reads as a rented film.`
- Definition: `A psychological horror composer scores anticipation, not action: music that tells the audience what the story hasn't admitted yet.`
- Process: `Themes, tension, and placed silence written to the locked cut; spotting, stems, alts, on time for the dub.`

---

## VARIANT (V2) — challenger for test, mechanism-first (NOT deployed)

### Hero block (replaces V1 hero entirely)
> **Stop letting temp music rewrite your film.**
>
> Scores that slow the breath, *speed the pulse.*
>
> Original psychological horror written to picture: motifs that return when they shouldn't, dynamics that commit the body before the story confirms the threat, stems on time for the dub. Every film gets its own score — or it gets someone else's feeling.

Use V2 ONLY as the A-arm flip in the test below. Everything else on the page stays V1.

---

## TEST PROTOCOL

**Constraint:** a niche portfolio site has too little traffic for a powered parallel A/B. Run sequential pre/post on the hero block only.

- **Unit:** session. **Primary metric:** inquiry-intent CTR — clicks on `Claim a scoring slot` / `Send scoring inquiry` / `mailto:` opens. Wire GA4 events (or Netlify/Plausible custom events) to these buttons BEFORE the flip; without instrumentation, no test.
- **Secondary:** scroll-depth to #rates; complete-inquiry rate (inquiries containing runtime + lock date + real budget = the "quality" metric); reply-to-engagement conversion (manual, from inbox log).
- **Design:** 4 weeks V1 baseline → 4 weeks V2, matched weeks across the Oct–Dec post-festival-submission window (avoid crossing major festival deadline cliffs mid-arm). Hero + trust chips identical between arms except the block above.
- **Power reality:** a 4%→6% CTR lift needs ~1,900 sessions/arm (two-proportion, α=.05, power=.8). Below that, decide on directional CTR + qualitative only. 10+ inquiries per arm on complete-inquiry rate is a usable quality signal (binomial p≈.03 at +20pp).
- **Keep V1 if:** V2 lifts primary CTR <15% relative, OR V2's complete-inquiry rate is lower.
- **Ship V2 if:** ≥15% relative lift in CTR sustained, with complete-inquiry rate non-inferior.
- **Both fail (CTR < baseline −30% at n≥1k/arm):** revert to docs/backup-2026-09-15 originals and re-aim at fear-free framing (test "protects your screening" angle, not atmosphere angle).
- **Kill criteria for the marquee chips edit:** if replies include "who have you actually worked with?" more than 1× per 10 inquiries, the chips read as too thin — restore label-context section above them.
- **Qualitative instrument (mandatory):** add one field to the inquiry email template: "What made you reach out now?" — free text. This is the real conversion data at this traffic scale.
