#!/usr/bin/env python3
"""Builds /work/ hub and the twelve case-study pages."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sitegen import (DOMAIN, PERSON_ID, ORG_ID, SITE_ID, SAMEAS, abs_url, breadcrumb,
                     esc, graph_jsonld, hero_block, person_ref, org_ref, shell, write_page)
from works_data import WORKS, HUB_ORDER, duration_display, CONTEXT

BY_SLUG = {w["slug"]: w for w in WORKS}


def work_ld(w, prev_slug, next_slug):
    graph = [breadcrumb([("Work", "/work/"), (w["title"], None)])]

    webpage = {
        "@type": "WebPage",
        "@id": abs_url(f"/work/{w['slug']}/"),
        "url": abs_url(f"/work/{w['slug']}/"),
        "name": f"{w['title']} — Original Horror Score by Zazie Kanwar-Torge",
        "description": w["lede"],
        "isPartOf": {"@id": SITE_ID},
        "primaryImageOfPage": abs_url(w["poster"] or w["thumb"]),
        "dateModified": "2026-09-16",
        "inLanguage": "en",
    }
    graph.append(webpage)

    # The work entity
    director = {"@type": "Person", "name": w["director"]} if w["director"] else None
    work_urls = []
    if w.get("imdb"):
        work_urls.append(w["imdb"])
    if w.get("youtube"):
        work_urls.append(f"https://www.youtube.com/watch?v={w['youtube']}")

    if w["kind"] == "Cue / chase sequence":
        entity = {
            "@type": "MusicComposition",
            "@id": abs_url(f"/work/{w['slug']}/#work"),
            "name": w["title"],
            "composer": person_ref(),
            "genre": ["Thriller", "Horror"],
            "description": w["lede"],
            "image": abs_url(w["thumb"]),
            "url": abs_url(f"/work/{w['slug']}/"),
        }
    else:
        entity = {
            "@type": "Movie",
            "@id": abs_url(f"/work/{w['slug']}/#work"),
            "name": w["title"],
            "genre": ["Horror", "Psychological Horror"],
            "image": abs_url(w["poster"] or w["thumb"]),
            "url": abs_url(f"/work/{w['slug']}/"),
        }
        if director:
            entity["director"] = director
        if w["role"].startswith("Composer"):
            entity["musicBy"] = person_ref()
        if w.get("year"):
            entity["datePublished"] = w["year"]
        for u in work_urls:
            entity.setdefault("sameAs", [])
            entity["sameAs"].append(u)
    graph.append(entity)
    webpage["about"] = {"@id": entity["@id"]}

    # VideoObject when a public embed exists
    if w.get("youtube"):
        vo = {
            "@type": "VideoObject",
            "name": f"{w['title']} — {w['kicker']}",
            "description": w["lede"],
            "thumbnailUrl": [abs_url(w["thumb"])],
            "uploadDate": w["upload_date"],
            "embedUrl": f"https://www.youtube-nocookie.com/embed/{w['youtube']}",
            "contentUrl": f"https://www.youtube.com/watch?v={w['youtube']}",
            "isFamilyFriendly": False,
            "inLanguage": "en",
            "publisher": org_ref(),
        }
        if w.get("duration"):
            vo["duration"] = w["duration"]
        graph.append(vo)

    return graph


def work_page(w):
    slug = w["slug"]
    path = f"/work/{slug}/"
    order = HUB_ORDER.index(slug)
    prev_slug = HUB_ORDER[(order - 1) % len(HUB_ORDER)]
    next_slug = HUB_ORDER[(order + 1) % len(HUB_ORDER)]
    prev, nxt = BY_SLUG[prev_slug], BY_SLUG[next_slug]

    # ---- hero
    crumb = [("Work", "/work/"), (w["title"], None)]
    body = [hero_block(crumb, w["kicker"], esc(w["title"]),
                      f'<span class="italic-mist">{esc(w["lede"])}</span>')]

    # ---- main article
    body.append('<section class="section"><div class="wrap">')

    # media: video embed or poster
    if w.get("youtube"):
        d = duration_display(w.get("duration"))
        cap = f"{esc(w['kicker'])}"
        if d:
            cap += f" · {d}"
        body.append(f"""
<div class="videobox" style="background-image:url('{w["thumb"]}')">
  <iframe src="https://www.youtube-nocookie.com/embed/{w["youtube"]}"
          title="{esc(w["title"])} — original score by Zazie Kanwar-Torge (video player)"
          loading="lazy" allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
</div>
<figure class="still" style="margin-top:-1.25rem"><figcaption>{cap} · Watch with sound. Obviously.</figcaption></figure>""")
    elif w.get("poster"):
        body.append(f"""
<figure class="still">
  <img src="{w["poster"]}" alt="{esc(w["poster_alt"])}" width="900" loading="lazy" decoding="async"/>
  <figcaption>{esc(w["title"])} · {esc(w["kind"])}{(" · " + w["year"]) if w.get("year") else ""}</figcaption>
</figure>""")

    # brief + approach
    body.append('<div class="prose">')
    body.append('<h2 class="display" style="font-size:1.9rem">The brief</h2>')
    body.append(f"<p>{w['brief']}</p>")
    body.append('<h2 class="display" style="font-size:1.9rem">The score</h2>')
    for h, p in w["approach"]:
        body.append(f"<h3 class=\"display\" style=\"font-size:1.35rem\">{esc(h)}</h3>")
        body.append(f"<p>{p}</p>")

    # the hard problem
    if w["slug"] in CONTEXT:
        ch, cp = CONTEXT[w["slug"]]
        body.append(f'<h2 class="display" style="font-size:1.9rem">The hard problem</h2>')
        body.append(f"<p><strong>{esc(ch)}.</strong> {cp}</p>")

    # techniques
    body.append('<h2 class="display" style="font-size:1.9rem">Signals &amp; techniques</h2>')
    body.append('<p>How this score does its work — each technique documented in '
                '<a href="/lexicon/">the Lexicon of Dread</a>:</p>')
    body.append('<div class="tagrow">')
    for tslug, tlabel in w["techniques"]:
        body.append(f'<span class="tag"><a href="/lexicon/#{tslug}">{esc(tlabel)}</a></span>')
    body.append("</div>")
    body.append(f'<div class="pull">{w["closing"]}</div>')
    body.append('<p><a href="/#contact">Commission a score in this register →</a></p>')
    body.append("</div>")  # /prose

    # credits
    credits = [("Format", w["kind"])]
    if w.get("year"):
        credits.append(("Year", w["year"]))
    if w.get("director"):
        credits.append(("Director", w["director"]))
    credits.append(("Music", "Zazie Kanwar-Torge — Zazie Productions"))
    role_note = w["role"]
    credits.append(("Role", role_note))
    links = []
    if w.get("imdb"):
        links.append(f'<a href="{w["imdb"]}" target="_blank" rel="noopener">IMDb ↗</a>')
    if w.get("youtube"):
        links.append(f'<a href="https://www.youtube.com/watch?v={w["youtube"]}" target="_blank" rel="noopener">YouTube ↗</a>')
    if links:
        credits.append(("Also on", " · ".join(links)))
    credits_html = "".join(f"<dt>{k}</dt><dd>{v}</dd>" for k, v in credits)
    body.append(f'<div class="credits"><dl>{credits_html}</dl></div>')

    # pager
    body.append(f"""
<div class="pager">
  <a href="/work/{prev["slug"]}/"><span class="dir">←</span>{esc(prev["title"])}</a>
  <a class="next" href="/work/{next_slug}/">{esc(nxt["title"])}<span class="dir" style="margin-left:.5rem">→</span></a>
</div>""")

    body.append("</div></section>")

    title = f"{w['title']} — Original Score by Zazie Kanwar-Torge"
    desc = (f"{w['lede']} {w['kicker']}."
            + f" Scored by Zazie Kanwar-Torge, Zazie Productions — psychological horror composer for film, TV, and games.")
    og_img = w["poster"] or w["thumb"]

    return shell(path=path, title=title, description=desc[:300],
                 h1_html=esc(w["title"]), body="\n".join(body),
                 ld_graph=work_ld(w, prev_slug, next_slug),
                 og_type="video.other" if w.get("youtube") else "article",
                 og_image=og_img, og_image_alt=w.get("poster_alt") or w["lede"],
                 current_nav="work")


def hub_page():
    path = "/work/"
    body = [hero_block(
        [("Work", None)],
        "Filmography · scores, sound design & credits",
        "Horror works, <span class=\"italic-blood\">scored to the cut.</span>",
        "Every credit on this page is a completed collaboration: shorts, features, a series, "
        "and one dead factory. Watch the films, then <a href='/#contact' style='color:var(--bone);border-bottom:1px solid rgba(196,30,30,.55)'>commission yours</a>."
    )]

    body.append('<section class="section"><div class="wrap">')
    body.append('<div class="prose" style="margin-bottom:3.5rem">')
    body.append("<p>Twelve productions, one nervous system. This page is the studio's filmography: "
                "horror shorts, features, a series, and the cue work between them — each scored (or "
                "sound designed) by Zazie Kanwar-Torge under Zazie Productions. The films below with "
                "video are watchable in full; the poster credits link to their own case studies with "
                "score breakdowns. The craft vocabulary used across all of them is documented in "
                '<a href="/lexicon/">the Lexicon of Dread</a>, and the numbers behind commissioning '
                'your own are in <a href="/guides/horror-film-score-cost/">the scoring cost guide</a>.</p>')
    body.append("<p>New here? Start with <a href=\"/work/mike-has-a-visitor/\">Mike Has A Visitor</a> "
                "for paralysis-dread, <a href=\"/work/the-haunted/\">The Haunted</a> for psychological "
                "thriller, or <a href=\"/work/phantom-requiem/\">Phantom Requiem</a> for the studio's "
                "method at its purest.</p>")
    body.append("</div>")

    # --- film samples group
    body.append('<p class="micro">On screen — watch the score in context</p>')
    body.append('<h2 class="display" style="margin-bottom:1.75rem">Film samples</h2>')
    body.append('<div class="grid grid-3">')
    for slug in HUB_ORDER:
        w = BY_SLUG[slug]
        if not w.get("youtube"):
            continue
        d = duration_display(w.get("duration"))
        body.append(f"""
<a class="workcard" href="/work/{slug}/">
  <span class="frame" style="aspect-ratio:16/9">
    <img src="{w["thumb"]}" alt="{esc(w["title"])} — {esc(w["kind"])} scored by Zazie Kanwar-Torge" loading="lazy" decoding="async"/>
  </span>
  <h3>{esc(w["title"])}</h3>
  <p class="meta"><span class="r">{esc(w["role"])}</span> · {esc(w["kind"])}{f" · {d}" if d else ""}</p>
</a>""")
    body.append("</div>")

    # --- additional credits
    body.append('<div style="height:4rem"></div>')
    body.append('<p class="micro">Additional credits — posters</p>')
    body.append('<h2 class="display" style="margin-bottom:1.75rem">Selected productions</h2>')
    body.append('<div class="grid grid-3">')
    for slug in HUB_ORDER:
        w = BY_SLUG[slug]
        if w.get("youtube") or not w.get("poster"):
            continue
        year = f" · {w['year']}" if w.get("year") else ""
        body.append(f"""
<a class="workcard" href="/work/{slug}/">
  <span class="frame">
    <img src="{w["poster"]}" alt="{esc(w["poster_alt"])}" loading="lazy" decoding="async"/>
  </span>
  <h3>{esc(w["title"])}</h3>
  <p class="meta"><span class="r">{esc(w["role"])}</span> · {esc(w["kind"])}{year}</p>
</a>""")
    body.append("</div>")

    body.append(f"""
<div class="pull" style="margin-top:3.5rem">Full credit history lives on
<a href="https://www.imdb.com/name/nm17333332" target="_blank" rel="noopener" style="color:var(--bone);border-bottom:1px solid var(--blood)">IMDb</a>.
The next credit should be yours: <a href="/#contact" style="color:var(--bone);border-bottom:1px solid var(--blood)">start a scoring inquiry</a>.</div>
""")
    body.append("</div></section>")

    ld = [
        breadcrumb([("Work", None)]),
        {
            "@type": "CollectionPage",
            "@id": abs_url(path),
            "url": abs_url(path),
            "name": "Horror Film Works & Credits — Zazie Kanwar-Torge",
            "description": "Filmography of Zazie Kanwar-Torge: original horror scores, sound design, and credits for shorts, features, and series.",
            "isPartOf": {"@id": SITE_ID},
            "dateModified": "2026-09-16",
            "inLanguage": "en",
            "about": person_ref(),
        },
        {
            "@type": "ItemList",
            "name": "Horror works scored by Zazie Kanwar-Torge",
            "numberOfItems": len(HUB_ORDER),
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1,
                 "url": abs_url(f"/work/{slug}/"),
                 "name": BY_SLUG[slug]["title"]}
                for i, slug in enumerate(HUB_ORDER)
            ],
        },
    ]

    return shell(path=path,
                 title="Horror Film Works & Credits — Zazie Kanwar-Torge",
                 description=("Every horror film, short, feature, and series scored by Zazie Kanwar-Torge "
                              "(Zazie Productions): watch the scores in context — sleep paralysis, psychological "
                              "thriller, folk horror, and body horror."),
                 h1_html="", body="\n".join(body), ld_graph=ld, current_nav="work")


def main():
    write_page("/work/index.html", hub_page())
    for w in WORKS:
        write_page(f"/work/{w['slug']}/index.html", work_page(w))


if __name__ == "__main__":
    main()
