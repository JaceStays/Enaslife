#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
IMG_DIR="$ROOT/Assets/Images"
WORK="$ROOT/.slideshow-build"
OUT="$ROOT/Assets/bubba-slideshow.mp4"
MANIFEST="$ROOT/images.json"

rm -rf "$WORK"
mkdir -p "$WORK"

python3 - "$MANIFEST" "$IMG_DIR" "$WORK" << 'PYEOF'
import json, subprocess, sys
from pathlib import Path

manifest, img_dir, work = map(Path, sys.argv[1:4])
entries = json.loads(manifest.read_text())

for i, entry in enumerate(entries, start=1):
    name = entry["file"]
    src = img_dir / name
    num = f"{i:04d}"
    out = work / f"frame_{num}.jpg"
    input_path = src

    if name.lower().endswith(".heic"):
        temp = work / f"source_{num}.jpg"
        subprocess.run(["sips", "-s", "format", "jpeg", str(src), "--out", str(temp)], check=True)
        input_path = temp

    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(input_path),
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x1a1510,setsar=1",
        "-frames:v", "1", str(out),
    ], check=True)
PYEOF

LIST="$WORK/concat.txt"
: > "$LIST"
count=$(ls "$WORK"/frame_*.jpg | wc -l | tr -d ' ')
for f in "$WORK"/frame_*.jpg; do
  echo "file '${f//\'/\'\\\'\'}'" >> "$LIST"
  echo "duration 3.5" >> "$LIST"
done
last=$(ls "$WORK"/frame_*.jpg | tail -1)
echo "file '${last//\'/\'\\\'\'}'" >> "$LIST"

ffmpeg -y -hide_banner -loglevel warning -f concat -safe 0 -i "$LIST" \
  -vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 23 -movflags +faststart \
  -pix_fmt yuv420p "$OUT"

echo "Created $OUT ($(du -h "$OUT" | cut -f1)) with $count images"
