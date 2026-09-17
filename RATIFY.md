# RATIFY: decisions a human has to make

Date: 2026-09-17 · Companion to `LEGAL.md`

The documents published under `/legal` were drafted to be internally
consistent, on voice and specific to this business. Everything below is a
**fact that creates an obligation**, and it was deliberately *not* invented.
Each item states what was drafted instead, where it appears, what breaks if it
is wrong, and the exact edit to make.

Priority order: items 1 to 4 change what the studio is legally committed to.
The rest are accuracy.

Nothing here is legal advice. Items 1, 3, 4 and 11 are worth an hour with a
lawyer; the others are not.

---

## 1. The contracting entity

* **Drafted as:** `Zazie Productions LLC`, used as the contracting party and
  the data controller. This name was already published in the site footer and
  the `Organization` JSON-LD (`foundingDate: "2022"`); it was not introduced
  by this work.
* **Appears in:** the footer of every page (three footers: prerendered,
  bundle, legal partial), `index.html` `Person` and `Organization` schema,
  `/terms` clause 1, `/privacy` section 2, `/purchases` section 2,
  `/legal` meta row.
* **Why it matters:** every commission, invoice and privacy request is with
  this entity. If the LLC is not formed, is formed under a different name, or
  is not in good standing, the studio is contracting personally, which changes
  liability completely, and the privacy notice names the wrong controller.
* **Confirm:** exact registered name, state of organisation, registration
  number, and good standing.
* **Edit if wrong:** global replace of `Zazie Productions LLC` across
  `index.html`, `legal-src/partials/footer.html`, `legal-src/pages/*.html`,
  `store-src/store.html`, then `./legal-src/build.sh && ./store-src/build.sh`.

## 2. Governing law and venue

* **Drafted as:** jurisdiction neutral on purpose: "the law of the state in
  which Zazie Productions LLC is organised" and "the courts of the state in
  which Zazie Productions LLC is organised". No state was invented.
* **Appears in:** `/terms` clause 23 (three places in that clause).
* **Why it matters:** it is operative but self referential. A counterparty's
  counsel will ask which state that is, and a court may find the clause
  uncertain if the entity's home state is disputed.
* **Confirm:** the state, and whether you want that state's law and courts or
  a negotiated alternative.
* **Edit:** replace the three references in `/terms` clause 23 with the named
  state. Note the public phone number on the site uses a South Carolina area
  code, which is a hint and not evidence of where the LLC is organised.

## 3. The default rights model  ← highest value decision

* **Drafted as:** **buyout**. Copyright in the commissioned score transfers to
  the production on full payment, as work made for hire where available and
  otherwise by present assignment, for the picture and all versions, all
  media, all territories, perpetuity. The composer retains the writer's share
  of public performance royalties, his PRO affiliation, credit, reel and
  portfolio use, and ownership of pre existing material. The publisher's share
  follows the grant. A soundtrack album release is separate.
* **Appears in:** `/licensing` sections 2, 3, 4, 5, 10; `/terms` clause 10;
  `/faq` questions 21 and 22; and, pre-existing, the homepage `FAQPage`
  schema ("full rights to the score") and the services section.
* **Why it matters:** this is the single most valuable clause on the site. It
  is consistent with the "full rights" claim the homepage already makes, but
  "full rights" is not a legal term and the buyout is a choice with real
  consequences: it is the industry norm for work for hire, and it gives away
  backend participation that an exclusive licence with a purchase option would
  keep alive.
* **Confirm:** buyout as default, or exclusive licence, or a step deal. Also
  decide whether the publisher's share should default to the production or
  stay with the composer, and whether the reel and portfolio right survives a
  buyout (drafted as yes, which is normal and worth protecting).
* **Edit if wrong:** `/licensing` section 2 and the options table in section 3,
  `/terms` clause 10, `/faq` question 21, and the homepage `FAQPage` answer in
  `index.html` if the "full rights" wording has to change too.

## 4. Money and schedule defaults

* **Drafted as:** 50 percent deposit and 50 percent on delivery of final
  stems; invoices due in 14 days; work pauses when overdue; a deposit is
  retained on cancellation with pro rata billing beyond it; a paused project
  holds its slot 30 days; two revision rounds per cue plus one consolidation
  pass; a 10 business day acceptance window with deemed acceptance; fees net
  in USD; withholding is the client's obligation.
* **Appears in:** `/terms` clauses 6, 7, 8, 9, 12; `/faq` questions 10, 11,
  16; each of these is marked on the page as a studio default.
* **Why it matters:** these are the numbers a client will hold the studio to,
  and they are the numbers the studio will have to enforce.
* **Confirm:** the split, the payment term, the kill fee treatment, the pause
  window, the revision allowance, the acceptance window. Also **name the
  accepted payment methods**, which was deliberately not invented: the
  documents say "the payment method is named on the invoice".
* **Edit:** `/terms` clauses 6 to 9 and the two matching FAQ answers.

## 5. Delivery specification

* **Drafted as:** stereo full mix, stems by instrumental family (four to
  eight), agreed alternate mixes, MP3 reference set, cue sheet, 24-bit WAV at
  48 kHz, stems printed from the head of the picture with matching timecode.
* **Appears in:** `/terms` clause 8; `/faq` question 17.
* **Confirm:** that this is what actually goes out, and whether 48 kHz is
  right for every delivery (some game and immersive work wants another rate).
* **Edit:** `/terms` clause 8, `/faq` question 17.

## 6. Retention periods

* **Drafted as:** inquiry correspondence 24 months after the project; project
  material and delivered files 12 months after; accounting records 7 years;
  edge request metadata governed by the host's own window.
* **Appears in:** `/privacy` section 8, referenced from `/terms` clause 8 and
  `/faq` question 32.
* **Why it matters:** these are commitments to delete, and an unmet one is a
  privacy breach rather than a typo. The 7 year accounting figure is a common
  US default but is not universal.
* **Confirm:** the periods against the studio's actual backup habit and the
  accountant's requirement. Then make the deletion real: if session data is
  not in fact deleted at 12 months, lengthen the number rather than publish a
  promise nobody keeps.
* **Edit:** `/privacy` section 8 table.

## 7. GDPR posture for EEA, UK and Swiss visitors

* **Drafted as:** honest and unvarnished: the studio is US established, has no
  EEA or UK establishment, has appointed no Article 27 representative and no
  DPO, and handles requests directly by email. Complaints go to the visitor's
  own supervisory authority.
* **Appears in:** `/privacy` sections 2 and 10.
* **Why it matters:** if the studio offers services to people in the EEA or
  the UK (it says "areaServed: Worldwide" in schema), Article 27 may require a
  named representative in the EU or UK. Publishing that none exists is
  accurate; it is not the same as being compliant.
* **Confirm:** whether EU or UK clients are actually served, and whether to
  appoint a representative (inexpensive services exist for exactly this).
* **Edit:** `/privacy` section 2, and the paragraph in section 10 that says no
  representative has been appointed.

## 8. Performing rights organisation and identifiers

* **Drafted as:** deliberately not published. `/licensing` section 8 says the
  PRO and IPI are supplied per project on the cue sheet, and explains that
  publishing a full IPI invites royalty fraud.
* **Appears in:** `/licensing` section 8; `/faq` question 24.
* **Confirm:** which PRO the composer is with, and whether to name it
  publicly (naming the PRO is normal and useful; the IPI is not).
* **Edit if you want it public:** add the PRO name to `/licensing` section 8.

## 9. Machine learning opt-out for the public catalogue

* **Drafted as:** a stated position (no commissioned cue is model generated;
  the grant does not licence the music for training; catalogue releases are
  licensed for use, not training) with **no technical enforcement applied**.
  `robots.txt` still reads `Allow: /` for everything.
* **Appears in:** `/licensing` section 11, `/terms` clause 17, `/faq`
  question 25.
* **Confirm:** whether to opt the site out of AI crawlers. This is a rights
  decision, so it was not made silently. A published policy without a robots
  signal is defensible; both together are stronger.
* **Edit if you want it:** append to `robots.txt`

  ```
  # Opt out of AI training crawlers. Published position: /licensing section 11
  User-agent: GPTBot
  Disallow: /
  User-agent: OAI-SearchBot
  Allow: /
  User-agent: ChatGPT-User
  Allow: /
  User-agent: ClaudeBot
  Disallow: /
  User-agent: Claude-SearchBot
  Allow: /
  User-agent: Google-Extended
  Disallow: /
  User-agent: CCBot
  Disallow: /
  User-agent: anthropic-ai
  Disallow: /
  User-agent: PerplexityBot
  Disallow: /
  ```

  Search bots are left allowed on purpose: being found is still worth more
  than being quoted. Blocking `Google-Extended` does not affect normal Google
  search ranking.

## 10. Catalogue licences  ← largest exposure in the store

* **Plug-in vault** ("World's Strangest Plug-in Mega-Vault", 200+ VSTs, $35+
  on Gumroad).
  * **Drafted as:** `/licensing` section 12 and `/purchases` section 7 say the
    archive is sold as an archive and that each instrument remains subject to
    its own developer licence.
  * **Why it matters:** redistributing discontinued third party instruments
    can breach those instruments' licences regardless of how the archive is
    described. This is the one item on the list that could produce a genuine
    complaint rather than an awkward email.
  * **Confirm:** that the vault's contents are freeware, abandonware the
    developers have released, or otherwise redistributable. If they are not,
    restructure the listing (links and installers rather than binaries) before
    the next sale.
* **Sound libraries** (Unholy Anatomy, Fault Codes, Galactic Requiem,
  Micro-Rupture, Forbidden Canticles).
  * **Drafted as:** use in your own productions including commercial work, no
    resale or redistribution, with each listing's own licence governing.
  * **Confirm:** that each itch.io and Gumroad listing actually states that
    licence. Where a listing is silent, the documents promise something the
    listing does not.
* **Physical items.**
  * **Drafted as:** dispatch, shipping and returns are "per listing" and under
    eBay's own terms, because no studio policy was in evidence.
  * **Confirm:** whether a consistent dispatch window and return window exist.
    If they do, state them in `/purchases` section 4; a buyer facing a real
    deadline values a number.

## 11. Liability, indemnity and disclaimer wording

* **Drafted as:** mutual limitation capped at fees paid for the project,
  excluding indirect loss, with carve-outs for confidentiality, indemnity,
  fraud and personal injury; a mutual indemnity; conspicuous all caps warranty
  disclaimers; and an express statement that nothing excludes rights that
  cannot lawfully be excluded. There is no arbitration clause and no class
  action waiver, deliberately.
* **Appears in:** `/terms` clauses 18, 19, 20.
* **Why it matters:** these are the clauses that get read after something goes
  wrong, and a cap set at "fees paid" is generous to the client compared with
  typical platform terms.
* **Confirm:** that the cap and the carve-outs are acceptable, ideally with a
  lawyer's eye. If the studio carries errors and omissions cover, the cap can
  be raised to the policy limit, which is a better position than it sounds.

## 12. Pre-existing site claims now sitting behind documents

Not changed by this work, flagged because the documents now give them weight:

* **Reviews.** The homepage shows a `5.0` rating with four quotes attributed
  to roles ("Independent Director", "Music Supervisor", "Festival Circuit",
  "Student Filmmaker"), repeated in `AggregateRating` and `Review` schema.
  Endorsement rules in the US and the UK require that testimonials be genuine
  and that any material connection be disclosed. Confirm the four are real,
  attributable quotes from real collaborators, and consider naming the
  productions or adding "names withheld at the collaborators' request" if
  that is the situation.
* **Public phone number.** `+1 (864) 430-0606` is published in the contact
  section and in `Person` and `LocalBusiness` schema, so it is scraped into
  directories. Confirm it is intended to be public and is not a personal line.
* **"Award-winning"** appears in the bio and schema, with a Winter 2024 award
  press release linked from the press section. Confirm the claim matches the
  award as granted.
* **DMCA.** No designated agent is claimed anywhere, which is correct: the
  site hosts no user generated content. If the store ever accepts uploads or
  user listings, register an agent with the US Copyright Office and add the
  details to `/terms` clause 25.

## 13. Accessibility statement

* **Drafted as:** WCAG 2.2 Level AA target, "partially conformant", with six
  named gaps and measured contrast ratios.
* **Confirm:** the gap list is accurate and that "partially conformant" is the
  claim you want to make publicly. It is the honest one.
* **Open item worth doing:** the accent red on `/` and `/store` is 3.49:1
  against the background, below AA for small text. The document pages already
  use `#e65650` at 5.71:1. Applying the same token to the portfolio and the
  store closes the largest open gap; it is a two file change
  (`index-ba4ce5d7.css` is generated, so the source repo is needed, plus
  `store-src/store.css`).

---

## Suggested order of work

1. Confirm the entity and its state (items 1, 2). Everything keys off them.
2. Decide the default rights model (item 3) and the money defaults (item 4).
3. Have a lawyer read `/terms` clauses 10, 19 and 23 (items 3, 11).
4. Check the plug-in vault's redistribution position (item 10) before the next
   sale.
5. Everything else at leisure; none of it blocks a commission.
