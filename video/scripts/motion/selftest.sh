#!/usr/bin/env bash
# /motion pipeline self-test: scaffold → ingest synthetic voice → typecheck →
# timing report → QC stills (no MP4) → verify → remove everything it created.
# Usage: bash scripts/motion/selftest.sh   (≈1 min; leaves the repo unchanged)
set -euo pipefail
cd "$(dirname "$0")/../.."
SLUG=zz-motion-selftest; COMP=ZzMotionSelftest
TMPD=$(mktemp -d); cp src/StoryRoot.tsx "$TMPD/StoryRoot.tsx"
cleanup() { cp "$TMPD/StoryRoot.tsx" src/StoryRoot.tsx; rm -rf "src/videos/$SLUG" "public/voice/$SLUG" "public/motion/$SLUG" "renders/$SLUG" "$TMPD"; rmdir public/motion public/voice renders 2>/dev/null || true; }
trap cleanup EXIT
[ -e "src/videos/$SLUG" ] && { echo "selftest slug exists — remove src/videos/$SLUG first"; exit 1; }
node scripts/motion/new-video.mjs "$SLUG" "$COMP" education "Motion self test"
ffmpeg -v error -y -f lavfi -i "sine=frequency=220:duration=12" -ar 44100 "$TMPD/voice.wav"
python3 scripts/voice.py ingest "$SLUG" "$TMPD/voice.wav"
bash scripts/motion/render.sh "$SLUG" "public/voice/$SLUG/props.json" --stills-only 2>&1 | grep -vE 'emory|lower amount' | tail -6
QC="renders/$SLUG/qc_v01"
N=$(node -e 'console.log(require(require("path").resolve(process.argv[1])).qc.length)' "$QC/report.json")
M=$(ls "$QC"/*.png | grep -vc contact_sheet)
SRC=$(node -e 'console.log(require(require("path").resolve(process.argv[1])).source)' "$QC/report.json")
[ "$M" -ge "$N" ] && [ -s "$QC/contact_sheet.png" ] && [ "$SRC" = "audio-scaled" ] \
  && echo "MOTION SELFTEST OK ($M stills, narration $SRC)" || { echo "MOTION SELFTEST FAILED ($M/$N stills, source $SRC)"; exit 1; }
