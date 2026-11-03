#!/usr/bin/env bash
# Render + QC a story video (Marcus / editorial / cinematic system).
# Usage: bash scripts/render-story.sh [props.json]
#   props.json (optional): {"voiceAudio": "voice/debt-three-things/voice.mp3", "alignment": "voice/debt-three-things/alignment.json"}
# Output: out/debt-three-things.mp4 and out/debt-three-things-qc/ (frames from every scene + contact sheet)
set -euo pipefail
cd "$(dirname "$0")/.."
PROPS="${1:-}"
COMP=DebtThreeThings
SLUG=debt-three-things
OUT="out/$SLUG.mp4"
QC="out/$SLUG-qc"
mkdir -p out "$QC"

BROWSER_FLAG=()
if [ -n "${REMOTION_BROWSER_EXECUTABLE:-}" ]; then
  BROWSER_FLAG=(--browser-executable="$REMOTION_BROWSER_EXECUTABLE")
else
  for c in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do
    [ -x "$c" ] && BROWSER_FLAG=(--browser-executable="$c") && break
  done
fi
PROPS_FLAG=()
[ -n "$PROPS" ] && PROPS_FLAG=(--props="$PROPS")

[ -f public/sfx/whoosh.wav ] || python3 scripts/make_sfx.py
npx tsc --noEmit
npx remotion render src/index.ts "$COMP" "$OUT" "${PROPS_FLAG[@]}" --codec=h264 --crf=16 --pixel-format=yuv420p \
  --image-format=jpeg --jpeg-quality=95 --color-space=bt709 --audio-codec=aac "${BROWSER_FLAG[@]}"

echo "== export"
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,nb_frames \
  -show_entries format=duration -of default=nw=1 "$OUT" | tee "$QC/probe.txt"
grep -q "width=1080" "$QC/probe.txt" && grep -q "height=1920" "$QC/probe.txt" && grep -q "r_frame_rate=30/1" "$QC/probe.txt" \
  && echo "EXPORT OK (1080x1920 30fps)" || { echo "EXPORT SETTINGS FAILED"; exit 1; }
echo "audio: $(ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$OUT")"
ffmpeg -v error -i "$OUT" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume" || true
ffmpeg -v error -i "$OUT" -f null - 2> "$QC/decode_errors.txt" || true
[ -s "$QC/decode_errors.txt" ] && { echo "DECODE ERRORS"; cat "$QC/decode_errors.txt"; } || echo "decode clean"

echo "== timing"
npx tsx scripts/story-report.ts $PROPS > "$QC/report.json"
node -e 'const r=require(process.argv[1]); console.log("narration source:", r.source, r.source==="temp" ? "(TEMPORARY markers — not synced to a voice)" : ""); for (const w of r.windows) console.log(w.id.padEnd(6), "frames", w.start, "-", w.end)' "$PWD/$QC/report.json"

echo "== QC frames"
for pair in $(node -e 'for (const [n,f] of require(process.argv[1]).qc) console.log(`${n}=${f}`)' "$PWD/$QC/report.json"); do
  n="${pair%%=*}"; f="${pair##*=}"
  T=$(awk "BEGIN{printf \"%.4f\", ($f+0.5)/30}")
  ffmpeg -nostdin -v error -y -ss "$T" -i "$OUT" -frames:v 1 "$QC/$n.png"
done
python3 scripts/story-sheet.py "$QC" "$QC/report.json"
echo "rendered $OUT — inspect $QC before delivering."
