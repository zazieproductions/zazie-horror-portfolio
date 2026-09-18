#!/usr/bin/env bash
# Build the legal, rights and operating documents.
#
# Sources live in legal-src/. Page sources carry four placeholders:
#
#   __MASTHEAD__  partials/masthead.html
#   __FOOTER__    partials/footer.html
#   __CSS__       content-hashed stylesheet filename
#   __JS__        content-hashed script filename
#
# A page that contains the marker <!--FAQ_SCHEMA--> also gets a FAQPage
# JSON-LD block generated from its own <details class="faq-item"> markup, so
# the structured data can never drift from the visible answers.
#
# Every page is written as <slug>/index.html: a REAL static path. Do not map
# these routes through _redirects. Cloudflare Pages redirects ".html" URLs to
# their pretty form, so a 200 rewrite to a .html target loops forever (the
# /store page hit exactly this; see STORE.md section 2).
#
#   ./legal-src/build.sh
set -euo pipefail

cd "$(dirname "$0")/.."
hash8() { printf '%s' "$1" | sha256sum | cut -c1-8; }

CSS_HASH=$(hash8 "$(cat legal-src/legal.css)")
JS_HASH=$(hash8 "$(cat legal-src/legal.js)")
CSS_OUT="legal-${CSS_HASH}.css"
JS_OUT="legal-${JS_HASH}.js"

# drop previous builds (never touch index-* or store-*)
rm -f legal-[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].css \
      legal-[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].js

cp legal-src/legal.css "$CSS_OUT"
cp legal-src/legal.js "$JS_OUT"

LEGAL_CSS="$CSS_OUT" LEGAL_JS="$JS_OUT" python3 - <<'PY'
import html
import json
import os
import pathlib
import re
import sys
from html.parser import HTMLParser

root = pathlib.Path(os.environ.get("REPO_ROOT", "."))
src = root / "legal-src"
css = os.environ["LEGAL_CSS"]
js = os.environ["LEGAL_JS"]

masthead = (src / "partials" / "masthead.html").read_text(encoding="utf-8").strip()
footer = (src / "partials" / "footer.html").read_text(encoding="utf-8").strip()


class FaqParser(HTMLParser):
    """Pull question/answer pairs out of the page's own FAQ markup."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items = []
        self._item = None
        self._depth = 0
        self._answer_depth = 0
        self._capture = None  # "question" | "answer"

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get("class", "")
        if tag == "details" and "faq-item" in cls:
            self._item = {"id": a.get("id", ""), "q": [], "a": []}
            self._depth = 1
            return
        if self._item is None:
            return
        if tag == "details":
            self._depth += 1
        if self._capture == "answer" and tag == "div":
            self._answer_depth += 1
        if tag == "span" and "qtext" in cls:
            self._capture = "question"
        elif tag == "div" and "answer" in cls:
            self._capture = "answer"
            self._answer_depth = 1

    def handle_endtag(self, tag):
        if self._item is None:
            return
        if self._capture == "question" and tag == "span":
            self._capture = None
        elif self._capture == "answer" and tag == "div":
            self._answer_depth -= 1
            if self._answer_depth <= 0:
                self._capture = None
        if tag == "details":
            self._depth -= 1
            if self._depth <= 0:
                self.items.append(self._item)
                self._item = None
                self._capture = None

    def handle_data(self, data):
        if self._item is None or self._capture is None:
            return
        self._item["q" if self._capture == "question" else "a"].append(data)


def clean(parts):
    text = html.unescape("".join(parts))
    return re.sub(r"\s+", " ", text).strip()


def faq_schema(markup, url):
    parser = FaqParser()
    parser.feed(markup)
    entities = []
    for item in parser.items:
        question = clean(item["q"])
        answer = clean(item["a"])
        if not question or not answer:
            sys.exit("FAQ item without a question or answer: %r" % item.get("id"))
        entities.append({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": {"@type": "Answer", "text": answer},
        })
    block = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": url + "#faqpage",
        "mainEntity": entities,
        "inLanguage": "en",
    }
    script = '<script type="application/ld+json">\n'
    script += json.dumps(block, indent=2, ensure_ascii=False)
    script += "\n</script>"
    return script, len(entities)


count = 0
for page in sorted((src / "pages").glob("*.html")):
    slug = page.stem
    markup = page.read_text(encoding="utf-8")

    if "__MASTHEAD__" not in markup or "__FOOTER__" not in markup:
        sys.exit("%s: missing __MASTHEAD__ or __FOOTER__ placeholder" % page)

    n = 0
    if "<!--FAQ_SCHEMA-->" in markup:
        canonical = re.search(r'<link rel="canonical" href="([^"]+)"', markup)
        if not canonical:
            sys.exit("%s: FAQ page without a canonical link" % page)
        script, n = faq_schema(markup, canonical.group(1))
        markup = markup.replace("<!--FAQ_SCHEMA-->", script)

    markup = (markup
              .replace("__MASTHEAD__", masthead)
              .replace("__FOOTER__", footer)
              .replace("__CSS__", css)
              .replace("__JS__", js))

    out_dir = root / slug
    out_dir.mkdir(exist_ok=True)
    (out_dir / "index.html").write_text(markup, encoding="utf-8")
    count += 1
    detail = " (%d FAQ questions in schema)" % n if n else ""
    print("wrote %s/index.html (%d bytes)%s" % (slug, len(markup.encode("utf-8")), detail))

print("pages: %d" % count)
PY

printf 'wrote %s (%s bytes)\n' "$CSS_OUT" "$(wc -c < "$CSS_OUT")"
printf 'wrote %s (%s bytes)\n' "$JS_OUT" "$(wc -c < "$JS_OUT")"
