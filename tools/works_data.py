"""Case-study content for the twelve scored works. Facts sourced from the
site's own credits, IMDb (nm17333332 / tt19369318 / tt38637541 / tt37707793),
Stage 32 profile, and the public YouTube uploads of each piece."""

WORKS = [
    # ------------------------------------------------------------------
    dict(
        slug="mike-has-a-visitor",
        title="Mike Has A Visitor",
        kicker="Original score · Sleep paralysis horror short",
        kind="Short film",
        year="2025",
        director="Marco Saikaley",
        role="Composer",
        imdb=None,
        youtube="HaVJP08j77U",
        upload_date="2025-06-30",
        duration="PT14M23S",
        thumb="/images/project-HaVJP08j77U.jpg",
        poster="/images/posters/mike-has-a-visitor.jpg",
        poster_alt="Mike Has A Visitor poster, a sleep paralysis horror short by Marco Saikaley, scored by Zazie Kanwar-Torge",
        lede="A sleep paralysis short scored for a body that cannot move — and the visitor who knows it.",
        brief=(
            "Marco Saikaley's fourteen-minute short lives inside the most intimate horror premise there is: "
            "the mind wakes, the body does not, and something in the room has been waiting for exactly that "
            "imbalance. The visitor is never allowed to become a monster. It stays a presence."
        ),
        approach=[
            ("The paralysis is the instrument",
             "The score is built on a locked, narrow pulse — a heartbeat that cannot accelerate no matter "
             "what enters the frame. Panic wants tempo; paralysis forbids it. Keeping the pulse mechanically "
             "constant while the arrangement thickens makes the audience feel the body's betrayal before any "
             "image explains it."),
            ("Proximity over volume",
             "The visitor's cues are written at whisper distance: close-miked breath, dry brushed texture, "
             "room tone that is slightly too present. Nothing swells. Dread at three inches is worse than "
             "dread at thirty feet."),
            ("The floor gives way twice",
             "Two sub-drop events anchor the film's worst moments — pitch falling out from under the mix "
             "rather than a stinger on top of it. The cut stays still; the earth moves."),
        ],
        techniques=[
            ("pulse-engine", "Pulse engine"),
            ("close-miked-breath", "Close-miked breath"),
            ("negative-space", "Negative space"),
            ("sub-drop", "Sub-drop"),
            ("diegetic-bleed", "Room-tone wrongness"),
        ],
        closing=(
            "If your film lives in bedrooms, locked bodies, and things standing in doorways, this is the "
            "register it needs."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="the-haunted",
        title="The Haunted",
        kicker="Original score · Official teaser — Crystal Fox Films",
        kind="Feature (teaser)",
        year="2025",
        director="Mike Fox",
        role="Composer",
        imdb="https://www.imdb.com/title/tt37707793/",
        youtube="Ty8tPp59mDc",
        upload_date="2025-10-18",
        duration="PT2M48S",
        thumb="/images/project-Ty8tPp59mDc.jpg",
        poster="/images/posters/the-haunted.jpg",
        poster_alt="THE HAUNTED feature poster, perception is reality, music by Zazie Kanwar-Torge",
        lede="A VR-therapy psychological thriller: perception is reality — until the score stops agreeing.",
        brief=(
            "Crystal Fox Films' teaser for Mike Fox's psychological thriller introduces Sean, a man whose "
            "trauma is being treated with an experimental virtual reality therapy. The promise of healing "
            "twists into a nightmare; the walls between reality and terror collapse. The teaser's own tag "
            "is the whole thesis: perception is reality."
        ),
        approach=[
            ("A cure that sounds like a cure",
             "The teaser's first movement is deliberately, falsely gentle: glassy, digital pads with the "
             "even, odorless calm of a medical interface. The music must sell the therapy before it is "
             "allowed to fear it."),
            ("The lullaby turns",
             "Woven through the calm is a small, singable motif — the kind of line a mind hums to soothe "
             "itself. Each time it returns it sits lower in the mix and a little out of true, so by the "
             "final drop the comfort itself reads as a threat. Comfort is the horror object here, not "
             "the dark."),
            ("Digital versus bodily",
             "The palette splits in two: clean synthesized surfaces for the simulated world, and raw, "
             "close bodily textures — breath, bowed metal, struck string — for the real one. As the walls "
             "collapse, the two palettes invade each other's spaces."),
        ],
        techniques=[
            ("corrupted-innocence", "Corrupted innocence"),
            ("motif-stalking", "Motif stalking"),
            ("dissociative-harmony", "Dissociative harmony"),
            ("hybrid-orchestration", "Hybrid orchestration"),
            ("negative-space", "Negative space"),
        ],
        closing=(
            "Feature in post — the teaser shows the tonal contract: tenderness with a trapdoor in it."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="whispers-in-the-dark",
        title="Whispers In The Dark",
        kicker="Original score · Cue Tube 2024 Halloween special",
        kind="Short film",
        year="2024",
        director="Cue Tube Halloween special",
        role="Composer",
        imdb=None,
        youtube="6qa3Uwj47fc",
        upload_date="2026-04-05",
        duration="PT1M46S",
        thumb="/images/project-6qa3Uwj47fc.jpg",
        poster=None,
        poster_alt=None,
        lede="Jack's guilt has a voice. The score makes sure it is never quite off screen.",
        brief=(
            "Cue Tube's 2024 Halloween special: after committing a terrible act, Jack is plagued by "
            "unsettling voices that echo from the shadows, whispering his guilt at every turn. The "
            "whispers know what he did — and they won't let him forget."
        ),
        approach=[
            ("The whispers are the score",
             "In a film where the antagonist is a chorus of voices, the line between dialogue, sound "
             "design, and music has to dissolve. Sung whispers, breath consonants, and pitched speech "
             "fragments are layered directly into the harmonic beds, so the guilt literally becomes the "
             "atmosphere Jack moves through."),
            ("A cluster that tightens",
             "Under the voices sits a slowly narrowing string cluster — dissonance that does not lunge but "
             "constricts. Each accusation narrows the interval. The audience feels the walls before Jack "
             "does."),
            ("No rescue chord",
             "The cue refuses the resolved cadence that would let the audience exhale. Conscience doesn't "
             "resolve. Neither does the music."),
        ],
        techniques=[
            ("whisper-choir", "Whisper choir"),
            ("diegetic-bleed", "Diegetic bleed"),
            ("cluster-voicing", "Cluster voicing"),
            ("negative-space", "Negative space"),
            ("motif-stalking", "Motif stalking"),
        ],
        closing=(
            "Guilt-horror, hallucination narratives, unreliable narrators — this is how score becomes the "
            "villain's lung."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="aquaphobia",
        title="AQUAPHOBIA",
        kicker="Original score + sound design · Short horror film",
        kind="Short film",
        year="2026",
        director="Dean Specter (Obsidian Horror)",
        role="Composer & sound design",
        imdb=None,
        youtube="rvCGO0BJ_2E",
        upload_date="2026-04-21",
        duration="PT1M44S",
        thumb="/images/project-rvCGO0BJ_2E.jpg",
        poster=None,
        poster_alt=None,
        lede="Water horror scored from underneath the surface — pressure first, panic second.",
        brief=(
            "A short horror film built on the oldest fear in the body: water where it shouldn't be, and "
            "the moment holding your breath stops being a choice. Cinematography by Piotrek Naumowicz; "
            "score and sound design by Zazie Kanwar-Torge."
        ),
        approach=[
            ("Submersion as EQ",
             "The score treats submersion as a filter, not a effect: the world above the waterline keeps "
             "its highs; everything under it is low-passed, muffled, pressurized. Crossing the surface is "
             "an act of violence the mix performs on the audience's ears."),
            ("Breath-hold pacing",
             "Cues are phrased against the audience's own breath cycle — long suspensions that invite the "
             "viewer to hold, released a beat after the image allows it. The body keeps the score; the "
             "score just conducts it."),
            ("Weight below",
             "Sub-frequency weight does the drowning: sustained low mass that the chest registers before "
             "the ears do. Fear of water is fear of weight. So the low end is the antagonist."),
        ],
        techniques=[
            ("sub-drop", "Sub-frequency weight"),
            ("negative-space", "Negative space"),
            ("close-miked-breath", "Close-miked breath"),
            ("pulse-engine", "Pulse engine"),
        ],
        closing=(
            "Water, tight spaces, suffocation narratives — the physics of dread, engineered."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="goodbye-brother",
        title="GOODBYE, BROTHER",
        kicker="Original score · Dramatic short",
        kind="Short film",
        year="2026",
        director="Zazie Productions",
        role="Composer",
        imdb=None,
        youtube="ItrrcilS0ro",
        upload_date="2026-04-11",
        duration="PT1M45S",
        thumb="/images/project-ItrrcilS0ro.jpg",
        poster=None,
        poster_alt=None,
        lede="A grief piece — proof the atmosphere works with the lights partly on.",
        brief=(
            "A dramatic short released through the Zazie Productions channel: farewell as a genre. No "
            "monster, no mask — just the specific horror of a room after someone is gone from it."
        ),
        approach=[
            ("Dread, without the threat",
             "The same architecture that powers the horror cues — sustained beds, narrow melody, space "
             "left deliberately aching — is pointed at loss instead of fear. Grief and dread share a "
             "harmonic basement; only the story above it differs."),
            ("Tape as memory",
             "Strings run through tape saturation and slow wow, so the theme arrives already degraded — "
             "a memory from the first note. Each reprise is a generation further from the source."),
            ("Restraint as respect",
             "The cue refuses to cry on the audience's behalf. One motif, few notes, and the discipline "
             "to let the picture carry the weight."),
        ],
        techniques=[
            ("tape-degradation", "Tape degradation"),
            ("motif-stalking", "Motif, not stalker"),
            ("negative-space", "Negative space"),
        ],
        closing=(
            "For dark dramas and thrillers that need atmosphere without a body count."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="home-intruder",
        title="Home Intruder",
        kicker="Cue · Official car chase scene",
        kind="Cue / chase sequence",
        year="2026",
        director="Dean Specter (Obsidian Horror)",
        role="Composer & sound design",
        imdb=None,
        youtube="riCvy2abhlc",
        upload_date="2026-06-11",
        duration="PT0M49S",
        thumb="/images/project-riCvy2abhlc.jpg",
        poster=None,
        poster_alt=None,
        lede="Forty-nine seconds of chase: the engine becomes the orchestra pit.",
        brief=(
            "An official chase-scene cue — production design by Rachel Monroe, edit and production by "
            "Felix Mercer, score and sound design by Zazie Kanwar-Torge. A single scene, cut to the "
            "millisecond, where the music has one job: never let the pulse down."
        ),
        approach=[
            ("The engine is in the score",
             "Score and sound design are fused: engine noise is tuned, pitched, and folded into the "
             "percussion until the car itself is the drums. The audience can't tell where the world ends "
             "and the music begins — that's the point."),
            ("Stingers locked to the cut",
             "Every swerve lands a metallic stab aligned to the edit. The music doesn't follow the action; "
             "it answers it, call and response, at the exact frame."),
            ("A pulse that only climbs",
             "Underneath, one narrow ostinato rises in register as the scene tightens — speed expressed "
             "as pitch, not tempo. The tempo barely moves; the pressure does all the work."),
        ],
        techniques=[
            ("stinger", "Stinger"),
            ("pulse-engine", "Pulse engine"),
            ("hybrid-orchestration", "Hybrid orchestration"),
            ("diegetic-bleed", "Diegetic bleed"),
        ],
        closing=(
            "Thriller and action sequences that need score and sound design built as one organism."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="phantom-requiem",
        title="Phantom Requiem",
        kicker="Original score · Experimental short by Zazie Productions",
        kind="Short film",
        year="2024",
        director="Zazie Productions",
        role="Composer, director, sound design",
        imdb=None,
        youtube="UX2kv3G89Jw",
        upload_date="2024-06-20",
        duration="PT4M53S",
        thumb="/images/project-UX2kv3G89Jw.jpg",
        poster="/images/posters/phantom-requiem.jpg",
        poster_alt="Phantom Requiem poster, short film by Zazie Productions, original score",
        lede="A requiem written for a dead factory — the building itself plays the choir.",
        brief=(
            "Zazie Productions' original experimental short: an abandoned factory where shadows and "
            "silence are the only remnants of a once-thrumming industrial heartbeat. Every sound in the "
            "film comes from the building's own resonance, organized into a requiem."
        ),
        approach=[
            ("The building is the ensemble",
             "Bowed metal, struck girders, tank resonance, and air moving through dead machinery were "
             "recorded and tuned into a mourners' ensemble. The score doesn't accompany the location — "
             "it is the location, exhumed and taught to sing."),
            ("Requiem mass, detuned",
             "The structure borrows the requiem's bones — introit, lament, rest — but every cadence is "
             "pulled a quarter-tone flat, a mass for something that never got to be at peace."),
            ("Silence as architecture",
             "The factory's true voice is its silence. Long scored silences hold the piece together; the "
             "resonances exist to make the silences feel occupied."),
        ],
        techniques=[
            ("bowed-metal", "Bowed metal"),
            ("drone", "Drone"),
            ("cluster-voicing", "Cluster voicing"),
            ("negative-space", "Scored silence"),
        ],
        closing=(
            "The studio's purest statement of method: atmosphere as the protagonist."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="expire",
        title="EXPIRE",
        kicker="Sound design · Festival horror short",
        kind="Short film",
        year="2025",
        director="Muhammad Abed Baryal",
        role="Sound design",
        imdb="https://www.imdb.com/title/tt19369318/",
        youtube=None,
        upload_date=None,
        duration=None,
        thumb=None,
        poster="/images/posters/expire-red-check.jpg",
        poster_alt="EXPIRE (2025) theatrical poster, horror short scored and sound designed by Zazie Kanwar-Torge",
        lede="A deadline you can hear ticking from the next room.",
        brief=(
            "Muhammad Abed Baryal's 2025 festival short. The poster says it plainly: a date, a box, a red "
            "check. Zazie Kanwar-Torge handled the sound design — the floor the score walks on."
        ),
        approach=[
            ("Countdown as texture",
             "Time pressure is built into the sound floor: mechanical ticks, paper, electrical hum — "
             "small, domestic mechanisms that never stop, so the audience's nerves never do either."),
            ("Rooms that lie",
             "Perspective-accurate room sound with one deliberate wrongness per scene: a reverb tail a "
             "half-size too big, a silence that arrives a frame early. The viewer feels the lie before "
             "they can name it."),
            ("Design first, score second",
             "When sound design carries the horror, the score must leave it room to kill. The music "
             "holds the dread floor and steps out of the way of every impact."),
        ],
        techniques=[
            ("pulse-engine", "Mechanical pulse"),
            ("negative-space", "Negative space"),
            ("tape-degradation", "Room-tone rot"),
        ],
        closing=(
            "Sound-design-led horror for films that want the walls, wiring, and clocks to do the haunting."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="choleric",
        title="CHOLERIC",
        kicker="Original score + production · Short film",
        kind="Short film",
        year=None,
        director="Sebastian Fabres",
        role="Composer & producer",
        imdb="https://www.imdb.com/title/tt38637541/",
        youtube=None,
        upload_date=None,
        duration=None,
        thumb=None,
        poster="/images/posters/choleric.jpg",
        poster_alt="CHOLERIC poster, her sins brought me home. A Sebastian Fabres film scored by Zazie Kanwar-Torge",
        lede="Wrath, scored low and struck hard — 'her sins brought me home.'",
        brief=(
            "Sebastian Fabres' short takes its title from the classical temperament of anger, and its "
            "tagline from the oldest engine in horror: a wronged party coming home to collect. Zazie "
            "Kanwar-Torge scores and produces."
        ),
        approach=[
            ("Anger at the bottom of the register",
             "Choleric music lives below the waist: low strings, struck metal, hammered pulses. Rage "
             "scored as pressure rather than noise — the film stays cold while the score boils."),
            ("Struck strings, not bowed",
             "The string section is treated percussively — col legno battuto, hammered piano frames, "
             "body hits — so even the 'orchestral' sound carries impact trauma in it."),
            ("A theme that comes home wrong",
             "The family motif states clean once, early. Every return afterward is a corruption: lowered "
             "semitone by semitone as the protagonist closes in on what he came home for."),
        ],
        techniques=[
            ("struck-strings", "Struck strings"),
            ("motif-stalking", "Motif stalking"),
            ("stinger", "Stinger"),
            ("drone", "Drone"),
        ],
        closing=(
            "Revenge horror and slow-burn rage — temperament scoring with a body count."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="eclipsed",
        title="ECLIPSED",
        kicker="Score credit · Feature film",
        kind="Feature",
        year=None,
        director="William Viera",
        role="Composer",
        imdb=None,
        youtube=None,
        upload_date=None,
        duration=None,
        thumb=None,
        poster="/images/posters/eclipsed.png",
        poster_alt="ECLIPSED feature poster, to erase him she had to become him. A film by William Viera with Zazie Productions music",
        lede="To erase him, she had to become him — identity horror scored in two half-truths.",
        brief=(
            "William Viera's feature. The tagline is a musical instruction: an identity dissolved and "
            "replaced, a person overwritten. The score's job is to make the audience unsure which woman "
            "they are watching — and which one is listening back."
        ),
        approach=[
            ("One theme, two owners",
             "The central motif exists in two voicings — one feminine and luminous, one darkened and "
             "detuned a quarter-tone. Scenes hand the theme between them mid-cut, so the score changes "
             "allegiance before the audience can."),
            ("Erasure as arrangement",
             "As 'she' becomes him, instruments are removed one layer at a time from the theme until only "
             "its shadow remains. The audience hears a person being edited."),
            ("Proximity with menace",
             "Intimate close-miking throughout — the score never sits at cinema distance. It is in the "
             "room, at the shoulder, breathing with whoever is currently wearing the identity."),
        ],
        techniques=[
            ("dissociative-harmony", "Dissociative harmony"),
            ("motif-stalking", "Motif, with two owners"),
            ("close-miked-breath", "Close-miked breath"),
            ("whisper-choir", "Whisper choir"),
        ],
        closing=(
            "Identity horror, possession narratives, doppelgänger thrillers — the score as unreliable narrator."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="unseen",
        title="UNSEEN",
        kicker="Additional score · Feature film",
        kind="Feature",
        year=None,
        director="Steve Merlo",
        role="Additional music",
        imdb=None,
        youtube=None,
        upload_date=None,
        duration=None,
        thumb=None,
        poster="/images/posters/unseen.png",
        poster_alt="UNSEEN feature poster, Steve Merlo's unseen killer, additional music by Zazie Kanwar-Torge",
        lede="An invisible predator. The shadow music is the only place the audience can see it.",
        brief=(
            "Steve Merlo's feature about an unseen killer poses the hardest scoring problem in the genre: "
            "how do you give an absence a physical presence? Zazie Kanwar-Torge contributes additional "
            "score — the shadow music the creature moves through — beneath Steve Merlo's main title "
            "theme. The additional score is the only surface the creature is allowed to touch."
        ),
        approach=[
            ("Presence without a source",
             "The killer's cues are spatialized to move — pans and depth shifts that place something in "
             "the room with the audience without ever letting it resolve into an image. Ears see what "
             "eyes can't."),
            ("Empty-room orchestration",
             "Scenes of nothing are scored with the sound of a room that is not empty: barely-audible "
             "scrapes, pressure, a harmonic floor slightly too warm. Safe rooms sound wrong; that is the "
             "tell."),
            ("The gaze has a timbre",
             "Whenever the killer is near, one timbre appears — a dry, scraped, source-less texture that "
             "the film never explains. By the third appearance the audience's neck pricks at its first "
             "harmonic."),
        ],
        techniques=[
            ("psychophonic-bed", "Psychophonic bed"),
            ("negative-space", "Negative space"),
            ("diegetic-bleed", "Diegetic bleed"),
            ("bowed-metal", "Bowed metal"),
        ],
        closing=(
            "Creature features and stalker narratives where the monster must stay invisible and still "
            "be felt in the chest."
        ),
    ),
    # ------------------------------------------------------------------
    dict(
        slug="peregrinus",
        title="PEREGRINUS",
        kicker="Score credit · Concept series",
        kind="Concept series",
        year=None,
        director=None,
        role="Composer",
        imdb=None,
        youtube=None,
        upload_date=None,
        duration=None,
        thumb=None,
        poster="/images/posters/peregrinus.png",
        poster_alt="PEREGRINUS series poster, a pilgrimage of foreign forces, scored by Zazie Kanwar-Torge",
        lede="A pilgrimage of foreign forces — folk ritual stretched across a series architecture.",
        brief=(
            "A concept series built on pilgrimage: travelers moving through a landscape that does not want them, "
            "toward forces that are foreign in the oldest sense — wrong-shaped, wrong-weathered, "
            "wrong-worshipped. Long-form scoring across episodes, where themes are allowed to erode "
            "over hours instead of minutes."
        ),
        approach=[
            ("Leitmotif with a decay curve",
             "Each force in the series owns a motif, and every episode returns it slightly more degraded "
             "— retuned, re-registered, swallowed by drone. The audience tracks the corruption of themes "
             "the way they track a spreading infection."),
            ("Folk materials, wrong tunings",
             "Lullabies, rounds, and hymn fragments played on folk materials but pulled out of equal "
             "temperament: familiar songs from a country that doesn't exist. Comfort with the map wrong."),
            ("Ritual pulse",
             "Processional percussion carries the pilgrimage itself — footsteps, staff-strikes, heartbeats "
             "at walking tempo. The score moves at the pace of the journey, so the dread has somewhere "
             "to accumulate."),
        ],
        techniques=[
            ("folk-detune", "Folk detune"),
            ("drone", "Drone"),
            ("ritual-pulse", "Ritual pulse"),
            ("motif-stalking", "Motif stalking across episodes"),
        ],
        closing=(
            "Series and folk-horror worlds that need musical myth-building — dread that compounds over hours."
        ),
    ),
]

# Ordering used for hub + prev/next pager: scoring-first, then additional credits.
HUB_ORDER = [
    "mike-has-a-visitor", "the-haunted", "whispers-in-the-dark", "aquaphobia",
    "goodbye-brother", "home-intruder", "phantom-requiem", "expire",
    "choleric", "eclipsed", "unseen", "peregrinus",
]


def duration_display(iso):
    if not iso:
        return None
    import re
    m = re.match(r"PT(?:(\d+)M)?(?:(\d+)S)?", iso)
    if not m:
        return None
    mins, secs = int(m.group(1) or 0), int(m.group(2) or 0)
    return f"{mins}:{secs:02d}"


# Per-film craft context: the specific scoring problem each project posed.
# Rendered as "The hard problem" section on each case study.
CONTEXT = {
    "mike-has-a-visitor": (
        "Sustaining fourteen minutes of paralysis",
        "Sleep paralysis is a one-idea premise, and fourteen minutes is long enough to kill it. The "
        "answer is escalation through subtraction: each cycle removes one comfort layer from the mix — "
        "first the room's normal ambience, then the score's high register, then the distance between "
        "listener and source — so the film's repetitions feel like tightening rather than repetition. "
        "By the final visitation, the audience is hearing through Mike's narrowed perception, not at it."
    ),
    "the-haunted": (
        "Scoring a teaser is scoring a contract",
        "A teaser is a promise about a film's temperature, made in under three minutes. The Haunted's "
        "teaser had to guarantee psychological thriller — interiority, unreality, grief — while holding "
        "back the feature's full orchestral weight. The cue therefore runs its arc in miniature: calm, "
        "crack, collapse, and a final frame of held breath that tells the audience the film will keep "
        "its nerve. It is a scoring contract, signed in public."
    ),
    "whispers-in-the-dark": (
        "Voicing an antagonist made of dialogue",
        "When the monster is a chorus of accusations, the composer's danger is redundancy: the voices "
        "already carry the horror, and doubling them with obvious scare-music would be decorative. The "
        "solution was to make the score the whispers' resonance chamber — harmonies built from the "
        "voices' own pitch centers, so the score feels produced by Jack's head rather than added to "
        "the film. The music never argues with the voices. It agrees."
    ),
    "aquaphobia": (
        "Scoring water without water sounds",
        "The obvious move in water horror is hydrophones and bubbles — and it is exactly what makes "
        "water horror sound like everything else. AQUAPHOBIA's score refuses aquatic foley; its "
        "submersion is structural: filtered registers, phrasing built on held breath, pressure in the "
        "low end. The audience's inner ear does the rest. Fear of drowning is not a sound effect; it "
        "is a physics lesson, delivered to the chest."
    ),
    "goodbye-brother": (
        "Dread architecture with nothing to dread",
        "The hardest register to score is sorrow that must not become sentimental. The cue borrows "
        "horror's architecture — sustained beds, narrow registers, strategic silence — and aims it at "
        "absence: the dread of an empty chair, not an intruder. It is the studio's position that grief "
        "and horror share a root system, and this piece is the evidence."
    ),
    "home-intruder": (
        "Forty-nine seconds, no fat",
        "A scene cue is sprinting with weights: no time to develop themes, no room for exposition, one "
        "job per bar. Everything in these forty-nine seconds is cut-locked — stingers to edits, pitched "
        "engine noise to the gear changes, a rising ostinato to the closing gap. It is scored like a "
        "trap being sprung in stages, because the scene is one."
    ),
    "phantom-requiem": (
        "Teaching a dead building to sing in tune",
        "Field recordings from an abandoned factory are chaotic by nature: untuned resonances, noise "
        "floors, wind through broken glass. The work was tuning the untunable — selecting structural "
        "resonances, matching them to a requiem's harmonic skeleton, and letting the dissonances that "
        "wouldn't conform keep their edge. The film's music is a negotiation with a ruin, and the ruin "
        "won several of the terms."
    ),
    "expire": (
        "Designing the floor the score stands on",
        "Sound design for horror is load-bearing: the score can only build as high as the design's "
        "floor allows. EXPIRE's design work establishes the film's ticking, humming, paper-shuffling "
        "normal — and corrupts it one degree at a time, so when the score finally enters it arrives "
        "into a room already prepared. Design first is not a credit note. It is the sequencing of the "
        "film's fear."
    ),
    "choleric": (
        "Wrath that stays cold on screen",
        "Revenge stories risk loudness: the score shouting the anger the actor is playing quietly. "
        "CHOLERIC inverts it — the rage is scored as pressure at the bottom of the register, struck "
        "and hammered, while the surface stays glacial. The audience's pulse does the shouting. The "
        "music never raises its voice, which is what makes it frightening."
    ),
    "eclipsed": (
        "One theme, two owners, no telling",
        "Identity-horror scoring fails when the audience can always tell which person the music loves. "
        "ECLIPSED's dual-voiced motif is engineered to switch allegiance mid-scene — handed between "
        "voicings under dialogue, so the score's sympathy is always one step ahead of the reveal. The "
        "audience should feel the music knows something about 'her' that she doesn't."
    ),
    "unseen": (
        "Giving an absence a body",
        "An invisible killer cannot be scored the way a visible one can — there is no entrance to "
        "accompany, no figure to theme. UNSEEN's creature exists in the score as pure spatial behavior: "
        "movement without source, proximity without image, one unexplained timbre as its gaze. By the "
        "time the film shows anything, the audience has already learned to flinch at a frequency."
    ),
    "peregrinus": (
        "Architecture for hours, not minutes",
        "Series scoring fails by repetition sooner than any feature: a theme that works in episode one "
        "is wallpaper by episode three. PEREGRINUS is built as a decay system — every force's motif "
        "degrades on a planned curve across episodes, retuned and re-registered so familiarity curdles "
        "into wrongness. Long-form horror is not film scoring stretched. It is erosion, scheduled."
    ),
}
