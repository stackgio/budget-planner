#!/usr/bin/env bash
# Render + QC any /motion video, with versioned output that never overwrites.
# Usage: bash scripts/motion/render.sh <slug> [props.json] [--stills-only]
#   props.json: {"voiceAudio":"voice/<slug>/voice.mp3","alignment":"voice/<slug>/alignment.json"} (voice.py writes it)
# Output: renders/<slug>/<slug>_vNN_<final-voice|voice-approx|temp-timing>.mp4
#         renders/<slug>/qc_vNN/ (beat frames, contact sheet, probe, report, checks)
set -euo pipefail
cd "$(dirname "$0")/../.."
SLUG="${1:?usage: render.sh <slug> [props.json] [--stills-only]}"
PROPS=""; STILLS_ONLY=0
for a in "${@:2}"; do case "$a" in --stills-only) STILLS_ONLY=1;; *) PROPS="$a";; esac; done
[ -d "src/videos/$SLUG" ] || { echo "no src/videos/$SLUG"; exit 1; }

BROWSER=()
if [ -n "${REMOTION_BROWSER_EXECUTABLE:-}" ]; then BROWSER=(--browser-executable="$REMOTION_BROWSER_EXECUTABLE")
else for c in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do [ -x "$c" ] && BROWSER=(--browser-executable="$c") && break; done; fi
PROPS_FLAG=(); [ -n "$PROPS" ] && PROPS_FLAG=(--props="$PROPS")

[ -f public/sfx/whoosh.wav ] || python3 scripts/make_sfx.py
echo "== typecheck"; npx tsc --noEmit

OUTDIR="renders/$SLUG"; mkdir -p "$OUTDIR"
N=1; while ls "$OUTDIR"/"${SLUG}"_v$(printf %02d $N)_*.mp4 >/dev/null 2>&1 || [ -d "$OUTDIR/qc_v$(printf %02d $N)" ]; do N=$((N+1)); done
V=$(printf %02d $N); QC="$OUTDIR/qc_v$V"; mkdir -p "$QC"

echo "== timing"
npx tsx scripts/motion/report.ts "$SLUG" $PROPS > "$QC/report.json"
read -r COMP SRC DUR <<<"$(node -e 'const r=require(process.argv[1]); console.log((r.meta&&r.meta.compositionId)||"", r.source, r.durationSec)' "$PWD/$QC/report.json")"
COMP="${COMP_OVERRIDE:-$COMP}"; [ -n "$COMP" ] || { echo "META.compositionId missing in script.ts"; exit 1; }
case "$SRC" in aligned) TAG=final-voice;; audio-scaled) TAG=voice-approx;; *) TAG=temp-timing;; esac
node -e '
const r=require(process.argv[1]);
console.log(`composition ${r.meta.compositionId} | narration ${r.source}${r.source==="temp"?" (TEMPORARY timing — no voice)":r.source==="audio-scaled"?" (APPROXIMATE — no word timestamps)":""} | ${r.durationSec}s`);
for (const w of r.windows) console.log("  ", w.id.padEnd(10), "frames", w.start, "-", w.end);
if (r.alignment) { const a=r.alignment; console.log(`alignment: ${a.matched}/${a.total} script words matched, ${a.unusedSpoken} spoken words unused`); for (const m of a.missed.slice(0,20)) console.log(`  MISMATCH ${m.line}: script "${m.token}" vs spoken "${m.near}"`); }
' "$PWD/$QC/report.json" | tee "$QC/timing.txt"

if [ "$STILLS_ONLY" = 1 ]; then
  echo "== stills only (no MP4)"
  ARGS=(); while read -r pair; do ARGS+=("$pair"); done < <(node -e 'for (const [n,f] of require(process.argv[1]).qc) console.log(`${n}=${f}`)' "$PWD/$QC/report.json")
  node scripts/stills.mjs "$COMP" "$QC" "${ARGS[@]}" ${PROPS:+--props=$PROPS} --scale=0.5
  python3 scripts/story-sheet.py "$QC" "$QC/report.json"
  echo "stills in $QC"; exit 0
fi

OUT="$OUTDIR/${SLUG}_v${V}_${TAG}.mp4"; TMP="$OUTDIR/.rendering_v$V.mp4"
echo "== render → $OUT"
npx remotion render src/index.ts "$COMP" "$TMP" "${PROPS_FLAG[@]}" --codec=h264 --crf=16 --pixel-format=yuv420p \
  --image-format=jpeg --jpeg-quality=95 --color-space=bt709 --audio-codec=aac --audio-bitrate=320k "${BROWSER[@]}"
[ -e "$OUT" ] && { echo "refusing to overwrite $OUT"; exit 1; }
mv "$TMP" "$OUT"

echo "== export checks" | tee "$QC/checks.txt"
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,nb_frames -show_entries format=duration -of default=nw=1 "$OUT" | tee "$QC/probe.txt"
FAIL=0
grep -q "width=1080" "$QC/probe.txt" && grep -q "height=1920" "$QC/probe.txt" && grep -q "r_frame_rate=30/1" "$QC/probe.txt" \
  && echo "OK export 1080x1920 30fps h264" | tee -a "$QC/checks.txt" || { echo "FAIL export settings" | tee -a "$QC/checks.txt"; FAIL=1; }
VDUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
ACODEC=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$OUT" | head -1)
VOICE=$(node -e 'const p=process.argv[1]?require(require("path").resolve(process.argv[1])):{}; console.log(p.voiceAudio||"")' "$PROPS")
if [ -n "$VOICE" ]; then
  ADUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "public/$VOICE")
  [ -n "$ACODEC" ] && echo "OK audio stream ($ACODEC)" | tee -a "$QC/checks.txt" || { echo "FAIL no audio stream but voice supplied" | tee -a "$QC/checks.txt"; FAIL=1; }
  awk "BEGIN{exit !($VDUR + 0.05 >= $ADUR)}" && echo "OK video ${VDUR}s >= voice ${ADUR}s (no words cut)" | tee -a "$QC/checks.txt" \
    || { echo "FAIL video ${VDUR}s shorter than voice ${ADUR}s" | tee -a "$QC/checks.txt"; FAIL=1; }
  echo "voice file sha256: $(sha256sum "public/$VOICE" | cut -c1-16) (played untouched at 1.0x)" | tee -a "$QC/checks.txt"
else
  echo "NOTE no voiceover — timing is TEMPORARY (audio: ${ACODEC:-none}, SFX only)" | tee -a "$QC/checks.txt"
fi
ffmpeg -v error -i "$OUT" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume" | tee -a "$QC/checks.txt" || true
ffmpeg -v error -i "$OUT" -f null - 2> "$QC/decode_errors.txt" || true
[ -s "$QC/decode_errors.txt" ] && { echo "FAIL decode errors" | tee -a "$QC/checks.txt"; FAIL=1; } || echo "OK decode clean" | tee -a "$QC/checks.txt"

echo "== QC frames"
while read -r pair; do
  n="${pair%%=*}"; f="${pair##*=}"
  T=$(awk "BEGIN{printf \"%.4f\", ($f+0.5)/30}")
  ffmpeg -nostdin -v error -y -ss "$T" -i "$OUT" -frames:v 1 "$QC/$n.png"
  # seeking at the very end can return nothing: fall back to the last decodable frame
  [ -s "$QC/$n.png" ] || ffmpeg -nostdin -v error -y -sseof -0.25 -i "$OUT" -update 1 "$QC/$n.png"
done < <(node -e 'for (const [n,f] of require(process.argv[1]).qc) console.log(`${n}=${f}`)' "$PWD/$QC/report.json")
python3 scripts/story-sheet.py "$QC" "$QC/report.json"
node -e '
const fs=require("fs"),r=require(process.argv[1]);
fs.writeFileSync(process.argv[2], JSON.stringify({file: process.argv[3], composition: r.meta.compositionId, mode: r.meta.mode, title: r.meta.title, narration: r.source, durationSec: r.durationSec, props: process.argv[4]||null, renderedAt: new Date().toISOString()}, null, 1));
' "$PWD/$QC/report.json" "$OUTDIR/${SLUG}_v${V}.json" "$OUT" "$PROPS"
echo "rendered $OUT (${VDUR}s, narration: $SRC). Inspect $QC before delivering."
exit $FAIL
