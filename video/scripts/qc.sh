#!/usr/bin/env bash
# Automated QC: verify export settings and extract the frames that must be inspected.
# Usage: bash scripts/qc.sh <slug>
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG="${1:?usage: qc.sh <slug>}"
DIR="projects/$SLUG"; MP4="$DIR/out.mp4"; QC="$DIR/qc"
rm -rf "$QC"; mkdir -p "$QC"

echo "== export settings"
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,nb_frames \
  -show_entries format=duration,size -of default=nw=1 "$MP4" | tee "$QC/probe.txt"
grep -q "codec_name=h264" "$QC/probe.txt" && grep -q "width=1080" "$QC/probe.txt" && grep -q "height=1920" "$QC/probe.txt" \
  && grep -q "r_frame_rate=30/1" "$QC/probe.txt" && grep -q "pix_fmt=yuv420p" "$QC/probe.txt" \
  && echo "EXPORT OK (h264 1080x1920 30fps yuv420p)" || { echo "EXPORT SETTINGS FAILED"; exit 1; }
AUD=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$MP4" | wc -l)
echo "audio streams: $AUD (expected 0 — music is added at publishing)"

echo "== decode check"
ffmpeg -v error -i "$MP4" -f null - 2> "$QC/decode_errors.txt" || true
[ -s "$QC/decode_errors.txt" ] && { echo "DECODE ERRORS:"; cat "$QC/decode_errors.txt"; } || echo "decode clean"

echo "== frame plan"
npx tsx scripts/timeline-report.ts "$DIR/spec.json" > "$QC/plan.json"
node -e '
const p=require(process.argv[1]);
for (const m of p.marks) console.log(`${m.name.padEnd(14)} t=${m.t.toFixed(2)}s f=${m.frame} date=${m.date} ${m.values}`);
for (const f of p.final) console.log(`FINAL ${f.id} ${f.lastDate} $${Math.round(f.finalValue).toLocaleString("en-US")}`);
' "$PWD/$QC/plan.json" | tee "$QC/plan.txt"

echo "== extracting frames"
node -e 'for (const m of require(process.argv[1]).marks) console.log(m.name, m.frame)' "$PWD/$QC/plan.json" |
while read -r name frame; do
  T=$(awk "BEGIN{t=($frame-0.2)/30; if (t<0) t=0; printf \"%.4f\", t}")
  ffmpeg -nostdin -v error -y -ss "$T" -i "$MP4" -frames:v 1 "$QC/${name}.png"
done
# contact sheet: one frame every second
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$MP4")
ROWS=$(awk "BEGIN{print int(($DUR+5)/6)}")
ffmpeg -v error -y -i "$MP4" -vf "fps=1,scale=270:480,tile=6x${ROWS}:padding=6:color=gray" -frames:v 1 "$QC/contact_sheet.png"
# first 2 seconds, 6 frames
ffmpeg -v error -y -i "$MP4" -t 2 -vf "fps=3,scale=360:640,tile=6x1:padding=6:color=gray" -frames:v 1 "$QC/first_2s.png"
ls -1 "$QC"
echo "QC frames ready in $QC — open and inspect every PNG before delivering."
