#!/usr/bin/env python3
"""Builds /lexicon/, the two scoring guides, and /press/."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sitegen import (DOMAIN, PERSON_ID, ORG_ID, SITE_ID, SAMEAS, abs_url, breadcrumb,
                     esc, graph_jsonld, hero_block, person_ref, org_ref, shell, write_page)

# ---------------------------------------------------------------------------
# THE LEXICON OF DREAD
# ---------------------------------------------------------------------------
# (slug, name, category, definition, deploy, hear_html)

TERMS = [
    ("drone", "Drone", "Texture",
     "A sustained tonal floor — one pitch or a slowly shifting cluster held until the room stops "
     "breathing. The drone does not signify danger; it signifies duration. It tells the audience the "
     "state they are in will not end on their schedule.",
     "Under any scene that must feel inevitable: the approach of something slow, a possession settling "
     "in, a town with a secret. The base layer beneath everything else.",
     "Hear it: <a href=\"/#showreel\">Ominous Drone</a> · <a href=\"/work/peregrinus/\">Peregrinus</a> · <a href=\"/work/phantom-requiem/\">Phantom Requiem</a>"),

    ("stinger", "Stinger", "Event",
     "A single violent accent — a viola-section stab, a metal impact, a burst of distorted sub — aligned "
     "to a cut. The cheapest tool in the kit and the most abused. A good stinger is a punctuation mark; "
     "a bad one is a jump-scare tax on the audience's trust.",
     "At true shock cuts only, and rarely: the reveal that recontextualizes a scene. Budget them like "
     "kills — one per act changes the blood algebra.",
     "Hear it: <a href=\"/#showreel\">Dissociative Amnesia</a> · <a href=\"/work/home-intruder/\">Home Intruder</a>"),

    ("sub-drop", "Sub-drop", "Event",
     "A pitch falling from the bottom of the mix into infra-bass, 30–60 Hz — less a sound than a change "
     "in air pressure. The chest registers it before the ears do. Where a stinger attacks from above, "
     "the sub-drop removes the floor from below.",
     "For moments of vertigo and inversion: the ground-less reveal, the betrayal, the moment a safe room "
     "stops being safe. Best when the image stays almost still.",
     "Hear it: <a href=\"/work/mike-has-a-visitor/\">Mike Has A Visitor</a> · <a href=\"/work/aquaphobia/\">AQUAPHOBIA</a>"),

    ("shepherd-tone", "Shepherd tone", "Structure",
     "An infinitely rising (or falling) scale built from overlapping octave layers — ascent that never "
     "arrives. In horror it produces anticipation with no permitted release: the audience climbs forever "
     "toward an event the music refuses to deliver.",
     "Through sequences of escalating threat — an investigation closing in, a ritual building — where "
     "you want pressure to compound without ever tipping into the expected payoff.",
     "Hear it: <a href=\"/#showreel\">Panic Threshold</a>"),

    ("bowed-metal", "Bowed metal", "Source",
     "A cello bow drawn across a tam-tam, cymbal, or sheet of steel: a shimmering, source-less bloom "
     "that seems to come from the walls themselves. The horror score's haunted air. Nobody can name the "
     "object making the sound, which is exactly why it works.",
     "For hauntings, presences, and rooms that are occupied without being visible. The sound of a "
     "surface vibrating in sympathy with something not shown.",
     "Hear it: <a href=\"/work/phantom-requiem/\">Phantom Requiem</a> · <a href=\"/work/unseen/\">UNSEEN</a>"),

    ("struck-strings", "Struck strings", "Source",
     "The string section treated as percussion — col legno battuto, hammered piano frames, body hits "
     "with mallets. The orchestra's voice replaced by its trauma: impact instead of song.",
     "For wrath and physical threat: revenge narratives, pursuers, body horror. Any score that needs "
     "the instruments themselves to look bruised.",
     "Hear it: <a href=\"/work/choleric/\">CHOLERIC</a>"),

    ("prepared-piano", "Prepared piano", "Source",
     "A piano with bolts, tape, rubber, and felt threaded between its strings. Every note arrives "
     "pre-corrupted: gamelan-gone-wrong, a familiar instrument speaking with something else's mouth.",
     "For broken childhoods, haunted domesticity, possessed instruments. The piano is the most trusted "
     "object in Western music — sabotaging it is always legible.",
     "Hear it: <a href=\"/#showreel\">Obsidian Hall</a>"),

    ("close-miked-breath", "Close-miked breath", "Source",
     "A performer's actual breath — intake, exhale, the click of the throat — recorded inches from the "
     "microphone and placed in the mix at skin distance. Intimacy weaponized: the audience has someone "
     "standing too close, and it is the soundtrack.",
     "Sleep paralysis, stalking, suffocation — anywhere proximity itself is the threat. Pairs with "
     "almost-still images.",
     "Hear it: <a href=\"/work/mike-has-a-visitor/\">Mike Has A Visitor</a> · <a href=\"/work/eclipsed/\">ECLIPSED</a>"),

    ("negative-space", "Negative space", "Structure",
     "Scored silence: the deliberate removal of music at the moment of maximum expected intensity. The "
     "mix empties, the audience leans in, and whatever the film does next happens inside the listener's "
     "own heightened hearing. Silence is the loudest cue in the package.",
     "Before reveals, inside grief, after the kill. Anywhere the temp score would have dropped a wall "
     "of sound — do the opposite.",
     "Hear it: <a href=\"/work/goodbye-brother/\">GOODBYE, BROTHER</a> · <a href=\"/work/expire/\">EXPIRE</a>"),

    ("motif-stalking", "Motif stalking", "Harmony",
     "A theme that returns across the film a half-step lower each time, or with one instrument missing, "
     "or re-voiced in the wrong register. The melody is the same; it is also being hunted. The audience "
     "tracks the corruption subconsciously the way they track a spreading infection.",
     "Across a full film or series: possession arcs, identity decay, a family curse compounding by "
     "generation or episode.",
     "Hear it: <a href=\"/work/the-haunted/\">The Haunted</a> · <a href=\"/work/peregrinus/\">Peregrinus</a>"),

    ("dissociative-harmony", "Dissociative harmony", "Harmony",
     "Pairings of instruments tuned slightly apart from each other — one a quarter-tone flat, one "
     "processed with slow drift — playing the same line. The self, out of tune with itself. It reads "
     "not as dissonance but as dissociation: the sound of a person coming apart at the seams.",
     "Unreliable narrators, doppelgängers, possession, memory horror. Anywhere two versions of one "
     "person share a frame.",
     "Hear it: <a href=\"/work/eclipsed/\">ECLIPSED</a> · <a href=\"/#showreel\">The Room Forgets You</a>"),

    ("psychophonic-bed", "Psychophonic bed", "Texture",
     "A rolling layer of scrapes, whisper-adjacent friction, and bowed queues that sits under scenes "
     "like inflammation — the sonic texture of a place that is quietly wrong. Not a melody, not an "
     "event: a condition.",
     "As the sustained floor for hauntings and slow-burn dread. The audience should stop hearing it "
     "and start feeling it — that's when it's working.",
     "Hear it: <a href=\"/#showreel\">Scraping Psychophonic Bed</a> · <a href=\"/work/unseen/\">UNSEEN</a>"),

    ("waterphone", "Waterphone", "Source",
     "The resonating steel-and-water instrument that has scored dread since the seventies: inharmonic "
     "whines that circle without resolving, like a cry heard through several walls. Familiar enough to "
     "read as 'horror' instantly — which is exactly the risk.",
     "Water adjacency, ritual, insanity edges. Use it once, deliberately, where its cliché-weight works "
     "for the scene — then keep it out of the film's vocabulary.",
     "Hear it: <a href=\"/#showreel\">Waterphone Shower Scene</a>"),

    ("hybrid-orchestration", "Hybrid orchestration", "Texture",
     "Strings, brass, and choir fused with granular synthesis, sub-frequency design, and processed "
     "field recordings until neither side is distinguishable. The modern horror orchestra is an "
     "organism, not a section: acoustic on the surface, wrong underneath.",
     "Default palette for contemporary psychological horror and thrillers — anywhere the film needs "
     "orchestral weight without orchestral nostalgia.",
     "Hear it: <a href=\"/work/home-intruder/\">Home Intruder</a> · <a href=\"/#showreel\">Deep Dystopian Synth Cue</a>"),

    ("granular-texture", "Granular texture", "Texture",
     "A single sound — one note, one breath, one scream — shattered into a thousand particles and "
     "smeared into a cloud that hangs in the air. Source and time both dissolve; the audience hears "
     "something that used to be an object.",
     "Memory horror, cosmic dread, decomposition. Where the film needs matter itself to be unreliable.",
     "Hear it: <a href=\"/#showreel\">Bone-Colored Air</a>"),

    ("tape-degradation", "Tape degradation", "Texture",
     "Saturation, wow and flutter, dropouts, hiss — the sound of a recording aging against its will. "
     "Themes played through it arrive already nostalgic and already rotting: memory as a losing format.",
     "Grief pieces, found-footage dread, folk horror with period texture. Anywhere the past is the "
     "danger.",
     "Hear it: <a href=\"/work/goodbye-brother/\">GOODBYE, BROTHER</a> · <a href=\"/#showreel\">Time Shifting Into Daylight</a>"),

    ("pulse-engine", "Pulse engine", "Structure",
     "A narrow ostinato — heartbeat, engine, ticking — held at a fixed tempo while everything above it "
     "escalates. The pulse never speeds up; the pressure does. The audience's own heart tries to match "
     "it and cannot, which is the trap.",
     "Chases, paralysis, obsession. Any sequence where the horror is that something will not change "
     "fast enough.",
     "Hear it: <a href=\"/#showreel\">Narrow Pulse</a> · <a href=\"/work/mike-has-a-visitor/\">Mike Has A Visitor</a>"),

    ("cluster-voicing", "Cluster voicing", "Harmony",
     "Adjacent-note tone clusters, string glissandi through whole registers, the orchestral techniques "
     "of the Penderecki lineage: harmony as mass rather than as chord. It produces the sound of a room "
     "full of people agreeing about the wrong thing.",
     "Collective dread — cults, congregations, institutions; also interior collapse scored as "
     "constriction rather than explosion.",
     "Hear it: <a href=\"/work/whispers-in-the-dark/\">Whispers In The Dark</a> · <a href=\"/#showreel\">R'lyeh's Xenolith</a>"),

    ("whisper-choir", "Whisper choir", "Source",
     "Voices at the edge of speech: sung whispers, breath consonants, sibilance pitched into harmony. "
     "The choir as congregation of the almost-said. Language sits one inch under the surface and never "
     "resolves into words.",
     "Guilt-horror, hallucination, possession — anywhere the antagonist is a voice in the head with "
     "perfect diction.",
     "Hear it: <a href=\"/work/whispers-in-the-dark/\">Whispers In The Dark</a> · <a href=\"/#showreel\">Screams of The Damned</a>"),

    ("folk-detune", "Folk detune", "Harmony",
     "Lullabies, rounds, and hymn fragments played on folk materials but pulled out of equal "
     "temperament — just-intonation thirds that don't close, drones under melodies that were never "
     "meant to have them. Comfort with the map wrong.",
     "Folk horror, cult settings, rural dread. The music of a community that learned its songs from "
     "somewhere else.",
     "Hear it: <a href=\"/work/peregrinus/\">Peregrinus</a>"),

    ("ritual-pulse", "Ritual pulse", "Structure",
     "Processional percussion at walking tempo — staff strikes, footsteps, hand drums — that gives a "
     "scene liturgy instead of momentum. The audience is marched rather than chased, which makes the "
     "destination worse.",
     "Ceremonies, pilgrimages, processions of any kind; series-long journeys where dread accumulates "
     "per episode.",
     "Hear it: <a href=\"/work/peregrinus/\">Peregrinus</a>"),

    ("diegetic-bleed", "Diegetic bleed", "Structure",
     "The deliberate collapse of the border between the film's world and its score: radio static that "
     "resolves into strings, room tone that turns out to be tuned, source music that keeps playing "
     "after its device is gone. The score pretends to live inside the house.",
     "Unreliable reality, hauntings, techno-thrillers — anywhere the film needs the audience to stop "
     "trusting the wall between screen and room.",
     "Hear it: <a href=\"/work/home-intruder/\">Home Intruder</a> · <a href=\"/#showreel\">Quarter-Eater Poltergeist</a>"),

    ("corrupted-innocence", "Corrupted innocence", "Source",
     "Music boxes, toy pianos, nursery lines, children's choirs — innocence as a threat register. The "
     "device is as old as the genre because it is structural: the audience's protective reflex is "
     "hijacked and made load-bearing for dread.",
     "Creepy children, cursed toys, lullaby-twisted reveals. Deploy with restraint: one clean "
     "statement, then corruption.",
     "Hear it: <a href=\"/work/the-haunted/\">The Haunted</a> · <a href=\"/#showreel\">Opaline Lament (Life From The Beyond)</a>"),

    ("riser-abstinence", "Riser abstinence", "Structure",
     "The refusal to deliver the expected pre-scare riser. Where every trailer in the audience's memory "
     "provides a whoosh-and-swell, the score holds water — and the cut lands dry. Anticlimax, weaponized: "
     "the absence trains the audience to fear the score's silence more than its noise.",
     "Over the mid-film scare cycle, to reset an audience that has started predicting the music. Also "
     "the correct default for elevated horror.",
     "Hear it: <a href=\"/work/expire/\">EXPIRE</a> — sound design holds; the score refuses to flinch"),
]


def lexicon_page():
    path = "/lexicon/"
    body = [hero_block(
        [("Lexicon", None)],
        "The Lexicon of Dread",
        "How horror scores <span class=\"italic-blood\">actually work.</span>",
        "Twenty-four techniques, named and documented — the working vocabulary of atmospheric dread. "
        "No mystical language, no gatekeeping: this is what the knobs do to the nervous system, and "
        "when to reach for each one."
    )]

    body.append('<section class="section"><div class="wrap">')
    body.append('<div class="lex-index">')
    for slug, name, *_ in TERMS:
        body.append(f'<a href="#{slug}">{esc(name)}</a>')
    body.append('</div><div style="height:2rem"></div>')

    body.append('<div class="lex-grid">')
    for slug, name, cat, definition, deploy, hear in TERMS:
        body.append(f"""
<article class="term" id="{slug}">
  <p class="tag">{esc(cat)}</p>
  <h2><a href="#{slug}">{esc(name)}</a></h2>
  <p>{definition}</p>
  <p><strong style="color:var(--bone)">Deploy it:</strong> {deploy}</p>
  <p class="hear">{hear}</p>
</article>""")
    body.append("</div>")

    body.append("""
<div class="pull" style="margin-top:3rem">Every term on this page is load-bearing in the
<a href="/" style="color:var(--bone);border-bottom:1px solid var(--blood)">showreel</a> and the
<a href="/work/" style="color:var(--bone);border-bottom:1px solid var(--blood)">films</a>.
If your project needs a specific nervous-system response, name the technique —
<a href="/#contact" style="color:var(--bone);border-bottom:1px solid var(--blood)">the inquiry starts there</a>.</div>""")
    body.append("</div></section>")

    ld = [
        breadcrumb([("Lexicon", None)]),
        {
            "@type": "WebPage",
            "@id": abs_url(path),
            "url": abs_url(path),
            "name": "The Lexicon of Dread — Horror Scoring Techniques",
            "description": "A working glossary of horror film scoring techniques: drones, stingers, sub-drops, bowed metal, whisper choirs, motif stalking, and the craft of atmospheric dread.",
            "isPartOf": {"@id": SITE_ID},
            "dateModified": "2026-09-16",
            "inLanguage": "en",
            "author": person_ref(),
        },
        {
            "@type": "DefinedTermSet",
            "@id": abs_url(path) + "#termset",
            "name": "The Lexicon of Dread: Horror Scoring Techniques",
            "description": "Twenty-four documented techniques of atmospheric horror scoring.",
            "url": abs_url(path),
            "hasDefinedTerm": [
                {"@type": "DefinedTerm", "name": name, "termCode": slug,
                 "description": definition[:280], "url": abs_url(path) + "#" + slug}
                for slug, name, cat, definition, deploy, hear in TERMS
            ],
            "author": person_ref(),
        },
    ]

    return shell(path=path,
                 title="The Lexicon of Dread — Horror Scoring Techniques | Zazie",
                 description=("A working glossary of horror film scoring techniques from composer Zazie "
                              "Kanwar-Torge: drones, stingers, sub-drops, bowed metal, whisper choirs, motif "
                              "stalking, and how atmospheric dread is engineered."),
                 h1_html="", body="\n".join(body), ld_graph=ld, current_nav="lexicon")


# ---------------------------------------------------------------------------
# GUIDE 1 — COST
# ---------------------------------------------------------------------------

COST_FAQ = [
    ("How much does a 10-minute horror short cost to score?",
     "A ten-minute short at Standard intensity lands roughly in the $2,500–$4,000 range: full cue "
     "architecture, original themes, picture-locked delivery. If the budget genuinely cannot reach that, "
     "the micro/student tier exists — name your price from $50 — and the scope is negotiated honestly "
     "against what the film actually needs."),
    ("What's included in a score fee?",
     "Original composition written to picture, cue-by-cue spotting, revisions through the agreed cycle, "
     "final mixes, and delivery in the formats the edit needs. Stems, alternate mixes, extended theme "
     "suites, and rush delivery are line items — priced openly, never discovered later."),
    ("Why not just use library or stock horror music?",
     "Because audiences can feel the seam. Library cues are written to be generic; your scene is "
     "specific. Stock music also carries licensing risk — sync rights vary by cue, and a festival or "
     "streaming pickup can turn a $30 license into a legal problem. An original score is work-for-hire "
     "clean, and it is the only music that hits your cut exactly."),
    ("Do rates change for festivals vs. streaming releases?",
     "Rights and distribution plans shape the quote, not festival dreams. A festival short and a "
     "streaming feature are different scopes — runtime, cue count, and delivery. If a film gets "
     "acquired after delivery, that is what buyout options are for."),
    ("How far in advance should I book a composer?",
     "Ideally at script or rough-cut stage: spotting works best before picture lock hardens. Production "
     "scores of 30+ minutes typically want 4–8 weeks of runway; a teaser or scene cue can turn around in "
     "days (rush fees apply)."),
    ("Is the $50 micro tier real?",
     "Yes — student films, festival experiments, and films the composer believes in. It is name-your-price "
     "from $50, scoped honestly: you get real composition, not a royalty-free loop with a reverb on it. "
     "The trade is calendar flexibility and a leaner cue count."),
]


def cost_guide():
    path = "/guides/horror-film-score-cost/"
    body = [hero_block(
        [("Guides", None), ("Cost", None)],
        "Director's guide · scoring budgets",
        "What a horror film score <span class=\"italic-blood\">actually costs.</span>",
        "Real numbers, real scopes — the pricing logic of a working horror scoring studio, published "
        "openly so you can budget before you ever send the email."
    )]

    body.append("""<section class="section"><div class="wrap"><div class="prose">
<p>Every scoring conversation eventually arrives at the same sentence said carefully: <em>"What does
this usually cost?"</em> Here is the answer without the careful voice. These are the working rates of
Zazie Productions — where the floors are, what moves the number, and where the money goes.</p>

<h2 class="display" style="font-size:1.9rem">The rate card</h2>
<table class="tbl">
<thead><tr><th>Project type</th><th>Scope</th><th class="num">From</th></tr></thead>
<tbody>
<tr><td>Micro / student / low-budget</td><td>Name your price — real composition, lean scope</td><td class="num">$50</td></tr>
<tr><td>Short film score</td><td>Full cue architecture: themes, beds, picture-locked atmosphere</td><td class="num">$2,500</td></tr>
<tr><td>Game / interactive score</td><td>Adaptive loops, layers, dread that responds to play</td><td class="num">$4,500</td></tr>
<tr><td>Fully custom score</td><td>You define the musical scope; honest estimate, no padding</td><td class="num">$3,000</td></tr>
<tr><td>Feature / episode score</td><td>Full cinematic partnership: themes, cues, stems, delivery</td><td class="num">$8,000</td></tr>
</tbody>
</table>

<h2 class="display" style="font-size:1.9rem">What actually moves the number</h2>
<ul>
<li><strong>Scored minutes.</strong> The honest unit of scoring work. A 12-minute short and a 90-minute
feature are different professions' worth of cue writing, spotting, and mixing.</li>
<li><strong>Intensity tier.</strong> <em>Lean</em> is a focused cue set. <em>Standard</em> is the full
atmospheric palette. <em>Signature</em> is a bespoke musical world. <em>Orchestral+</em> brings large
hybrid forces. Same film, four different weights of gravity.</li>
<li><strong>Cue count.</strong> Fifteen cues at ninety seconds each is a different animal than five
six-minute beds — spot work, edit alignment, and revision surface area all scale with it.</li>
<li><strong>Rights.</strong> Standard delivery covers your film's use. Exclusive buyouts, sequel
options, and trailer rights are separate — because they are separate value.</li>
<li><strong>Clock.</strong> Delivery inside ten days adds $1,500. Panic has a surcharge; the music
shouldn't sound like it was made in one.</li>
</ul>

<h2 class="display" style="font-size:1.9rem">Add-ons, priced in daylight</h2>
<table class="tbl">
<thead><tr><th>Add-on</th><th>What it is</th><th class="num">Fee</th></tr></thead>
<tbody>
<tr><td>Rush delivery</td><td>Full score in under 10 days</td><td class="num">+$1,500</td></tr>
<tr><td>Full stem / mix package</td><td>Every cue delivered as separable stems</td><td class="num">+$600</td></tr>
<tr><td>Extended theme suite</td><td>Main themes as standalone tracks for marketing</td><td class="num">+$900</td></tr>
<tr><td>Extra spotting sessions</td><td>Additional remote cue-by-cue walkthroughs</td><td class="num">+$750</td></tr>
<tr><td>Exclusive buyout</td><td>Full ownership transfer of the score</td><td class="num">+$2,500</td></tr>
<tr><td>Alt mixes &amp; tension variants</td><td>Alternate versions for recuts and trailers</td><td class="num">+$800</td></tr>
</tbody>
</table>

<h2 class="display" style="font-size:1.9rem">The $50 tier is not a trick</h2>
<p>Student films and micro-budget shorts can genuinely name their price from $50. The reasoning is
commercial, not charitable: every festival short scored well is a director who remembers who was in
the trench with them. The scope adjusts — fewer cues, leaner intensity — but what arrives is original
composition written to <em>your</em> picture, not a royalty-free pack with reverb on it. The tier has
produced features' scoring relationships. That is the business model.</p>

<h2 class="display" style="font-size:1.9rem">How a quote actually forms</h2>
<ol>
<li>You send format, runtime, timeline, and budget — the <a href="/#contact">inquiry form</a> does this
in ninety seconds.</li>
<li>You get a scoped estimate back: project type, scored minutes, intensity tier, add-ons — with a
midpoint and a range, in writing.</li>
<li>Spotting happens (remote, cue by cue). The estimate becomes a fixed quote.</li>
<li>Music gets written to picture. You hear cues in context, revision cycles run, picture-locked
deliverables land.</li>
</ol>
<p>Estimates guide planning; final quotes depend on cue count, rights, and delivery date. Composition
and scoring only — production sound and foley are a different craft.</p>
    </div>""")

    # FAQ
    body.append('<div style="height:2.5rem"></div>')
    body.append('<h2 class="display" style="font-size:1.9rem;margin-bottom:1rem">Score cost FAQ</h2>')
    body.append('<div class="faq">')
    for q, a in COST_FAQ:
        body.append(f'<details><summary>{esc(q)}</summary><div class="a">{a}</div></details>')
    body.append("</div>")

    body.append("""
<div class="btn-row"><a class="btn btn-blood" href="/#contact">Get a scoped quote</a>
<a class="btn btn-ghost" href="/work/">Watch the scores first</a></div>
</div></section>""")

    ld = [
        breadcrumb([("Guides", "/guides/horror-film-score-cost/"), ("Cost", None)]),
        {
            "@type": "Article",
            "@id": abs_url(path) + "#article",
            "headline": "What a Horror Film Score Actually Costs: Rates, Scopes, and Real Numbers",
            "description": "Horror film scoring costs explained by a working composer: rate card from $50 micro-budget to $8,000 features, what moves the price, add-on pricing, and how quotes are built.",
            "author": person_ref(),
            "publisher": org_ref(),
            "datePublished": "2026-09-16",
            "dateModified": "2026-09-16",
            "image": abs_url("/images/hero-portrait.jpg"),
            "mainEntityOfPage": abs_url(path),
            "inLanguage": "en",
            "articleSection": "Film Scoring",
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q,
                 "acceptedAnswer": {"@type": "Answer", "text": a}}
                for q, a in COST_FAQ
            ],
        },
    ]

    return shell(path=path,
                 title="How Much Does a Horror Film Score Cost? 2026 Rates",
                 description=("Horror film scoring costs, published plainly: from $50 micro-budget shorts to "
                              "$8,000+ features. Rate card, add-on pricing, what moves the number, and how to "
                              "budget an original score."),
                 h1_html="", body="\n".join(body), ld_graph=ld,
                 og_type="article")


# ---------------------------------------------------------------------------
# GUIDE 2 — HIRING
# ---------------------------------------------------------------------------

HIRE_FAQ = [
    ("When should I bring a composer onto a horror film?",
     "Before picture lock if you can. Spotting with a composer while the cut is still soft lets the "
     "score shape rhythm — a held silence can replace a fix in the edit. At absolute latest: as soon as "
     "picture lock is real, with a realistic delivery window attached."),
    ("What should I send a composer before they quote?",
     "Four things: the cut (or a scene), the runtime, the deadline, and your tone — three references you "
     "love and, just as useful, one anti-reference you hate. A temp score is optional; know its risks "
     "before you fall in love with it."),
    ("Is temp music a good idea?",
     "As a communication tool, sometimes. As a target, it is a trap: the temp becomes the film's memory "
     "of itself, and every original cue gets measured against music written for a different picture. If "
     "you use temp, use it loosely — mood, not melody."),
    ("How long does scoring take?",
     "A scene cue or teaser: days. A short film: two to four weeks including spotting and revisions. A "
     "feature: four to eight weeks of composition and delivery. Rush timelines are possible and priced "
     "openly (see the cost guide)."),
    ("Who owns the score?",
     "Standard delivery licenses the score for your film's use, with the composer retaining composition "
     "credit and catalog. Full buyouts are available as a line item. Either way it is in writing before "
     "work begins — credits, rights, and cue sheet included."),
    ("What deliverables should I expect?",
     "Picture-locked final mixes in your edit's formats; stems and alt mixes as agreed add-ons; a cue "
     "sheet for PRO and distribution; and clean file naming your sound team won't curse. If a composer "
     "is vague about deliverables, that is the interview answer."),
]


def hire_guide():
    path = "/guides/hire-a-horror-composer/"
    body = [hero_block(
        [("Guides", None), ("Hiring", None)],
        "Director's guide · the working relationship",
        "How to hire a horror film composer <span class=\"italic-blood\">without losing the nerve.</span>",
        "The complete process from first email to final stem: when to bring a composer in, what to send, "
        "how spotting works, and the red flags that predict a generic score."
    )]

    body.append("""<section class="section"><div class="wrap"><div class="prose">
<p>Horror is the most musically dependent genre in film. Comedy survives a flat score; horror does not.
The atmosphere your film promised in the pitch lives substantially in the music — which makes hiring
the composer the most consequential creative decision after the cast. Here is the whole process, from
the director's chair, with nothing held back.</p>

<h2 class="display" style="font-size:1.9rem">1. When to bring the composer in</h2>
<p>The industry default — composer after picture lock — is a budget compromise, not a creative one.
Bring the composer in at <strong>rough cut</strong> when possible: spotting before lock lets music and
edit negotiate. Half the dread in a great horror scene is a held silence the film would have cut. At
minimum, lock a delivery window that assumes composition takes weeks, not days, and protect one
revision cycle after the first full pass.</p>

<h2 class="display" style="font-size:1.9rem">2. The brief that gets you a real score</h2>
<ul>
<li><strong>Three references you love</strong> — specific cues, not films. "The pool scene" beats
"like It Follows."</li>
<li><strong>One anti-reference.</strong> What would ruin it. Negative space in a brief saves revision
cycles.</li>
<li><strong>The emotional map.</strong> Where the audience should lean in, hold breath, or break. Story
beats are not enough — say where the <em>body</em> responds.</li>
<li><strong>Constraints that are real.</strong> Festival premiere dates, streaming deliverable specs,
rating boundaries. Composers can work with truth, not with surprises.</li>
</ul>

<h2 class="display" style="font-size:1.9rem">3. Spotting, the session that decides everything</h2>
<p>Spotting is the cue-by-cue walkthrough where you and the composer decide what music happens where —
and, more importantly, where it doesn't. A good spotting produces a cue list with intentions ("hold
the drone until the door opens, then nothing"). A bad spotting produces vibes. Demand specifics; give
them. This is also where negative space gets planned: the score's silences are composed as surely as
its notes.</p>

<h2 class="display" style="font-size:1.9rem">4. Revisions without death by a thousand notes</h2>
<p>Score feedback works best in the score's language, but you shouldn't need to speak it — describe the
feeling and the moment ("the reveal lands too early, the comfort lasts a beat too long") and let the
composer translate. What kills scores is note-level direction from memory of the temp track. What
makes them: honest reactions in context, at full volume, on the same schedule.</p>

<h2 class="display" style="font-size:1.9rem">5. Deliverables &amp; rights, decided up front</h2>
<p>Before work begins, in writing: final mixes and formats, stem packages, alt mixes for trailers and
recuts, the cue sheet, and the rights structure — license vs. buyout. The <a
href="/guides/horror-film-score-cost/">cost guide</a> lists how these are priced here. There is no
version of this where vagueness helps you.</p>

<h2 class="display" style="font-size:1.9rem">Red flags in either direction</h2>
<ul>
<li><strong>In a composer:</strong> no questions about the film, promises of unlimited revisions,
delivery timelines that insult the craft, a portfolio of cues that all sound like the same queue of
presets.</li>
<li><strong>In a production:</strong> temp-score worship, spot decisions by committee after each
viewing, and the phrase "we'll fix it in the mix." Both lists are short because both failures are
common.</li>
</ul>

<h2 class="display" style="font-size:1.9rem">What working with this studio looks like</h2>
<p>Inquiry with format, runtime, timeline, budget → scoped estimate in writing → remote spotting,
cue by cue → cues delivered in context through an agreed revision cycle → picture-locked finals,
stems, cue sheet. The aesthetic contract is on every page of this site: <a href="/">dark, atmospheric
scores written to your picture</a> — psychological architecture, dark atmospheric color, and themes
that survive the parking lot test.</p>
    </div>""")

    body.append('<div style="height:2.5rem"></div>')
    body.append('<h2 class="display" style="font-size:1.9rem;margin-bottom:1rem">Hiring FAQ</h2>')
    body.append('<div class="faq">')
    for q, a in HIRE_FAQ:
        body.append(f'<details><summary>{esc(q)}</summary><div class="a">{a}</div></details>')
    body.append("</div>")

    body.append("""
<div class="btn-row"><a class="btn btn-blood" href="/#contact">Start the conversation</a>
<a class="btn btn-ghost" href="/lexicon/">Learn the vocabulary first</a></div>
</div></section>""")

    ld = [
        breadcrumb([("Guides", "/guides/hire-a-horror-composer/"), ("Hiring", None)]),
        {
            "@type": "Article",
            "@id": abs_url(path) + "#article",
            "headline": "How to Hire a Horror Film Composer: The Director's Complete Guide",
            "description": "How to hire a horror film composer: when to bring them on, the brief that works, spotting sessions, revisions, deliverables, rights, and the red flags on both sides.",
            "author": person_ref(),
            "publisher": org_ref(),
            "datePublished": "2026-09-16",
            "dateModified": "2026-09-16",
            "image": abs_url("/images/hero-portrait.jpg"),
            "mainEntityOfPage": abs_url(path),
            "inLanguage": "en",
            "articleSection": "Film Scoring",
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q,
                 "acceptedAnswer": {"@type": "Answer", "text": a}}
                for q, a in HIRE_FAQ
            ],
        },
    ]

    return shell(path=path,
                 title="How to Hire a Horror Film Composer — Director's Guide",
                 description=("The complete process of hiring a horror film composer: timing, the brief, "
                              "spotting sessions, revisions, deliverables, and rights — from a working "
                              "psychological horror composer."),
                 h1_html="", body="\n".join(body), ld_graph=ld,
                 og_type="article")


# ---------------------------------------------------------------------------
# PRESS KIT
# ---------------------------------------------------------------------------

def press_page():
    path = "/press/"
    body = [hero_block(
        [("Press", None)],
        "Press kit · Zazie Kanwar-Torge / Zazie Productions LLC",
        "The facts, <span class=\"italic-blood\">for print.</span>",
        "Bios, photos, credits, and coverage — everything a journalist, festival, or producer needs, "
        "cleared for publication."
    )]

    body.append("""<section class="section"><div class="wrap"><div class="prose">
<h2 class="display" style="font-size:1.9rem">Short bio (50 words)</h2>
<p>Zazie Kanwar-Torge is an award-winning composer, experimental producer, and multi-instrumentalist.
Under Zazie Productions, he writes and performs original scores for psychological, folk, and body
horror, supernatural thrillers, and dark science fiction — for film, TV, and games.</p>

<h2 class="display" style="font-size:1.9rem">Long bio (150 words)</h2>
<p>Zazie Kanwar-Torge is an award-winning composer, experimental producer, and multi-instrumentalist
known for striking, unconventional scores and sound worlds. Raised in North Carolina and performing
and releasing work under Zazie Productions LLC, he has built a reputation for turning complex ideas
into distinctive sonic signatures across film, television, games, and contemporary art.</p>
<p>His scoring palette combines struck strings, bowed metal, hybrid orchestration, and custom
synths — slow-burn dread beds, dissociative harmony, and themes designed to stalk a film from its
first act to its festival cut. Selected credits include <em>Mike Has A Visitor</em> (Marco Saikaley),
<em>The Haunted</em> (Crystal Fox Films), <em>Whispers In The Dark</em> (Cue Tube's 2024 Halloween
special), <em>CHOLERIC</em> (Sebastian Fabres), and sound design on the festival short <em>EXPIRE</em>
(Muhammad Abed Baryal). His underground releases and the satirical viral project
@WellMeaningNeurotypicals (28k followers, 10M+ views) extend the same boundary-pushing instinct.</p>

<h2 class="display" style="font-size:1.9rem">Selected coverage</h2>
<ul>
<li><a href="https://billboardwire.com/how-an-underground-experimental-musician-became-a-go-to-composer-for-psychological-horror/" target="_blank" rel="noopener">Billboard Wire</a> —
"How an Underground Experimental Musician Became a Go-To Composer for Psychological Horror"</li>
<li><a href="https://limitless-magazine.com/2026/06/12/forget-asmr-zazie-productions-will-rewire-your-whole-nervous-system/" target="_blank" rel="noopener">Limitless Magazine</a> —
"Forget ASMR. This Will Rewire Your Whole Nervous System" (June 2026)</li>
<li><a href="https://grammyweekly.com/zazie-productions-the-underground-polymath-redefining-experimental-music/" target="_blank" rel="noopener">Grammy Weekly</a> —
"The Underground Polymath Redefining Experimental Music"</li>
<li><a href="https://www.visualcontainer.tv/wp-content/uploads/2025/01/Winter-2024-Award-Winners_Press-Release.pdf" target="_blank" rel="noopener">Visual Container</a> —
Winter 2024 Award Winners press release (PDF)</li>
</ul>

<h2 class="display" style="font-size:1.9rem">Photos</h2>
<p>Click to open the full-resolution file; publication credit "Zazie Productions".</p>
    </div>
<div class="grid grid-3" style="margin-top:1.5rem">
<a class="workcard" href="/images/hero-portrait.jpg" target="_blank" rel="noopener">
  <span class="frame"><img src="/images/hero-portrait.jpg" alt="Zazie Kanwar-Torge, psychological horror composer — press portrait" loading="lazy"/></span>
  <h3>Hero portrait</h3><p class="meta">JPG · 896×1152</p>
</a>
<a class="workcard" href="/images/headshot.jpg" target="_blank" rel="noopener">
  <span class="frame"><img src="/images/headshot.jpg" alt="Zazie Kanwar-Torge headshot — press photo" loading="lazy"/></span>
  <h3>Headshot</h3><p class="meta">JPG · 864×996</p>
</a>
<a class="workcard" href="/images/press-photo.png" target="_blank" rel="noopener">
  <span class="frame"><img src="/images/press-photo.png" alt="Zazie Productions press photo" loading="lazy"/></span>
  <h3>Press photo</h3><p class="meta">PNG · 680×736</p>
</a>
</div>

<div class="prose" style="margin-top:3rem">
<h2 class="display" style="font-size:1.9rem">Credits at a glance</h2>
<ul>
<li><strong>Mike Has A Visitor</strong> — sleep paralysis horror short (dir. Marco Saikaley) · composer</li>
<li><strong>The Haunted</strong> — psychological thriller feature, teaser score (dir. Mike Fox, Crystal Fox Films) · composer</li>
<li><strong>Whispers In The Dark</strong> — Cue Tube 2024 Halloween special · composer</li>
<li><strong>AQUAPHOBIA</strong> — short horror film · composer &amp; sound design</li>
<li><strong>GOODBYE, BROTHER</strong> — dramatic short · composer</li>
<li><strong>Home Intruder</strong> — official car chase scene · composer &amp; sound design</li>
<li><strong>Phantom Requiem</strong> — experimental short · composer, director, sound design</li>
<li><strong>EXPIRE</strong> (2025, dir. Muhammad Abed Baryal) · sound design — <a href="https://www.imdb.com/title/tt19369318/" target="_blank" rel="noopener">IMDb</a></li>
<li><strong>CHOLERIC</strong> (dir. Sebastian Fabres) · composer &amp; producer — <a href="https://www.imdb.com/title/tt38637541/" target="_blank" rel="noopener">IMDb</a></li>
<li><strong>ECLIPSED</strong> (dir. William Viera) · feature score credit</li>
<li><strong>UNSEEN</strong> (dir. Steve Merlo) · additional score — feature</li>
<li><strong>PEREGRINUS</strong> · series score credit</li>
</ul>
<p>Full filmography: <a href="/work/">works &amp; credits</a> ·
<a href="https://www.imdb.com/name/nm17333332" target="_blank" rel="noopener">IMDb profile</a></p>

<h2 class="display" style="font-size:1.9rem">Contact</h2>
<p>Scoring &amp; press inquiries: <a href="mailto:zaziediya@gmail.com">zaziediya@gmail.com</a> ·
<a href="tel:+18644300606">+1 (864) 430-0606</a><br/>
Zazie Productions LLC · replies within 48 hours.</p>
    </div>
</div></section>""")

    person_full = {
        "@type": "Person",
        "@id": PERSON_ID,
        "name": "Zazie Kanwar-Torge",
        "alternateName": "Zazie Productions",
        "url": DOMAIN + "/",
        "image": abs_url("/images/headshot.jpg"),
        "jobTitle": "Horror Film Composer",
        "description": "Award-winning composer, experimental producer, and multi-instrumentalist specializing in dark, atmospheric, cinematic scores for psychological horror, supernatural thrillers, folk horror, body horror, and dark science fiction.",
        "email": "mailto:zaziediya@gmail.com",
        "telephone": "+1-864-430-0606",
        "worksFor": org_ref(),
        "sameAs": SAMEAS,
    }
    ld = [
        breadcrumb([("Press", None)]),
        {
            "@type": "ProfilePage",
            "@id": abs_url(path),
            "url": abs_url(path),
            "name": "Press Kit — Zazie Kanwar-Torge, Psychological Horror Composer",
            "description": "Press kit: bios, photos, credits, and coverage for Zazie Kanwar-Torge / Zazie Productions.",
            "isPartOf": {"@id": SITE_ID},
            "dateModified": "2026-09-16",
            "inLanguage": "en",
            "about": person_full,
            "mainEntity": person_full,
        },
    ]

    return shell(path=path,
                 title="Press Kit — Zazie Kanwar-Torge, Horror Composer",
                 description=("Official press kit for Zazie Kanwar-Torge / Zazie Productions: short and long "
                              "bios, downloadable photos, selected credits, press coverage, and contact for "
                              "journalists and festivals."),
                 h1_html="", body="\n".join(body), ld_graph=ld)


def main():
    write_page("/lexicon/index.html", lexicon_page())
    write_page("/guides/horror-film-score-cost/index.html", cost_guide())
    write_page("/guides/hire-a-horror-composer/index.html", hire_guide())
    write_page("/press/index.html", press_page())


if __name__ == "__main__":
    main()
