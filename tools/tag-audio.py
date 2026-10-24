#!/usr/bin/env python3
"""
tag-audio.py
=============================================================================
Embed sync-ready ID3 metadata into every showreel track so a music
supervisor can clear and cue a downloaded file without leaving their tag
reader (Soundminer, BaseHead, Finder, iTunes/Music, etc.).

What it writes into /audio/track-00.mp3 ... track-31.mp3, plus the two
hi-resolution masters in the repo root ("Earthpulse Protocol.wav", showreel
position 32, and "The Beautiful Wrongness.aif", position 31):

  identity    TIT2 title (canonical, from src/data/cues.ts), TPE1 artist,
              TPE2 album artist, TCOM composer, TALB showreel album, TIT1
              content group, TRCK n/32, TPOS 1/1, TCON cue category, TDRC year
  rights      TCOP copyright line, TPUB publisher, TPRO producer, TOWN file
              owner, TXXX:SYNC READY one-stop clearance statement
  contact     COMM "Sync licensing" brief, TXXX contact email/phone, TXXX
              licensing/cue/website URLs, WOAR/WOAF/WOAS/WCOP URL frames
  discovery   TXXX:CUE CATEGORY and TXXX:KEYWORDS (derived only from the
              published first-party category + description in cues.ts - no
              invented BPM, instruments, placements, or ISRCs)
  artwork     APIC front cover: square 600 px render of the branded
              images/hero-portrait.jpg

The audio stream is never re-encoded. Mutagen rewrites tag frames only, so
sample rate, bitrate, duration, and every audio frame are preserved. Existing
provenance frames are retained rather than replaced: TENC/TSSE encoder tags,
the GEOB C2PA manifest on track-29, the CHAP/CTOC chapter table on track-26,
and the TBPM value already carried by the AIFF master.

Single source of truth
-----------------------
All cue-specific values come from src/data/cues.ts, exported through
tools/export-cue-manifest.mjs (Node 22 type stripping, no extra dependency).
Identity strings mirror src/data/site.ts and the licensing page; update those
first if any of them change.

Setup (once):
  python3 -m venv .venv
  .venv/bin/pip install mutagen pillow

Usage:
  .venv/bin/python tools/tag-audio.py             # write tags
  .venv/bin/python tools/tag-audio.py --dry-run   # print the plan, write nothing
  .venv/bin/python tools/tag-audio.py --check     # verify committed files, CI mode
=============================================================================
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# --- Identity: mirrors src/data/site.ts and /licensing ----------------------
ORIGIN = "https://horror.zazieproductions.com"
ARTIST = "Zazie Productions"
ALBUM_ARTIST = "Zazie Productions"
COMPOSER = "Zazie Kanwar-Torge"
PUBLISHER = "Zazie Productions LLC"
ALBUM = "Horror Composer Showreel: 32 Original Dark Cinematic Cues"
CONTENT_GROUP = "Horror Composer Showreel"
YEAR = "2026"
COPYRIGHT = "\u00a9 2026 Zazie Productions LLC. All rights reserved."
EMAIL = "zaziediya@gmail.com"
PHONE = "+1 (864) 430-0606"
LICENSING_URL = f"{ORIGIN}/licensing"
COMPOSER_URL = f"{ORIGIN}/composer"
TOTAL_TRACKS = 32

# Hi-resolution masters in the repo root, keyed by their showreel track number.
MASTER_FILES = {
    30: "The Beautiful Wrongness.aif",
    31: "Earthpulse Protocol.wav",
}

# Frames that belong to the file's provenance and must survive a re-tag.
KEEP_EXACT = {"TENC", "TSSE"}
KEEP_PREFIX = ("GEOB", "CHAP", "CTOC")
KEEP_MASTER_EXTRA = {"TBPM"}

# Generic filler that adds nothing to a supervisor keyword search.
KEYWORD_BLOCKLIST = {
    "aesthetics", "after", "also", "between", "built", "came", "center",
    "centre", "comes", "composition", "context", "design", "detail",
    "details", "energy", "entry", "even", "ever", "every", "focus", "found",
    "given", "great", "idea", "image", "into", "just", "keeps", "language",
    "least", "little", "makes", "many", "moment", "moments", "more", "most",
    "much", "music", "named", "names", "near", "never", "note", "notes",
    "onto", "over", "piece", "picture", "quite", "reference", "same",
    "scene", "sequences", "shaped", "side", "sides", "still", "supplied",
    "taken", "takes", "terms", "than", "that", "their", "them", "then",
    "there", "these", "they", "this", "those", "track", "turns", "under",
    "upon", "using", "very", "which", "while", "where", "which", "within",
    "without", "words",
}


def load_manifest() -> list[dict]:
    """Run the Node manifest exporter, trying the type-stripping flag first."""
    exporter = ROOT / "tools" / "export-cue-manifest.mjs"
    attempts = [
        ["node", "--experimental-strip-types", str(exporter)],
        ["node", str(exporter)],
    ]
    last_error = ""
    for cmd in attempts:
        proc = subprocess.run(
            cmd, cwd=ROOT, capture_output=True, text=True, check=False
        )
        if proc.returncode == 0:
            return json.loads(proc.stdout)
        last_error = proc.stderr.strip() or proc.stdout.strip()
    raise SystemExit(
        f"Could not export cue manifest via Node.\n{last_error}\n"
        "Requires Node >= 22 with TypeScript type stripping."
    )


def build_keywords(category: str, description: str, limit: int = 10) -> str:
    """Keywords drawn only from published first-party copy, never invented."""
    text = f"{category} {description}".lower()
    tokens = text.replace("&", " ").replace("/", " ").replace(":", " ")
    words = [
        w
        for w in "".join(c if c.isalnum() or c in "- " else " " for c in tokens).split()
        if len(w) >= 4 and w not in KEYWORD_BLOCKLIST
    ]
    seen: set[str] = set()
    out: list[str] = []
    for word in words:
        if word not in seen:
            seen.add(word)
            out.append(word)
        if len(out) >= limit:
            break
    return ", ".join(out)


def make_cover() -> bytes:
    """Center-crop the branded portrait to a 600 px square JPEG cover."""
    try:
        from PIL import Image
    except ImportError as exc:
        raise SystemExit(
            "Pillow is required: .venv/bin/pip install mutagen pillow"
        ) from exc

    cache_dir = ROOT / ".audit" / "audio-tags"
    cache_dir.mkdir(parents=True, exist_ok=True)
    cover_path = cache_dir / "cover-600.jpg"
    if not cover_path.exists():
        src = Image.open(ROOT / "images" / "hero-portrait.jpg").convert("RGB")
        side = min(src.size)
        left = (src.width - side) // 2
        top = (src.height - side) // 2
        square = src.crop((left, top, left + side, top + side))
        square = square.resize((600, 600), Image.LANCZOS)
        square.save(cover_path, "JPEG", quality=82, optimize=True)
    return cover_path.read_bytes()


def cue_page_url(cue: dict) -> str:
    return f"{ORIGIN}/reel/{cue['slug']}"


def sync_ready_note() -> str:
    return (
        "One-stop cue: master and composition controlled by "
        f"{PUBLISHER}; single-contact sync clearance. A synchronization "
        "licence is required for any film, TV, game, trailer, or advertising use."
    )


def comment_text(cue: dict) -> str:
    return (
        f"{cue['description']} {sync_ready_note()} Cue-sheet usage type, "
        "instrumentation, and PRO/IPI identifiers supplied on request. "
        f"Contact: {EMAIL} \u00b7 {PHONE}. Licensing terms: {LICENSING_URL}"
    )


def build_frames(tags, cue: dict, cover: bytes, keep_extra: set[str]) -> None:
    """Replace every non-protected frame with the canonical sync-ready set."""
    from mutagen.id3 import (
        APIC,
        COMM,
        ID3,
        TALB,
        TCOM,
        TCON,
        TCOP,
        TDRC,
        TIT1,
        TIT2,
        TLEN,
        TOWN,
        TPE1,
        TPE2,
        TPOS,
        TPRO,
        TPUB,
        TRCK,
        TXXX,
        WOAF,
        WOAR,
        WOAS,
        WCOP,
        Encoding,
        PictureType,
    )

    keep = KEEP_EXACT | keep_extra
    for frame_id in list(tags.keys()):
        if frame_id in keep or frame_id.startswith(KEEP_PREFIX):
            continue
        del tags[frame_id]

    position = cue["track"] + 1
    keywords = build_keywords(cue["category"], cue["description"])
    page = cue_page_url(cue)
    audio_url = f"{ORIGIN}{cue['audioPath']}"
    utf16 = Encoding.UTF16

    tags.add(TIT2(encoding=utf16, text=cue["title"]))
    tags.add(TPE1(encoding=utf16, text=ARTIST))
    tags.add(TPE2(encoding=utf16, text=ALBUM_ARTIST))
    tags.add(TCOM(encoding=utf16, text=COMPOSER))
    tags.add(TALB(encoding=utf16, text=ALBUM))
    tags.add(TIT1(encoding=utf16, text=CONTENT_GROUP))
    tags.add(TCON(encoding=utf16, text=cue["category"]))
    tags.add(TRCK(encoding=utf16, text=f"{position}/{TOTAL_TRACKS}"))
    tags.add(TPOS(encoding=utf16, text="1/1"))
    tags.add(TDRC(encoding=utf16, text=YEAR))
    tags.add(TLEN(encoding=utf16, text=str(cue["durationSeconds"] * 1000)))
    tags.add(TCOP(encoding=utf16, text=COPYRIGHT))
    tags.add(TPRO(encoding=utf16, text=PUBLISHER))
    tags.add(TOWN(encoding=utf16, text=PUBLISHER))
    tags.add(TPUB(encoding=utf16, text=PUBLISHER))

    tags.add(
        COMM(
            encoding=utf16,
            lang="eng",
            desc="Sync licensing",
            text=comment_text(cue),
        )
    )

    txxx_fields = [
        ("SYNC READY", sync_ready_note()),
        ("CONTACT EMAIL", EMAIL),
        ("CONTACT PHONE", PHONE),
        ("LICENSING URL", LICENSING_URL),
        ("CUE PAGE", page),
        ("ARTIST WEBSITE", f"{ORIGIN}/"),
        ("CUE CATEGORY", cue["category"]),
        ("KEYWORDS", keywords),
    ]
    for desc, value in txxx_fields:
        tags.add(TXXX(encoding=utf16, desc=desc, text=value))

    tags.add(WOAR(url=COMPOSER_URL))
    tags.add(WOAF(url=page))
    tags.add(WOAS(url=audio_url))
    tags.add(WCOP(url=LICENSING_URL))

    tags.add(
        APIC(
            encoding=utf16,
            mime="image/jpeg",
            type=PictureType.COVER_FRONT,
            desc="Cover front",
            data=cover,
        )
    )


def stream_brief(path: Path) -> str:
    from mutagen import File as MutagenFile

    audio = MutagenFile(path)
    info = audio.info
    return f"{info.sample_rate} Hz, {info.length:.1f} s"


def tag_mp3(cue: dict, cover: bytes, dry_run: bool) -> None:
    from mutagen.id3 import ID3

    path = ROOT / cue["audioPath"].lstrip("/")
    try:
        tags = ID3(path)
    except Exception:
        tags = ID3()
    if dry_run:
        print(f"[dry-run] would tag {path} ({stream_brief(path)})")
        return
    before = stream_brief(path)
    build_frames(tags, cue, cover, set())
    tags.save(path, v2_version=3)
    after = stream_brief(path)
    if before != after:
        raise SystemExit(f"Stream changed for {path}: {before} -> {after}")
    print(f"[ok] {path.relative_to(ROOT)}  {cue['title']}  ({after})")


def tag_master(cue: dict, filename: str, cover: bytes, dry_run: bool) -> None:
    from mutagen import File as MutagenFile

    path = ROOT / filename
    audio = MutagenFile(path)
    if audio.tags is None:
        audio.add_tags()
    if dry_run:
        print(f"[dry-run] would tag {path} ({stream_brief(path)})")
        return
    before = stream_brief(path)
    build_frames(audio.tags, cue, cover, KEEP_MASTER_EXTRA)
    audio.tags.version = (2, 3, 0)
    audio.save()
    after = stream_brief(path)
    if before != after:
        raise SystemExit(f"Stream changed for {path}: {before} -> {after}")
    print(f"[ok] {filename}  {cue['title']}  ({after})")


# --------------------------------------------------------------------- check

def txxx_value(tags, desc: str) -> str | None:
    for frame in tags.getall("TXXX"):
        if frame.desc == desc:
            return frame.text[0]
    return None


def check_file(cue: dict, path: Path, expect_extra: list[str]) -> list[str]:
    from mutagen import File as MutagenFile

    failures: list[str] = []
    audio = MutagenFile(path)
    tags = audio.tags
    if tags is None:
        return ["no ID3 tag block"]

    def text(frame_id: str) -> str | None:
        frame = tags.get(frame_id)
        return frame.text[0].strip() if frame and frame.text else None

    position = cue["track"] + 1
    expected = {
        "TIT2": cue["title"],
        "TPE1": ARTIST,
        "TPE2": ALBUM_ARTIST,
        "TCOM": COMPOSER,
        "TALB": ALBUM,
        "TIT1": CONTENT_GROUP,
        "TCON": cue["category"],
        "TRCK": f"{position}/{TOTAL_TRACKS}",
        "TPOS": "1/1",
        "TPUB": PUBLISHER,
        "TPRO": PUBLISHER,
        "TOWN": PUBLISHER,
    }
    for frame_id, want in expected.items():
        got = text(frame_id)
        if got != want:
            failures.append(f"{frame_id}={got!r} (want {want!r})")

    if "2026" not in (text("TCOP") or "") or PUBLISHER not in (text("TCOP") or ""):
        failures.append(f"TCOP missing year/publisher: {text('TCOP')!r}")
    if text("TYER") is not None and text("TYER") != YEAR:
        failures.append(f"TYER={text('TYER')!r} (want {YEAR!r})")

    tlen = text("TLEN")
    want_ms = cue["durationSeconds"] * 1000
    if not tlen or abs(int(tlen) - want_ms) > 1000:
        failures.append(f"TLEN={tlen!r} (want ~{want_ms})")

    page = cue_page_url(cue)
    if txxx_value(tags, "SYNC READY") is None:
        failures.append("TXXX:SYNC READY missing")
    if txxx_value(tags, "CONTACT EMAIL") != EMAIL:
        failures.append("TXXX:CONTACT EMAIL mismatch")
    if txxx_value(tags, "CONTACT PHONE") != PHONE:
        failures.append("TXXX:CONTACT PHONE mismatch")
    if txxx_value(tags, "LICENSING URL") != LICENSING_URL:
        failures.append("TXXX:LICENSING URL mismatch")
    if txxx_value(tags, "CUE PAGE") != page:
        failures.append("TXXX:CUE PAGE mismatch")
    if txxx_value(tags, "CUE CATEGORY") != cue["category"]:
        failures.append("TXXX:CUE CATEGORY mismatch")
    if not txxx_value(tags, "KEYWORDS"):
        failures.append("TXXX:KEYWORDS missing")

    comms = tags.getall("COMM")
    if not any(c.desc == "Sync licensing" and "synchronization" in c.text[0] for c in comms):
        failures.append("COMM 'Sync licensing' missing")

    # WOAR is a multi-value URL frame in mutagen (keyed "WOAR:<url>"), the
    # other WOA/WCOP frames are single-value.
    woar_urls = [frame.url for frame in tags.getall("WOAR")]
    if COMPOSER_URL not in woar_urls:
        failures.append(f"WOAR composer URL missing: {woar_urls!r}")
    woaf = tags.get("WOAF")
    if woaf is None or woaf.url != page:
        failures.append("WOAF cue-page URL mismatch")
    woas = tags.get("WOAS")
    if woas is None or woas.url != f"{ORIGIN}{cue['audioPath']}":
        failures.append("WOAS audio URL mismatch")
    wcop = tags.get("WCOP")
    if wcop is None or wcop.url != LICENSING_URL:
        failures.append("WCOP licensing URL mismatch")

    apics = tags.getall("APIC")
    if not apics or apics[0].mime != "image/jpeg" or len(apics[0].data) < 10_000:
        failures.append("APIC front cover missing or too small")

    for frame_id in expect_extra:
        if tags.get(frame_id) is None:
            failures.append(f"protected frame {frame_id} was lost")

    if abs(audio.info.length - cue["durationSeconds"]) > 1.0:
        failures.append(
            f"stream length {audio.info.length:.1f}s != catalogue "
            f"{cue['durationSeconds']}s"
        )
    return failures


def main() -> int:
    check = "--check" in sys.argv
    dry_run = "--dry-run" in sys.argv

    try:
        from mutagen.id3 import ID3  # noqa: F401
    except ImportError:
        raise SystemExit(
            "mutagen is required: python3 -m venv .venv && "
            ".venv/bin/pip install mutagen pillow"
        )

    manifest = load_manifest()
    if len(manifest) != TOTAL_TRACKS:
        raise SystemExit(
            f"manifest has {len(manifest)} cues, expected {TOTAL_TRACKS}"
        )

    if check:
        total_failures = 0
        for cue in manifest:
            path = ROOT / cue["audioPath"].lstrip("/")
            extra = []
            if cue["track"] == 26:
                extra = ["CHAP:ch0", "CTOC:toc"]
            if cue["track"] == 29:
                extra = ["GEOB:c2pa manifest store"]
            failures = check_file(cue, path, extra)
            status = "PASS" if not failures else "FAIL"
            print(f"[{status}] {path.relative_to(ROOT)}  {cue['title']}")
            for failure in failures:
                total_failures += 1
                print(f"        - {failure}")

        for track_no, filename in sorted(MASTER_FILES.items()):
            cue = next(c for c in manifest if c["track"] == track_no)
            extra = ["TBPM"] if filename.endswith(".aif") else []
            failures = check_file(cue, ROOT / filename, extra)
            status = "PASS" if not failures else "FAIL"
            print(f"[{status}] {filename}  {cue['title']}")
            for failure in failures:
                total_failures += 1
                print(f"        - {failure}")

        if total_failures:
            print(f"\n{total_failures} metadata problem(s). Run: npm run tag:audio")
            return 1
        print(f"\nAll {TOTAL_TRACKS} MP3 cues and {len(MASTER_FILES)} masters carry sync-ready tags.")
        return 0

    cover = make_cover()
    print(
        f"Cover: {len(cover):,} bytes JPEG (600x600) from images/hero-portrait.jpg"
    )
    for cue in manifest:
        tag_mp3(cue, cover, dry_run)
    for track_no, filename in sorted(MASTER_FILES.items()):
        cue = next(c for c in manifest if c["track"] == track_no)
        tag_master(cue, filename, cover, dry_run)

    mode = "dry run" if dry_run else "write"
    print(
        f"\n{mode.title()} complete: {TOTAL_TRACKS} MP3 cues + "
        f"{len(MASTER_FILES)} hi-res masters. Verify with: npm run check:audio-tags"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
