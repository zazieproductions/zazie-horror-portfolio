#!/usr/bin/env python3
"""Build a polished PDF reading edition of the exact-name Zazie media master."""

from __future__ import annotations

import csv
import html
import re
from collections import Counter
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
IN_FILE = ROOT / "deliverables" / "Zazie_Productions_Media_Master.csv"
OUT_FILE = ROOT / "deliverables" / "Zazie_Productions_Media_Master.pdf"
CHECKED = "August 9, 2026"

# Palette (kept in sync with the workbook)
INK = colors.HexColor("#171216")
BURGUNDY = colors.HexColor("#6F1523")
BLOOD = colors.HexColor("#98263A")
EMBER = colors.HexColor("#C75B45")
BONE = colors.HexColor("#F3ECE5")
PARCHMENT = colors.HexColor("#FBF8F4")
MIST = colors.HexColor("#D7CFCA")
ASH = colors.HexColor("#6D6564")
PALE_RED = colors.HexColor("#F6E4E7")
PALE_GOLD = colors.HexColor("#F7EED8")
PALE_GREEN = colors.HexColor("#E4F0E9")
PALE_BLUE = colors.HexColor("#E6EEF5")
WHITE = colors.white

pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def clean(value: object) -> str:
    """Keep the PDF readable if a character is absent from the bundled font."""
    return str(value or "").replace("呪怨", "Ju-On")


def link(text: str, url: str, style: str = "#1F5B8F") -> str:
    return f'<a href="{esc(url)}" color="{style}"><u>{esc(text)}</u></a>'


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverKicker", fontName="DejaVu-Bold", fontSize=10, leading=13,
    textColor=EMBER, alignment=TA_CENTER, spaceAfter=10, tracking=2,
))
styles.add(ParagraphStyle(
    name="CoverTitle", fontName="DejaVu-Bold", fontSize=28, leading=32,
    textColor=BONE, alignment=TA_CENTER, spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="CoverSubtitle", fontName="DejaVu", fontSize=11, leading=16,
    textColor=MIST, alignment=TA_CENTER, spaceAfter=22,
))
styles.add(ParagraphStyle(
    name="CoverNumber", fontName="DejaVu-Bold", fontSize=42, leading=45,
    textColor=WHITE, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="CoverNumberLabel", fontName="DejaVu-Bold", fontSize=9, leading=12,
    textColor=MIST, alignment=TA_CENTER, tracking=1.2,
))
styles.add(ParagraphStyle(
    name="CoverMetric", fontName="DejaVu-Bold", fontSize=6.2, leading=8,
    textColor=MIST, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="Section", fontName="DejaVu-Bold", fontSize=19, leading=23,
    textColor=BURGUNDY, spaceBefore=6, spaceAfter=6, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="Subsection", fontName="DejaVu-Bold", fontSize=12, leading=15,
    textColor=BLOOD, spaceBefore=10, spaceAfter=5, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="BodyDV", fontName="DejaVu", fontSize=9, leading=13,
    textColor=INK, spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="SmallDV", fontName="DejaVu", fontSize=7.4, leading=9.5,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="SmallBoldDV", fontName="DejaVu-Bold", fontSize=7.4, leading=9.5,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="TinyDV", fontName="DejaVu", fontSize=6.4, leading=8.2,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="TableHeadDV", fontName="DejaVu-Bold", fontSize=6.8, leading=8,
    textColor=WHITE, alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="CalloutDV", fontName="DejaVu", fontSize=8.5, leading=12,
    textColor=INK, leftIndent=8, rightIndent=8,
))
styles.add(ParagraphStyle(
    name="TOCDV", fontName="DejaVu", fontSize=10, leading=15,
    textColor=INK, leftIndent=4,
))


class MediaMasterDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "Section":
            text = flowable.getPlainText()
            key = "section_" + re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=0, closed=False)


def first_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(INK)
    canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
    canvas.setFillColor(BLOOD)
    canvas.rect(0, letter[1] - 13, letter[0], 13, fill=1, stroke=0)
    canvas.setFillColor(EMBER)
    canvas.rect(0, 0, letter[0], 8, fill=1, stroke=0)
    canvas.restoreState()


def later_pages(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setStrokeColor(MIST)
    canvas.setLineWidth(0.5)
    canvas.line(0.48 * inch, height - 0.42 * inch, width - 0.48 * inch, height - 0.42 * inch)
    canvas.setFont("DejaVu-Bold", 7)
    canvas.setFillColor(BURGUNDY)
    canvas.drawString(0.48 * inch, height - 0.31 * inch, "ZAZIE EXACT-NAME MEDIA MASTER")
    canvas.setFont("DejaVu", 7)
    canvas.setFillColor(ASH)
    canvas.drawRightString(width - 0.48 * inch, height - 0.31 * inch, f"RESEARCHED THROUGH {CHECKED.upper()}")
    canvas.line(0.48 * inch, 0.43 * inch, width - 0.48 * inch, 0.43 * inch)
    canvas.setFont("DejaVu", 7)
    canvas.drawString(0.48 * inch, 0.27 * inch, "Zazie Productions / Zazie Kanwar-Torge")
    canvas.drawRightString(width - 0.48 * inch, 0.27 * inch, f"Page {doc.page}")
    canvas.restoreState()


with IN_FILE.open(encoding="utf-8-sig") as f:
    all_rows = list(csv.DictReader(f))

groups = [
    "Press & Editorial",
    "Film, Festivals & Exhibitions",
    "Publications & Recognition",
    "Profiles & Catalogs",
    "Music Compilations",
]
by_group = {group: [r for r in all_rows if r["Group"] == group] for group in groups}
priority_counts = Counter(r["Priority"] for r in all_rows)
source_counts = Counter(r["Source Relationship"] for r in all_rows)

# Read leads from the source script's stable list count; the workbook is canonical for details.
lead_count = 15

margin = 0.48 * inch
doc = MediaMasterDoc(
    str(OUT_FILE), pagesize=letter,
    leftMargin=margin, rightMargin=margin, topMargin=0.58 * inch, bottomMargin=0.55 * inch,
    title="Zazie Productions / Zazie Kanwar-Torge Media Master",
    author="Arena.ai Agent Mode",
    subject="Exact-name media, publications, profiles, screenings and music appearances",
)
first_frame = Frame(margin, 0.55 * inch, letter[0] - 2 * margin, letter[1] - 1.05 * inch,
                    id="first", leftPadding=18, rightPadding=18, topPadding=28, bottomPadding=20)
later_frame = Frame(margin, 0.5 * inch, letter[0] - 2 * margin, letter[1] - 0.94 * inch,
                    id="later", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[first_frame], onPage=first_page, autoNextPageTemplate="Body"),
    PageTemplate(id="Body", frames=[later_frame], onPage=later_pages),
])

story = []

# Cover
story += [
    Spacer(1, 0.55 * inch),
    Paragraph("EXACT-NAME PUBLIC-WEB CENSUS", styles["CoverKicker"]),
    Paragraph("Zazie Productions<br/>&amp; Zazie Kanwar-Torge", styles["CoverTitle"]),
    Paragraph("Media • Press • Film • Publications • Recognition • Profiles • Music appearances", styles["CoverSubtitle"]),
    HRFlowable(width="58%", thickness=1, color=BLOOD, spaceBefore=4, spaceAfter=22, hAlign="CENTER"),
    Paragraph(str(len(all_rows)), styles["CoverNumber"]),
    Paragraph("VERIFIED URL-LEVEL RECORDS", styles["CoverNumberLabel"]),
    Spacer(1, 0.28 * inch),
]
cover_metrics = [
    [Paragraph(str(len(by_group["Press & Editorial"])), styles["CoverNumberLabel"]),
     Paragraph(str(len(by_group["Film, Festivals & Exhibitions"])), styles["CoverNumberLabel"]),
     Paragraph(str(len(by_group["Publications & Recognition"])), styles["CoverNumberLabel"]),
     Paragraph(str(len(by_group["Profiles & Catalogs"])), styles["CoverNumberLabel"]),
     Paragraph(str(len(by_group["Music Compilations"])), styles["CoverNumberLabel"])],
    [Paragraph("PRESS / EDITORIAL", styles["CoverMetric"]),
     Paragraph("FILM / EXHIBITIONS", styles["CoverMetric"]),
     Paragraph("PUBLICATIONS", styles["CoverMetric"]),
     Paragraph("PROFILES", styles["CoverMetric"]),
     Paragraph("COMPILATIONS", styles["CoverMetric"])],
]
ct = Table(cover_metrics, colWidths=[1.25 * inch] * 5, rowHeights=[0.3 * inch, 0.26 * inch], hAlign="CENTER")
ct.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#261D22")),
    ("TEXTCOLOR", (0, 0), (-1, -1), BONE),
    ("BOX", (0, 0), (-1, -1), 0.6, BLOOD),
    ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#514048")),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(ct)
story += [
    Spacer(1, 0.55 * inch),
    Paragraph(f"Research current through {CHECKED}", styles["CoverSubtitle"]),
    Paragraph("PDF READING EDITION", styles["CoverKicker"]),
    PageBreak(),
]

# Executive summary
story += [
    Paragraph("Executive Summary", styles["Section"]),
    Paragraph(
        "This reading edition condenses the native Excel master into a portable, printable report. "
        "Every counted record contains at least one of the exact strings <b>“Zazie Productions”</b> or "
        "<b>“Zazie Kanwar-Torge.”</b> Unrelated Zazies and near-match-only pages are excluded.", styles["BodyDV"]),
]
summary_data = [
    [Paragraph("Measure", styles["TableHeadDV"]), Paragraph("Count", styles["TableHeadDV"]), Paragraph("Meaning", styles["TableHeadDV"])],
    [Paragraph("Verified URL-level records", styles["SmallBoldDV"]), str(len(all_rows)), Paragraph("All records in the Master Index", styles["SmallDV"])],
    [Paragraph("Priority A", styles["SmallBoldDV"]), str(priority_counts["A"]), Paragraph("Strongest external press-kit and institutional material", styles["SmallDV"])],
    [Paragraph("Priority B", styles["SmallBoldDV"]), str(priority_counts["B"]), Paragraph("Useful supporting coverage and industry records", styles["SmallDV"])],
    [Paragraph("Priority C", styles["SmallBoldDV"]), str(priority_counts["C"]), Paragraph("Profiles, catalogs, press-release context and discography material", styles["SmallDV"])],
    [Paragraph("Unverified leads", styles["SmallBoldDV"]), str(lead_count), Paragraph("Preserved in Excel but excluded from verified totals", styles["SmallDV"])],
]
st = Table(summary_data, colWidths=[2.0*inch, 0.7*inch, 4.35*inch], repeatRows=1)
st.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), BURGUNDY), ("TEXTCOLOR",(0,0),(-1,0),WHITE),
    ("BACKGROUND",(0,1),(-1,-1),PARCHMENT), ("ROWBACKGROUNDS",(0,1),(-1,-1),[PARCHMENT,BONE]),
    ("GRID",(0,0),(-1,-1),0.35,MIST), ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("ALIGN",(1,1),(1,-1),"CENTER"), ("FONTNAME",(1,1),(1,-1),"DejaVu-Bold"),
    ("FONTSIZE",(1,1),(1,-1),10), ("TEXTCOLOR",(1,1),(1,-1),BLOOD),
    ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6),
]))
story += [st, Spacer(1, 12)]

callout = Table([[Paragraph(
    "<b>Important:</b> inclusion proves that an exact-name public media record exists. It does not independently validate every promotional, biographical, award, review, or profile claim made by the source. The Excel edition labels source relationships so independent editorial is not confused with profiles or self-issued releases.",
    styles["CalloutDV"]) ]], colWidths=[7.0*inch])
callout.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1),PALE_GOLD), ("BOX",(0,0),(-1,-1),0.8,EMBER),
    ("LEFTPADDING",(0,0),(-1,-1),9), ("RIGHTPADDING",(0,0),(-1,-1),9),
    ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8),
]))
story += [callout, Spacer(1, 16)]

story += [Paragraph("Priority A Highlights", styles["Subsection"])]
highlights = [r for r in all_rows if r["Priority"] == "A"]
highlight_data = [[
    Paragraph("DATE", styles["TableHeadDV"]), Paragraph("PUBLICATION", styles["TableHeadDV"]),
    Paragraph("ITEM / FEATURE", styles["TableHeadDV"]), Paragraph("SOURCE", styles["TableHeadDV"])
]]
for r in highlights:
    highlight_data.append([
        Paragraph(esc(r["Published"]), styles["TinyDV"]),
        Paragraph(esc(r["Publication / Platform"]), styles["SmallBoldDV"]),
        Paragraph(f'<b>{esc(clean(r["Title / Item"]))}</b><br/><font color="#6D6564">{esc(r["How Featured"])}</font>', styles["TinyDV"]),
        Paragraph(link("OPEN", r["Direct Link"]), styles["TinyDV"]),
    ])
ht = Table(highlight_data, colWidths=[0.7*inch, 1.35*inch, 4.35*inch, 0.65*inch], repeatRows=1)
ht.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),BURGUNDY), ("ROWBACKGROUNDS",(0,1),(-1,-1),[PARCHMENT,WHITE]),
    ("GRID",(0,0),(-1,-1),0.3,MIST), ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("TOPPADDING",(0,0),(-1,-1),5), ("BOTTOMPADDING",(0,0),(-1,-1),5),
]))
story += [ht, PageBreak()]

# Contents and methodology
story += [Paragraph("Contents & Method", styles["Section"])]
for idx, group in enumerate(groups, 1):
    story.append(Paragraph(f'<b>{idx}.</b> {esc(group)} <font color="#98263A">({len(by_group[group])})</font>', styles["TOCDV"]))
story += [
    Spacer(1, 10),
    Paragraph("Inclusion standard", styles["Subsection"]),
    Paragraph(
        "Counted records must render or be publicly indexed with at least one exact target name. A handle such as “ZazieProductions” without a space is insufficient by itself. Pages that contain only spelling variants, a different company such as Zazie Films, the French singer Zazie, or similarly named producers are excluded.", styles["BodyDV"]),
    Paragraph("Record unit", styles["Subsection"]),
    Paragraph(
        "Most rows represent one distinct URL-level media item. Separate editions or syndications may have separate rows. Music appearances are one row per compilation listing currently displayed on the exact-name Discogs artist index.", styles["BodyDV"]),
    Paragraph("Verification language", styles["Subsection"]),
    Paragraph(
        "“Direct page verified” means the live page was read. “Search-index verified” means the result index visibly preserved the exact name, often where a client-rendered or restricted page prevented full extraction. Unresolved claims remain leads in the Excel workbook and are not counted here.", styles["BodyDV"]),
    Paragraph("Best-effort boundary", styles["Subsection"]),
    Paragraph(
        "No public-web search can prove absolute completeness across deleted, private, paywalled, print-only, social-only, unindexed, or region-restricted media. This edition is an extensive, reproducible census through the date on the cover.", styles["BodyDV"]),
    PageBreak(),
]


def general_table(group_rows: list[dict]) -> Table:
    data = [[
        Paragraph("P", styles["TableHeadDV"]), Paragraph("DATE", styles["TableHeadDV"]),
        Paragraph("PUBLICATION", styles["TableHeadDV"]), Paragraph("TITLE / HOW FEATURED", styles["TableHeadDV"]),
        Paragraph("EXACT NAME", styles["TableHeadDV"]), Paragraph("LINK", styles["TableHeadDV"]),
    ]]
    for r in group_rows:
        priority_color = {"A":"#2E6B47", "B":"#9A6719", "C":"#6D6564"}.get(r["Priority"], "#171216")
        detail = esc(r["How Featured"])
        if r["Work / Subject"]:
            detail += f'<br/><font color="#6D6564">Subject: {esc(clean(r["Work / Subject"]))}</font>'
        data.append([
            Paragraph(f'<b><font color="{priority_color}">{esc(r["Priority"])}</font></b>', styles["SmallDV"]),
            Paragraph(esc(r["Published"]), styles["TinyDV"]),
            Paragraph(f'<b>{esc(r["Publication / Platform"])}</b><br/><font color="#6D6564">{esc(r["Media Type"])}</font>', styles["TinyDV"]),
            Paragraph(f'<b>{esc(clean(r["Title / Item"]))}</b><br/>{detail}', styles["TinyDV"]),
            Paragraph(esc(r["Exact Name Matched"]), styles["TinyDV"]),
            Paragraph(link("OPEN", r["Direct Link"]), styles["TinyDV"]),
        ])
    t = Table(data, colWidths=[0.27*inch, 0.63*inch, 1.2*inch, 3.55*inch, 1.1*inch, 0.52*inch], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),BURGUNDY), ("ROWBACKGROUNDS",(0,1),(-1,-1),[PARCHMENT,WHITE]),
        ("GRID",(0,0),(-1,-1),0.25,MIST), ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("ALIGN",(0,1),(0,-1),"CENTER"), ("ALIGN",(-1,1),(-1,-1),"CENTER"),
        ("TOPPADDING",(0,0),(-1,-1),4), ("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),3.5), ("RIGHTPADDING",(0,0),(-1,-1),3.5),
    ]))
    return t


for group in groups[:-1]:
    story += [
        Paragraph(group, styles["Section"]),
        Paragraph(f"{len(by_group[group])} verified URL-level records. Links are clickable; use the Excel edition for full evidence notes, filtering, secondary URLs and source-relationship fields.", styles["BodyDV"]),
        general_table(by_group[group]),
        PageBreak(),
    ]

# Music compilation section
story += [
    Paragraph("Music Compilations", styles["Section"]),
    Paragraph(
        "Discogs currently displays 60 compilation rows under the exact-name Zazie Productions artist appearance index. Its header summarizes these as 58 appearances because grouped/master-release handling can differ from visible row count.", styles["BodyDV"]),
]
mc_data = [[
    Paragraph("#", styles["TableHeadDV"]), Paragraph("YEAR", styles["TableHeadDV"]),
    Paragraph("COMPILATION", styles["TableHeadDV"]), Paragraph("TRACK / CONTRIBUTION", styles["TableHeadDV"]),
    Paragraph("LABEL / PUBLISHER", styles["TableHeadDV"]), Paragraph("LINK", styles["TableHeadDV"]),
]]
for idx, r in enumerate(by_group["Music Compilations"], 1):
    mc_data.append([
        Paragraph(str(idx), styles["TinyDV"]), Paragraph(esc(r["Year"] or "—"), styles["TinyDV"]),
        Paragraph(f'<b>{esc(clean(r["Title / Item"]))}</b>', styles["TinyDV"]),
        Paragraph(esc(clean(r["Work / Subject"])), styles["TinyDV"]),
        Paragraph(esc(r["Publication / Platform"]), styles["TinyDV"]),
        Paragraph(link("OPEN", r["Direct Link"]), styles["TinyDV"]),
    ])
mt = Table(mc_data, colWidths=[0.3*inch, 0.46*inch, 2.65*inch, 1.82*inch, 1.5*inch, 0.54*inch], repeatRows=1)
mt.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),BURGUNDY), ("ROWBACKGROUNDS",(0,1),(-1,-1),[PARCHMENT,WHITE]),
    ("GRID",(0,0),(-1,-1),0.25,MIST), ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("ALIGN",(0,1),(1,-1),"CENTER"), ("ALIGN",(-1,1),(-1,-1),"CENTER"),
    ("TOPPADDING",(0,0),(-1,-1),3.5), ("BOTTOMPADDING",(0,0),(-1,-1),3.5),
    ("LEFTPADDING",(0,0),(-1,-1),3), ("RIGHTPADDING",(0,0),(-1,-1),3),
]))
story += [mt, PageBreak()]

# Final usage page
story += [
    Paragraph("Using This Master", styles["Section"]),
    Paragraph("Recommended press-kit order", styles["Subsection"]),
    Paragraph(
        "Lead with Priority A independent editorial and institutional sources. Use Priority B for supporting context. Keep profiles, self-issued releases, streaming pages and catalog entries in a supplemental credits or links section rather than presenting them as independent coverage.", styles["BodyDV"]),
    Paragraph("Excel vs. PDF", styles["Subsection"]),
    Paragraph(
        f'The native Excel file contains all {len(all_rows)} verified records across focused tabs, clickable direct and secondary links, exact-name evidence, verification status, confidence, source relationship, press-kit guidance, {lead_count} unresolved leads, exclusion rules and the research log. This PDF is the condensed reading and printing edition.', styles["BodyDV"]),
    Paragraph("Files", styles["Subsection"]),
    Paragraph("• Zazie_Productions_Media_Master.xlsx — native Excel workbook<br/>• Zazie_Productions_Media_Master.pdf — this reading edition<br/>• Zazie_Productions_Media_Master.csv — flat Master Index export", styles["BodyDV"]),
    Spacer(1, 18),
]
closing = Table([[Paragraph(
    f'<b>STRICT EXACT-NAME EDITION</b><br/><br/>133 verified URL-level records • 15 isolated follow-up leads • researched through {CHECKED}<br/><br/><font color="#6D6564">Only “Zazie Productions” and “Zazie Kanwar-Torge” qualify as target names.</font>',
    ParagraphStyle("Closing", parent=styles["BodyDV"], alignment=TA_CENTER, leading=14)
)]], colWidths=[6.6*inch])
closing.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1),BONE), ("BOX",(0,0),(-1,-1),1,BLOOD),
    ("TOPPADDING",(0,0),(-1,-1),18), ("BOTTOMPADDING",(0,0),(-1,-1),18),
    ("LEFTPADDING",(0,0),(-1,-1),18), ("RIGHTPADDING",(0,0),(-1,-1),18),
]))
story.append(closing)

doc.build(story)
print(f"Built {OUT_FILE.relative_to(ROOT)} ({OUT_FILE.stat().st_size:,} bytes)")
