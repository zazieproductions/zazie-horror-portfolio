#!/usr/bin/env python3
"""Static page generator for horror.zazieproductions.com content layer.

Emits fully pre-rendered HTML (no JS dependency) that matches the design
system of the React SPA homepage. Run:  python3 tools/build_pages.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAIN = "https://horror.zazieproductions.com"
CSS = "/site-20260916.css"
CSS_INTEGRITY = ""  # not hashed; same-origin
PERSON_ID = f"{DOMAIN}/#person"
ORG_ID = f"{DOMAIN}/#org"
SITE_ID = f"{DOMAIN}/#website"
FONT_HREF = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap"

SITE_NAME = "Zazie Kanwar-Torge: Horror Composer"
SITE_DESC = ("Portfolio of award-winning psychological horror composer Zazie Kanwar-Torge. "
             "Original dark, atmospheric, cinematic scores for film, TV, and games.")

SAMEAS = [
    "https://www.imdb.com/name/nm17333332",
    "https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0",
    "https://zazieproductions.bandcamp.com",
    "https://music.apple.com/us/artist/zazie-productions/1623719351",
    "https://youtube.com/@zazieproductions",
    "https://www.linkedin.com/in/zazie-kanwar-torge-3b8a98373",
    "http://linktr.ee/zazieproductions",
]


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def abs_url(path):
    return f"{DOMAIN}{path}"


def breadcrumb(items):
    """items: list of (name, url) — last item is the current page."""
    elems = []
    for i, (name, url) in enumerate(items, start=1):
        elems.append({
            "@type": "ListItem",
            "position": i,
            "name": name,
            "item": abs_url(url),
        })
    return {
        "@type": "BreadcrumbList",
        "itemListElement": elems,
    }


def person_ref():
    return {"@type": "Person", "@id": PERSON_ID, "name": "Zazie Kanwar-Torge",
            "url": DOMAIN + "/"}


def org_ref():
    return {"@type": "Organization", "@id": ORG_ID, "name": "Zazie Productions LLC",
            "url": DOMAIN + "/"}


def graph_jsonld(graph):
    return '<script type="application/ld+json">\n' + json.dumps(
        {"@context": "https://schema.org", "@graph": graph}, indent=2, ensure_ascii=False
    ) + "\n</script>"


def shell(*, path, title, description, h1_html, body, ld_graph, og_type="website",
          og_image="/images/hero-portrait.jpg", og_image_alt=None, date_modified=None,
          current_nav=None):
    """Builds a complete standalone HTML page."""
    url = abs_url(path)
    og_image_alt = og_image_alt or "Zazie Kanwar-Torge, psychological horror composer, dark cinematic score artwork"
    dm = date_modified or "2026-09-16"

    nav_items = [
        ("Reel", "/#showreel", "reel"),
        ("Work", "/work/", "work"),
        ("Lexicon", "/lexicon/", "lexicon"),
        ("Rates", "/#services", "rates"),
    ]
    nav_html = ""
    for label, href, key in nav_items:
        cur = ' aria-current="page"' if key == current_nav else ""
        nav_html += f'<a class="nav" href="{href}"{cur}>{label}</a>'

    header = f"""
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/" aria-label="Zazie Kanwar-Torge, Zazie Productions, horror composer — home">
      <span class="glyph" aria-hidden="true">Z</span>
      <span class="stack">
        <span class="zkt">ZKT</span>
        <span class="prods">Productions</span>
      </span>
    </a>
    <nav aria-label="Primary">
      <div class="nav-links">
        {nav_html}
        <a class="nav-cta" href="/#contact">Scoring inquiry</a>
      </div>
    </nav>
  </div>
</header>"""

    footer = f"""
<footer class="site-footer">
  <div class="wrap">
    <div class="cols">
      <div>
        <p class="fbrand">Zazie Kanwar-Torge</p>
        <p class="ftag">Zazie Productions LLC · Atmospheric horror scores for film, TV &amp; games</p>
      </div>
      <div>
        <h4>Work</h4>
        <ul>
          <li><a href="/work/">All works &amp; credits</a></li>
          <li><a href="/work/mike-has-a-visitor/">Mike Has A Visitor</a></li>
          <li><a href="/work/the-haunted/">The Haunted</a></li>
          <li><a href="/lexicon/">The Lexicon of Dread</a></li>
        </ul>
      </div>
      <div>
        <h4>Commission &amp; press</h4>
        <ul>
          <li><a href="/guides/horror-film-score-cost/">Scoring rates &amp; cost</a></li>
          <li><a href="/guides/hire-a-horror-composer/">Hiring a horror composer</a></li>
          <li><a href="/press/">Press kit</a></li>
          <li><a href="/#contact">Scoring inquiry</a></li>
        </ul>
      </div>
      <div>
        <h4>Elsewhere</h4>
        <ul>
          <li><a href="https://www.imdb.com/name/nm17333332" rel="me noopener" target="_blank">IMDb</a></li>
          <li><a href="https://zazieproductions.bandcamp.com" rel="me noopener" target="_blank">Bandcamp</a></li>
          <li><a href="https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0" rel="me noopener" target="_blank">Spotify</a></li>
          <li><a href="https://youtube.com/@zazieproductions" rel="me noopener" target="_blank">YouTube</a></li>
        </ul>
      </div>
    </div>
    <div class="legal">
      <span>© 2026 Zazie Productions LLC. All rights reserved.</span>
      <span>Psychological horror composer · dark atmospheric film scores</span>
    </div>
  </div>
</footer>"""

    ld = graph_jsonld(ld_graph)

    html = f"""<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}"/>
<link rel="canonical" href="{url}"/>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
<meta name="author" content="Zazie Kanwar-Torge"/>
<meta name="theme-color" content="#050505"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
<link rel="preconnect" href="https://www.youtube-nocookie.com"/>
<link href="{FONT_HREF}" rel="stylesheet"/>
<link href="{CSS}" rel="stylesheet"/>
<meta property="og:type" content="{og_type}"/>
<meta property="og:site_name" content="Zazie Productions: Horror Composer"/>
<meta property="og:locale" content="en_US"/>
<meta property="og:url" content="{url}"/>
<meta property="og:title" content="{esc(title)}"/>
<meta property="og:description" content="{esc(description)}"/>
<meta property="og:image" content="{abs_url(og_image)}"/>
<meta property="og:image:alt" content="{esc(og_image_alt)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{esc(title)}"/>
<meta name="twitter:description" content="{esc(description)}"/>
<meta name="twitter:image" content="{abs_url(og_image)}"/>
{ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{header}
<main id="main">
{body}
</main>
{footer}
</body>
</html>
"""
    return html


def write_page(path, html):
    full = os.path.join(ROOT, path.lstrip("/"))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(html)
    print(f"wrote {path} ({len(html)} bytes)")


def hero_block(crumbs, kicker, h1, lede):
    crumb_html = '<nav class="crumbs" aria-label="Breadcrumb">'
    crumb_html += ' <a href="/">Home</a>'
    for name, href in crumbs:
        crumb_html += f' <span class="sep">/</span> '
        if href:
            crumb_html += f'<a href="{href}">{esc(name)}</a>'
        else:
            crumb_html += f'<span class="here">{esc(name)}</span>'
    crumb_html += "</nav>"
    return f"""
<section class="hero">
  <div class="wrap">
    {crumb_html}
    <p class="micro">{esc(kicker)}</p>
    <h1 class="display">{h1}</h1>
    <p class="lede" style="margin-top:1.1rem">{lede}</p>
  </div>
</section>"""
