#!/usr/bin/env python3
"""Build the Zazie Productions press kit PDFs from the same facts as /press.

Outputs (both committed, both linked from https://horror.zazieproductions.com/press):

    press/zazie-productions-press-kit-2026.pdf   4 pages  (cover, facts, recognition, coverage)
    press/zazie-productions-one-sheet-2026.pdf   1 page   (deadline one-sheet)

Run:  python3 press-src/build-press-pdf.py
Deps: reportlab, qrcode[pil], pillow   (see press-src/README.md)

Everything printed here is sourced in legal-src/pages/press.html. If a fact
changes, change it in both places in the same commit.
"""

from __future__ import annotations

import pathlib

import qrcode
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ROOT / "press-src" / "fonts"
OUT = ROOT / "press"
SITE = "https://horror.zazieproductions.com/press"
KIT = "v1.0 · 18 September 2026"

# --- Brand ------------------------------------------------------------------
VOID = colors.HexColor("#030303")
INK = colors.HexColor("#0b0b0b")
BONE = colors.HexColor("#f0ebe3")
MIST = colors.HexColor("#9a9590")
BLOOD = colors.HexColor("#c41e1e")
BLOOD_TEXT = colors.HexColor("#a01717")
ASH = colors.HexColor("#d8d4cd")
PAPER = colors.HexColor("#fbfaf8")
BODY = colors.HexColor("#1d1c1a")

pdfmetrics.registerFont(TTFont("Cormorant", str(FONTS / "Cormorant-Regular.ttf")))
pdfmetrics.registerFont(TTFont("CormorantIt", str(FONTS / "Cormorant-Italic.ttf")))
pdfmetrics.registerFont(TTFont("Inter", str(FONTS / "Inter-Regular.ttf")))
pdfmetrics.registerFont(TTFont("InterMed", str(FONTS / "Inter-Medium.ttf")))
pdfmetrics.registerFont(TTFont("InterSemi", str(FONTS / "Inter-SemiBold.ttf")))


def label(color=BLOOD_TEXT, size=6.6, space=1.5) -> ParagraphStyle:
    return ParagraphStyle(
        "label", fontName="InterMed", fontSize=size, leading=size * 1.6,
        textColor=color, spaceAfter=space,
    )


def body(text_size=9.2, color=BODY, leading=None, font="Inter") -> ParagraphStyle:
    return ParagraphStyle(
        "body", fontName=font, fontSize=text_size,
        leading=leading or text_size * 1.5, textColor=color, alignment=TA_LEFT,
    )


H1 = ParagraphStyle("h1", fontName="Cormorant", fontSize=30, leading=31, textColor=BONE)
H1_DARK = ParagraphStyle("h1d", parent=H1, textColor=VOID)
H2 = ParagraphStyle("h2", fontName="Cormorant", fontSize=19, leading=21, textColor=VOID, spaceAfter=2)
H2_LIGHT = ParagraphStyle("h2l", parent=H2, textColor=BONE)
LEAD = body(9.6, colors.HexColor("#4a4845"), 15.4)
QUOTE = ParagraphStyle(
    "quote", fontName="Cormorant", fontSize=13.5, leading=16.5, textColor=VOID, spaceAfter=2,
)


class Rule(Flowable):
    """A hairline rule in the brand red or the page ink."""

    def __init__(self, width, thickness=0.7, color=BLOOD, space_before=4, space_after=4):
        Flowable.__init__(self)
        self.width = width
        self.thickness = thickness
        self.color = color
        self.sb = space_before
        self.sa = space_after
        self.height = thickness + self.sb + self.sa

    def wrap(self, aw, ah):
        self.width = aw
        return (aw, self.height)

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, self.sa, self.width, self.sa)


def qr_png(url: str, path: pathlib.Path, box: int = 8, border: int = 1) -> pathlib.Path:
    qr = qrcode.QRCode(version=None, box_size=box, border=border)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#030303", back_color="white")
    img.save(path)
    return path


def kv_table(rows, width, key_color=BLOOD_TEXT, val_color=BODY, key_size=6.6, val_size=8.6):
    data = [
        [Paragraph(k.upper(), label(key_color, key_size)), Paragraph(v, body(val_size, val_color, val_size * 1.42))]
        for k, v in rows
    ]
    t = Table(data, colWidths=[width * 0.235, width * 0.765])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.35, colors.HexColor("#e3ded6")),
    ]))
    return t


def boxed(flowables, pad=9, border=ASH, bg=None, accent=BLOOD, width=170 * mm):
    t = Table([[flowables]], colWidths=[width])
    style = [
        ("LEFTPADDING", (0, 0), (-1, -1), pad),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
        ("BOX", (0, 0), (-1, -1), 0.5, border),
        ("LINEBEFORE", (0, 0), (0, -1), 1.6, accent),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    if bg is not None:
        style.append(("BACKGROUND", (0, 0), (-1, -1), bg))
    t.setStyle(TableStyle(style))
    return t


def page_deco(canv, doc):
    """Footer + hairline for interior (light) pages."""
    canv.saveState()
    canv.setStrokeColor(ASH)
    canv.setLineWidth(0.5)
    canv.line(18 * mm, 16 * mm, A4[0] - 18 * mm, 16 * mm)
    canv.setFont("Inter", 6.3)
    canv.setFillColor(colors.HexColor("#6f6b66"))
    canv.drawString(18 * mm, 11.6 * mm, "Zazie Productions LLC · Press kit %s · horror.zazieproductions.com/press" % KIT)
    canv.drawRightString(A4[0] - 18 * mm, 11.6 * mm, "Page %d" % doc.page)
    canv.restoreState()


def cover_deco(canv, doc):
    canv.saveState()
    canv.setFillColor(VOID)
    canv.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
    canv.setFillColor(BLOOD)
    canv.rect(0, 0, A4[0], 4, stroke=0, fill=1)
    canv.restoreState()


def build_press_kit(path: pathlib.Path, pages_label: int = 5) -> None:
    doc = BaseDocTemplate(
        str(path), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=17 * mm, bottomMargin=22 * mm,
        title="Zazie Productions — Press Kit 2026 (Zazie Kanwar-Torge, psychological horror composer)",
        author="Zazie Productions LLC",
        subject="Electronic press kit: recognition record, approved bios, pull quotes, press assets and contact.",
        keywords="press kit, EPK, psychological horror composer, Ars Electronica 2026, Golden Bloody Globes 2026, Zazie Kanwar-Torge",
    )
    w = A4[0] - 36 * mm
    cover_frame = Frame(18 * mm, 20 * mm, w, A4[1] - 40 * mm, id="cover")
    body_frame = Frame(18 * mm, 22 * mm, w, A4[1] - 40 * mm, id="body")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_deco),
        PageTemplate(id="body", frames=[body_frame], onPage=page_deco),
    ])

    pad = 8
    story: list = []

    # ---------------------------------------------------------------- cover ---
    story.append(Paragraph("ZAZIE PRODUCTIONS LLC · ELECTRONIC PRESS KIT", label(BLOOD_TEXT, 7.2, 2)))
    story.append(Paragraph("Zazie<br/>Kanwar-Torge", H1))
    story.append(Rule(w, 1.2, BLOOD, 6, 8))
    story.append(Paragraph(
        "Psychological horror composer · multi-instrumentalist · founder of Zazie Productions LLC, Asheville, North Carolina.",
        body(10.6, BONE, 16),
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "Two 2026 international selections: <b>Slippage Beyond the Hyperlink</b>, performed at the Ars Electronica Festival's "
        "Sonic Saturday in the Sonic Lab of Anton Bruckner University, Linz, and the original score for <b>Are You Real?</b>, "
        "an official selection of the Golden Bloody Globes Film Festival, Los Angeles. Earlier recognition: the Visual Container "
        "Winter 2024 Award and selection as a BMC Radio Artist by the Black Mountain College Museum + Arts Center, Asheville FM "
        "and Make Noise.",
        body(9.4, colors.HexColor("#cfc9c1"), 14.6),
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "Inside: the fact sheet · approved boilerplate in three lengths · both 2026 selections in detail · the 2021–2026 recognition "
        "timeline · quotable critical response · press assets and credit wording · the press desk, with a 48-hour reply target.",
        body(8.6, MIST, 13.4),
    ))
    story.append(Spacer(1, 8 * mm))

    hero = Image(str(ROOT / "images" / "hero-portrait.jpg"), width=42 * mm, height=54 * mm)
    qr = Image(str(qr_png(SITE, pathlib.Path("/tmp/zp-qr.png"))), width=22 * mm, height=22 * mm)
    contact = [
        Paragraph("FULL KIT ONLINE", label(BLOOD_TEXT, 6.6, 3)),
        Paragraph('<link href="%s"><font color="#f0ebe3">horror.zazie<br/>productions.com/press</font></link>' % SITE,
                  body(9.0, BONE, 12.6)),
        Spacer(1, 3 * mm),
        Paragraph("PRESS DESK", label(BLOOD_TEXT, 6.6, 3)),
        Paragraph('<link href="mailto:zaziediya@gmail.com"><font color="#f0ebe3">zaziediya@gmail.com</font></link>',
                  body(9.0, BONE, 12.6)),
        Paragraph("Reply target 48 hours", body(8.2, MIST, 11.6)),
    ]
    side = Table([[qr], [Spacer(1, 4 * mm)], [contact]], colWidths=[44 * mm])
    side.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    grid = Table([[hero, side]], colWidths=[52 * mm, w - 52 * mm])
    grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(grid)
    story.append(Spacer(1, 8 * mm))

    at_a_glance = [
        ["2026", "Ars Electronica Festival", "Slippage Beyond the Hyperlink · Sonic Lab, Linz"],
        ["2026", "Golden Bloody Globes", "Are You Real? · Official Selection, Los Angeles"],
        ["2025", "Visual Container", "Winter 2024 Award Winner"],
        ["2021", "Black Mountain College", "BMC Radio Artist · museum, Asheville FM, Make Noise"],
    ]
    rows = [[Paragraph("<b>%s</b>" % y, body(7.6, BLOOD_TEXT, 11)),
             Paragraph("<b>%s</b>" % what, body(8.4, BONE, 12.2)),
             Paragraph(where, body(8.0, colors.HexColor("#b8b2aa"), 12))] for y, what, where in at_a_glance]
    t = Table(rows, colWidths=[w * 0.10, w * 0.36, w * 0.54])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#2a2724")),
        ("LINEBELOW", (0, 0), (-1, 0), 0.7, BLOOD),
    ]))
    story.append(Paragraph("RECOGNITION AT A GLANCE", label(BLOOD_TEXT, 6.6, 3)))
    story.append(t)
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph(
        "Twelve press images cleared for editorial use · 29-cue showreel · eight scored productions · rates published in full · "
        "features in Grammy Weekly, Limitless Magazine and Billboard Wire · review in Lake Ivan Film Journal.",
        body(8.0, MIST, 12.6),
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("PRESS KIT %s · %d PAGES + ONE-SHEET · COMPILED BY ZAZIE PRODUCTIONS LLC" % (KIT.upper(), pages_label),
                           label(colors.HexColor("#7d7770"), 6.4, 0)))

    story.append(NextPageTemplate("body"))
    story.append(PageBreak())

    # ------------------------------------------------------------- page 2 ---
    def head(kicker, title, lead, air=6.5 * mm):
        return ([Spacer(1, air)] if air else []) + [
            Paragraph(kicker.upper(), label(BLOOD_TEXT, 6.8, 3)),
            Paragraph(title, H2),
            Rule(w, 0.6, colors.HexColor("#e0dbd3"), 2, 6),
            Paragraph(lead, LEAD),
            Spacer(1, 4 * mm),
        ]

    story += head("Section I", "Fact sheet",
                  "Every line is verifiable from a public source and dated. Sources are linked in the online kit.", air=0)

    story.append(kv_table([
        ("Artist", "Zazie Kanwar-Torge — composer, multi-instrumentalist, sound designer, producer"),
        ("Entity", "Zazie Productions LLC · Asheville, North Carolina, USA"),
        ("Practice", "Original scores written to picture: hybrid orchestral dread, ambient minimalism, bowed metal, struck "
                     "strings, waterphone, custom synthesiser builds, granular and tape-decay work. No library music."),
        ("Genres", "Psychological horror, folk horror, body horror, supernatural thriller, cosmic horror, techno thriller, dark sci-fi"),
        ("Formats", "Shorts, features, series episodes, games and interactive, trailers, plus acousmatic and multichannel concert works"),
        ("Screen credits", "EXPIRE · UNSEEN · PEREGRINUS · Phantom Requiem · ECLIPSED · THE HAUNTED · CHOLERIC · MIKE HAS A VISITOR "
                           "· Are You Real? (2026) · Slippage Beyond the Hyperlink (2026, concert work)"),
        ("Showreel", "29 original dark cinematic cues — horror.zazieproductions.com/reel"),
        ("2026 recognition", "Ars Electronica Festival 2026 (Linz, Austria) · Golden Bloody Globes Film Festival 2026 (Los Angeles, USA)"),
        ("Earlier recognition", "Visual Container Winter 2024 Award Winner · BMC Radio Artist 2021"),
        ("Coverage", "Grammy Weekly · Limitless Magazine · Billboard Wire · Lake Ivan Film Journal"),
        ("Rates", "Micro and student films from $50 · shorts from $2,500 · features and episodes from $8,000 · games from $4,500"),
        ("Press contact", "zaziediya@gmail.com · reply target 48 hours · zazieproductions.com/contact"),
    ], w))

    story.append(Spacer(1, 7 * mm))
    story += head("Section II", "Approved boilerplate",
                  "Checked against the online kit. Everything below is safe to reproduce; pick the length that fits your column.")

    bios = [
        ("25 words · listings, captions", "Zazie Kanwar-Torge is a psychological horror composer and multi-instrumentalist in "
         "Asheville, NC, writing original dark, atmospheric, cinematic scores for film, TV and games."),
        ("50 words · programmes, press notes", "Zazie Kanwar-Torge is a psychological horror composer, multi-instrumentalist and "
         "founder of Zazie Productions LLC, writing original scores for psychological horror, folk horror, body horror and dark "
         "sci-fi. Work selected in 2026 for the Ars Electronica Festival in Linz and the Golden Bloody Globes Film Festival in Los Angeles."),
        ("100 words · features, interviews", "Zazie Kanwar-Torge is a psychological horror composer and multi-instrumentalist "
         "operating as Zazie Productions LLC from Asheville, North Carolina. The practice is composition-first and built to picture: "
         "hybrid orchestral dread, ambient minimalism, bowed metal, struck strings, waterphone and custom synthesiser builds. Screen "
         "work spans shorts, features, series and games, including EXPIRE, UNSEEN, PEREGRINUS, Phantom Requiem and Are You Real? — a "
         "2026 Golden Bloody Globes official selection. In 2026 the multichannel work Slippage Beyond the Hyperlink was performed at "
         "the Ars Electronica Festival's Sonic Saturday in the Sonic Lab, Linz."),
    ]
    for idx, (kicker, text) in enumerate(bios):
        if idx == 2:
            # 100-word and 150-word versions start a page so nothing strands.
            story.append(PageBreak())
            story += head("Section II, continued", "Approved boilerplate, long form",
                          "Features, interviews, artist statements and sleeve notes. Both versions were checked against the online kit "
                          "on 18 September 2026.", air=0)
        story.append(KeepTogether([
            boxed([Paragraph(kicker.upper(), label(BLOOD_TEXT, 6.4, 3)), Paragraph(text, body(9.0, BODY, 14))], pad, ASH, None, BLOOD, w),
            Spacer(1, 2.5 * mm),
        ]))
    story.append(KeepTogether([
        boxed([Paragraph("150 WORDS · ARTIST STATEMENTS, PANEL INTRODUCTIONS, SLEEVE NOTES", label(BLOOD_TEXT, 6.4, 3)),
               Paragraph(
                   "Zazie Kanwar-Torge is a psychological horror composer, multi-instrumentalist and producer working as Zazie "
                   "Productions LLC from Asheville, North Carolina. Scores are written to picture rather than pulled from a library: "
                   "slow-burn dread beds, dissociative harmony, sub-frequency weight and motifs built to survive the festival cut. "
                   "The palette is hybrid — orchestral colour, bowed metal, struck strings, waterphone, granular synthesis, tape decay "
                   "and custom synthesiser builds. Credits include EXPIRE, UNSEEN, PEREGRINUS, Phantom Requiem, ECLIPSED, "
                   "THE HAUNTED, CHOLERIC and MIKE HAS A VISITOR, plus the original score for Are You Real? (2026), an official "
                   "selection of the Golden Bloody Globes Film Festival in Los Angeles. Selected in 2026 from the international call "
                   "for contributions, the multichannel electroacoustic work Slippage Beyond the Hyperlink was performed at the Ars "
                   "Electronica Festival's Sonic Saturday, in the Sonic Lab of Anton Bruckner University, Linz. Recognition also "
                   "includes the Visual Container Winter 2024 Award and selection as a BMC Radio Artist by the Black Mountain College "
                   "Museum + Arts Center, Asheville FM and Make Noise.",
                   body(9.0, BODY, 14))], pad, ASH, None, BLOOD, w),
        Spacer(1, 2.5 * mm),
    ]))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        "Credit wording, use exactly: <b>Music by Zazie Kanwar-Torge</b> (end crawl, main titles, billing block) · "
        "<b>Original score by Zazie Kanwar-Torge (Zazie Productions)</b> (festival listings, press notes, programme) · "
        "<b>Photo: Zazie Productions. Used with permission.</b>",
        body(8.4, colors.HexColor("#4a4845"), 13.4),
    ))
    # --------------------------------------------------- 2026 recognitions ---
    story += head("Section III", "2026 recognitions",
                  "Two international selections in one year: a multichannel concert work chosen from an international call, and a "
                  "film score carried into a Los Angeles festival selection.")
    story.append(KeepTogether(boxed([
        Paragraph("ARS ELECTRONICA FESTIVAL 2026 · LINZ, AUSTRIA", label(BLOOD_TEXT, 6.6, 3)),
        Paragraph("<b>Slippage Beyond the Hyperlink</b> — Sonic Saturday, Sonic Lab", ParagraphStyle(
            "ph", fontName="Cormorant", fontSize=15, leading=17, textColor=VOID, spaceAfter=4)),
        Paragraph(
            "Immersive electroacoustic work assembled from degraded field recordings, manipulated found objects, synthetic ASMR "
            "textures, granular synthesis, corrupted signal chains and unstable digital artefacts. Selected from the international "
            "call for contributions for <i>Sonic Saturday: Audible Futures, Silent Decisions</i> and performed in the MEDIUM SONORUM "
            "closing concert through the Sonic Lab's 20.4-channel system.",
            body(8.8, BODY, 13.6)),
        Spacer(1, 2 * mm),
        Paragraph(
            "<b>Work</b> Slippage Beyond the Hyperlink (2026), 2:15 · <b>Date</b> Saturday 12 September 2026, 20:00 · "
            "<b>Venue</b> Sonic Lab, Anton Bruckner University Linz · <b>Programmed with</b> Xizan Liu (CN), Marta Zigante (IT), "
            "Wei-Yin Lo (TW), Jonty Harrison (GB), Chuowen Liang (CN) · <b>Admission</b> free",
            body(8.2, colors.HexColor("#4a4845"), 13)),
    ], pad, ASH, colors.HexColor("#f6f4f1"), BLOOD, w)))
    story.append(Spacer(1, 4 * mm))
    story.append(KeepTogether(boxed([
        Paragraph("GOLDEN BLOODY GLOBES FILM FESTIVAL 2026 · LOS ANGELES, USA", label(BLOOD_TEXT, 6.6, 3)),
        Paragraph("<i>Are You Real?</i> — original score, Best of the Festival nominee", ParagraphStyle(
            "ph2", fontName="Cormorant", fontSize=15, leading=17, textColor=VOID, spaceAfter=4)),
        Paragraph(
            "Original score by Zazie Kanwar-Torge for Aaron Alexander Bergen's short. Official Selection, nominated for Best of the "
            "Festival, with the audience vote taken after the screening block.",
            body(8.8, BODY, 13.6)),
        Spacer(1, 2 * mm),
        Paragraph(
            "<b>Film</b> Are You Real? — after a late-night FaceTime, a young man begins to suspect his girlfriend may have been dead "
            "for a week · <b>Date</b> Sunday 4 October 2026, doors 10:30, screenings 11:10, awards 12:15 · <b>Venue</b> Broadwater "
            "Theater, Main Stage, 1076 Lillian Way, Los Angeles, CA",
            body(8.2, colors.HexColor("#4a4845"), 13)),
    ], pad, ASH, colors.HexColor("#f6f4f1"), BLOOD, w)))

    story.append(Spacer(1, 7 * mm))
    story += head("Section IV", "Recognition timeline, 2021 – 2026",
                  "Newest first. Every entry links to its source in the online kit.", air=7 * mm)

    rows = [[Paragraph(h.upper(), label(VOID, 6.2)) for h in ("Date", "Recognition", "Source")]]
    timeline = [
        ("12 Sep 2026", "<b>Ars Electronica Festival 2026</b> — <i>Slippage Beyond the Hyperlink</i>, MEDIUM SONORUM closing concert, Sonic Lab, Linz",
         "ars.electronica.art", "https://ars.electronica.art/negotiatinghumanity/en/view/medium-sonorum-closing-concert-38238ddb450c80528618dd4d375c272d/"),
        ("12 Sep 2026", "<b>Ars Electronica Festival 2026</b> — Sonic Saturday: Audible Futures, Silent Decisions, festival programme entry",
         "ars.electronica.art", "https://ars.electronica.art/negotiatinghumanity/en/view/sonic-saturday-audible-futures-silent-decisions-38238ddb450c80f8881dccf6abfc5734/"),
        ("4 Oct 2026", "<b>Golden Bloody Globes Film Festival</b> — <i>Are You Real?</i>, Official Selection and Best of the Festival nominee, Los Angeles",
         "hollywoodsff.org", "https://www.hollywoodsff.org/bloody2026.html"),
        ("12 Jun 2026", "<b>Limitless Magazine</b> — feature, “Forget ASMR. This Will Rewire Your Whole Nervous System”",
         "limitless-magazine.com", "https://limitless-magazine.com/2026/06/12/forget-asmr-zazie-productions-will-rewire-your-whole-nervous-system/"),
        ("24 Mar 2025", "<b>Lake Ivan Film Journal</b> — “Spinning in the Wildness: Phantom Requiem” reviewed by David Finkelstein",
         "lakeivan.substack.com", "https://lakeivan.substack.com/p/spinning-in-the-wildness-phantom"),
        ("Jan 2025", "<b>Visual Container</b> — Winter 2024 Award Winner, published winners press release",
         "visualcontainer.tv (PDF)", "https://www.visualcontainer.tv/wp-content/uploads/2025/01/Winter-2024-Award-Winners_Press-Release.pdf"),
        ("2021", "<b>BMC Radio Artist</b> — selected as one of five by Black Mountain College Museum + Arts Center, Asheville FM and Make Noise",
         "blackmountaincollege.org", "https://www.blackmountaincollege.org/broadcast-bmc-radio-artist-zazie-productions/"),
    ]
    for d, what, src, href in timeline:
        rows.append([
            Paragraph(d, body(7.8, BLOOD_TEXT, 11.4)),
            Paragraph(what, body(8.4, BODY, 12.8)),
            Paragraph('<link href="%s"><font color="#6f6b66">%s</font></link>' % (href, src), body(7.4, colors.HexColor("#6f6b66"), 11)),
        ])
    t = Table(rows, colWidths=[w * 0.16, w * 0.62, w * 0.22])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.35, colors.HexColor("#e3ded6")),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, VOID),
    ]))
    story.append(t)
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "Status note: the Black Mountain College programme page currently lists the radio broadcast as postponed, date TBD — check "
        "with BMCM+AC before citing an air date. Screening history outside these entries: eight scored productions, listed at "
        "horror.zazieproductions.com/work.",
        body(7.8, colors.HexColor("#6f6b66"), 12.4),
    ))
    # -------------------------------------------------------------- quotes ---
    story += head("Section V", "Critical response",
                  "From David Finkelstein's review of Phantom Requiem (2024) in Lake Ivan Film Journal, 24 March 2025. "
                  "Cleared for quotation with attribution.")
    for q in [
        "“A nightmare, but an incredibly detailed, specific kind of nightmare.”",
        "“The music, which is often structured into layers of repeating melodic motifs, starts off in a gothic mood, with strings, organ, and church bells.”",
        "“The originality of the imagery is startling, and Kanwar-Torge has painstakingly assembled these layers of imagery and music into a gushingly assaultive onslaught with finesse and precision.”",
        "“You will feel chill winds blowing through you for a long while after your five minutes with this powerful little film.”",
    ]:
        story.append(KeepTogether([
            boxed([Paragraph(q, QUOTE), Paragraph("DAVID FINKELSTEIN · LAKE IVAN FILM JOURNAL", label(BLOOD_TEXT, 6.2, 0))],
                  pad, ASH, None, BLOOD, w),
            Spacer(1, 2.4 * mm),
        ]))

    story.append(PageBreak())
    story += head("Section VI", "Press photos and assets",
                  "Twelve images cleared for editorial, festival, programme and press use with the caption "
                  "“Photo: Zazie Productions. Used with permission.” All files download without a login from the online kit.", air=0)

    assets = [
        ("Hero portrait", "hero-portrait.jpg / .avif", "896 × 1152 px · 218 KB"),
        ("Press photo", "press-photo.jpg", "680 × 736 px · 62 KB"),
        ("Headshot", "headshot.jpg / .avif", "864 × 996 px · 72 KB"),
        ("Eight production posters", "posters/*-1200.jpg and *-640.jpg", "1200 px tall · 27–236 KB each"),
        ("Review illustration", "posters/phantom-requiem-1200.jpg", "600 × 800 px · 47 KB"),
    ]
    rows = [[Paragraph(h.upper(), label(VOID, 6.2)) for h in ("Asset", "File", "Size")]]
    for a, b, c in assets:
        rows.append([Paragraph(a, body(8.4, BODY, 12.6)), Paragraph(b, body(8.0, colors.HexColor("#4a4845"), 12.2)),
                     Paragraph(c, body(8.0, colors.HexColor("#4a4845"), 12.2))])
    t = Table(rows, colWidths=[w * 0.30, w * 0.42, w * 0.28])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, 0), (-1, -2), 0.35, colors.HexColor("#e3ded6")),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, VOID),
    ]))
    story.append(t)
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "Not cleared: advertising, merchandise, AI or machine-training use, or any use that alters the credit. Standard editorial "
        "cropping is fine. Rights position in full: horror.zazieproductions.com/licensing",
        body(7.8, colors.HexColor("#6f6b66"), 12.4),
    ))

    story.append(Spacer(1, 6 * mm))
    story += head("Section VII", "Contact and booking",
                  "One desk, one reply target, everything in writing.")
    story.append(boxed([
        Paragraph("PRESS DESK", label(BLOOD_TEXT, 6.6, 3.5)),
        Paragraph('<link href="mailto:zaziediya@gmail.com"><b>zaziediya@gmail.com</b></link> · reply target 48 hours · '
                  'mark press deadlines in the subject line', body(9.4, BODY, 14)),
        Spacer(1, 2 * mm),
        Paragraph('Form <link href="https://horror.zazieproductions.com/contact"><font color="#4a4845">'
                  'horror.zazieproductions.com/contact</font></link> · Based in Asheville, NC, USA (US Eastern) · interviews in '
                  'English · remote by default, travel for screenings, panels and sessions',
                  body(8.6, colors.HexColor("#4a4845"), 13.4)),
        Spacer(1, 2 * mm),
        Paragraph("On request: score excerpts, stems for review, high-resolution stills, screener links, quotes, interview slots.",
                  body(8.6, colors.HexColor("#4a4845"), 13.4)),
    ], pad, ASH, colors.HexColor("#f6f4f1"), BLOOD, w))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "Kit %s · compiled by Zazie Productions LLC · recognition, dates and quotes are sourced and dated; corrections welcome."
        % KIT,
        body(7.6, colors.HexColor("#6f6b66"), 12),
    ))

    doc.build(story)


def build_one_sheet(path: pathlib.Path) -> None:
    doc = BaseDocTemplate(
        str(path), pagesize=A4,
        leftMargin=16 * mm, rightMargin=16 * mm, topMargin=15 * mm, bottomMargin=18 * mm,
        title="Zazie Productions — One-Sheet 2026 (Zazie Kanwar-Torge, psychological horror composer)",
        author="Zazie Productions LLC",
        subject="One-page press one-sheet: recognition, bios, quotes, assets and press contact.",
    )
    w = A4[0] - 32 * mm
    frame = Frame(16 * mm, 18 * mm, w, A4[1] - 34 * mm, id="one")
    doc.addPageTemplates([PageTemplate(id="one", frames=[frame], onPage=page_deco)])

    story: list = []
    story.append(Paragraph("ZAZIE PRODUCTIONS LLC · PRESS ONE-SHEET %s" % KIT, label(BLOOD_TEXT, 6.8, 3)))
    story.append(Paragraph("Zazie Kanwar-Torge", ParagraphStyle("t", fontName="Cormorant", fontSize=32, leading=33, textColor=VOID)))
    story.append(Rule(w, 1.2, BLOOD, 5, 7))
    story.append(Paragraph(
        "Psychological horror composer · multi-instrumentalist · Zazie Productions LLC, Asheville, North Carolina. "
        "Dark, atmospheric, cinematic original scores for film, TV and games — written to picture, never library music.",
        body(9.6, colors.HexColor("#3a3835"), 15),
    ))
    story.append(Spacer(1, 3.5 * mm))

    qr = Image(str(qr_png(SITE, pathlib.Path("/tmp/zp-qr-one.png"))), width=21 * mm, height=21 * mm)
    left = [
        Paragraph("2026 RECOGNITION", label(BLOOD_TEXT, 6.6, 3)),
        Paragraph("<b>Ars Electronica Festival 2026</b> — Sonic Saturday, Linz: <i>Slippage Beyond the Hyperlink</i>, selected from "
                  "the international call for contributions, performed in the Sonic Lab's 20.4-channel system (12 Sep 2026).",
                  body(8.6, BODY, 13.4)),
        Spacer(1, 2 * mm),
        Paragraph("<b>Golden Bloody Globes Film Festival 2026</b> — <i>Are You Real?</i> (dir. Aaron Alexander Bergen): Official "
                  "Selection, Best of the Festival nominee, with the original score by Zazie Kanwar-Torge (4 Oct 2026, Los Angeles).",
                  body(8.6, BODY, 13.4)),
        Spacer(1, 2 * mm),
        Paragraph("<b>Earlier</b> — Visual Container Winter 2024 Award Winner · BMC Radio Artist 2021 (Black Mountain College Museum "
                  "+ Arts Center, Asheville FM, Make Noise) · features in Grammy Weekly, Limitless Magazine and Billboard Wire.",
                  body(8.6, BODY, 13.4)),
    ]
    right = [
        qr,
        Spacer(1, 2.5 * mm),
        Paragraph("FULL KIT", label(BLOOD_TEXT, 6.4, 2.5)),
        Paragraph('<link href="%s"><font color="#1d1c1a">horror.zazie<br/>productions.com<br/>/press</font></link>' % SITE,
                  body(8.4, BODY, 12)),
        Spacer(1, 2.5 * mm),
        Paragraph("PRESS DESK", label(BLOOD_TEXT, 6.4, 2.5)),
        Paragraph("zaziediya@gmail.com<br/>Reply target 48 hours", body(8.4, BODY, 12)),
    ]
    grid = Table([[left, right]], colWidths=[w - 46 * mm, 46 * mm])
    grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(grid)
    story.append(Spacer(1, 3.5 * mm))

    story.append(boxed([
        Paragraph("25-WORD BIO · USE AS WRITTEN", label(BLOOD_TEXT, 6.4, 3)),
        Paragraph("Zazie Kanwar-Torge is a psychological horror composer and multi-instrumentalist in Asheville, NC, writing original "
                  "dark, atmospheric, cinematic scores for film, TV and games.", body(9.2, BODY, 14)),
        Spacer(1, 2.5 * mm),
        Paragraph("CREDIT WORDING", label(BLOOD_TEXT, 6.4, 3)),
        Paragraph("Music by Zazie Kanwar-Torge · Original score by Zazie Kanwar-Torge (Zazie Productions) · "
                  "Photo: Zazie Productions. Used with permission.", body(8.6, colors.HexColor("#3a3835"), 13.4)),
    ], 8, ASH, colors.HexColor("#f6f4f1"), BLOOD, w))
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("CRITICAL RESPONSE", label(BLOOD_TEXT, 6.6, 3)))
    story.append(Paragraph("“A nightmare, but an incredibly detailed, specific kind of nightmare.”", QUOTE))
    story.append(Paragraph("“The originality of the imagery is startling, and the layers of imagery and music are painstakingly "
                           "assembled into a gushingly assaultive onslaught with finesse and precision.”", QUOTE))
    story.append(Paragraph("David Finkelstein, Lake Ivan Film Journal — review of <i>Phantom Requiem</i>, 24 March 2025",
                           body(7.8, colors.HexColor("#6f6b66"), 12)))
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("FACTS", label(BLOOD_TEXT, 6.6, 3)))
    story.append(Paragraph(
        "Eight scored productions — EXPIRE, UNSEEN, PEREGRINUS, Phantom Requiem, ECLIPSED, THE HAUNTED, CHOLERIC, MIKE HAS A VISITOR · "
        "29-cue showreel · rates from $50 (micro/student), $2,500 (short), $8,000 (feature/episode), $4,500 (game) · 5.0 collaborator "
        "rating · IMDb nm17333332 · twelve press images cleared for editorial use at horror.zazieproductions.com/press",
        body(8.6, BODY, 13.6),
    ))
    story.append(Spacer(1, 4 * mm))

    films = [
        "Are You Real? (2026) · short · score · Golden Bloody Globes selection",
        "EXPIRE (2025) · short · sound design",
        "Phantom Requiem (2024) · gothic horror short · score and film",
        "UNSEEN · feature psychological thriller · score",
        "ECLIPSED · psychological horror feature · score",
        "PEREGRINUS · folk horror series · score",
        "THE HAUNTED · supernatural horror teaser · score",
        "CHOLERIC · body horror short · score",
        "MIKE HAS A VISITOR · sleep paralysis short · score",
    ]
    left_col = [Paragraph("EIGHT SCORED PRODUCTIONS + ARE YOU REAL?", label(BLOOD_TEXT, 6.4, 2.5))]
    left_col += [Paragraph("· " + f, body(7.6, BODY, 11.4)) for f in films]
    right_col = [
        Paragraph("WHAT PRESS CAN GET", label(BLOOD_TEXT, 6.4, 2.5)),
        Paragraph("Twelve cleared images (hero portrait, press photo, headshot, eight posters, atmosphere still) · approved bios in four lengths · "
                  "pull quotes with attribution · score excerpts and stems for review · screener links · interview slots, remote "
                  "by default", body(7.6, BODY, 11.8)),
        Spacer(1, 2 * mm),
        Paragraph("BOOKING", label(BLOOD_TEXT, 6.4, 2.5)),
        Paragraph("Next screening: 4 October 2026, Golden Bloody Globes Film Festival, Broadwater Theater, Los Angeles. "
                  "Programmers and producers: send the date, the format and the deadline.",
                  body(7.6, BODY, 11.8)),
    ]
    grid2 = Table([[left_col, right_col]], colWidths=[w * 0.46, w * 0.54])
    grid2.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LINEABOVE", (0, 0), (-1, 0), 0.6, VOID),
    ]))
    story.append(grid2)
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        'Zazie Productions LLC · Asheville, North Carolina, USA · <link href="mailto:zaziediya@gmail.com">'
        '<font color="#6f6b66">zaziediya@gmail.com</font></link> · horror.zazieproductions.com/press',
        body(7.8, colors.HexColor("#6f6b66"), 12),
    ))

    doc.build(story)


def page_count(path: pathlib.Path) -> int:
    import re as _re
    return len(_re.findall(rb"/Type\s*/Page[^s]", path.read_bytes()))


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    kit = OUT / "zazie-productions-press-kit-2026.pdf"
    one = OUT / "zazie-productions-one-sheet-2026.pdf"

    # Two passes: the cover states the page count, so count first, then print it.
    build_press_kit(pathlib.Path("/tmp/zp-kit-pass1.pdf"))
    n = page_count(pathlib.Path("/tmp/zp-kit-pass1.pdf"))
    build_press_kit(kit, pages_label=n)
    build_one_sheet(one)
    for f in (kit, one):
        print("wrote %s (%.0f KB, %d page(s))" % (f.relative_to(ROOT), f.stat().st_size / 1024, page_count(f)))
