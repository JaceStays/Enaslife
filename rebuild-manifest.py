#!/usr/bin/env python3
"""Rebuild images.json: one photo per image, no duplicate stems/extensions."""
import json
import subprocess
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent
IMG_DIR = ROOT / "Assets" / "Images"
FIRST_IMAGE = "IMG_0437_Original.jpg"

WEB_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def ext_rank(name: str) -> tuple:
    lower = name.lower()
    ext = Path(name).suffix.lower()
    if "original" in lower:
        return (0, name)
    if ext in (".jpeg", ".jpg"):
        return (1, name)
    if ext == ".png":
        return (2, name)
    if ext == ".heic":
        return (3, name)
    return (4, name)


def pick_canonical(files: list[str]) -> str:
    return sorted(files, key=ext_rank)[0]


def pick_src(files: list[str], canonical: str) -> str:
    web = [f for f in files if Path(f).suffix.lower() in WEB_EXTS or Path(f).suffix in {".JPG", ".JPEG", ".PNG"}]
    if web:
        return pick_canonical(web)
    if canonical.lower().endswith(".heic"):
        out_name = Path(canonical).stem + ".jpg"
        out_path = IMG_DIR / out_name
        if not out_path.exists():
            subprocess.run(
                ["sips", "-s", "format", "jpeg", str(IMG_DIR / canonical), "--out", str(out_path)],
                check=True,
                capture_output=True,
            )
        return out_name
    return canonical


def main():
    disk_files = [f.name for f in IMG_DIR.iterdir() if f.is_file() and not f.name.startswith(".")]
    by_stem: dict[str, list[str]] = defaultdict(list)
    for name in disk_files:
        by_stem[Path(name).stem.lower()].append(name)

    entries = []
    for stem in sorted(by_stem.keys()):
        files = by_stem[stem]
        canonical = pick_canonical(files)
        src = pick_src(files, canonical)
        entries.append({"file": canonical, "src": src})

    entries.sort(key=lambda e: e["file"].lower())
    first = [e for e in entries if e["file"] == FIRST_IMAGE]
    rest = [e for e in entries if e["file"] != FIRST_IMAGE]
    entries = first + rest

    out = ROOT / "images.json"
    out.write_text(json.dumps(entries, indent=2) + "\n")
    print(f"Wrote {len(entries)} unique images to {out.name}")


if __name__ == "__main__":
    main()
