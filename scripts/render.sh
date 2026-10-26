#!/usr/bin/env bash
# Render a composition to a platform-ready master.
#
#   scripts/render.sh <CompositionId> [output-name] [--draft] [--props '<json>']
#
# 1. Remotion renders H.264 / AAC at the composition's size and fps.
# 2. FFmpeg normalizes loudness to -14 LUFS, -1 dBTP (two-pass EBU R128),
#    copying the video stream untouched.
# 3. scripts/qc.sh verifies the result.
#
# --draft renders faster (CRF 23, half the JPEG quality) for review passes.
set -euo pipefail
cd "$(dirname "$0")/.."

comp=${1:?Usage: scripts/render.sh <CompositionId> [name] [--draft] [--props json]}
shift
name=$comp
if [[ $# -gt 0 && $1 != --* ]]; then name=$1; shift; fi
draft=0
props=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --draft) draft=1 ;;
    --props) props=(--props "$2"); shift ;;
    *) echo "Unknown option $1"; exit 1 ;;
  esac
  shift
done

mkdir -p out
raw="out/.${name}.raw.mp4"
suffix=$([[ $draft == 1 ]] && echo "-draft" || echo "")
final="out/${name}${suffix}.mp4"

quality=()
[[ $draft == 1 ]] && quality=(--crf 23 --jpeg-quality 80)

npx remotion render "$comp" "$raw" "${quality[@]}" "${props[@]}"

echo "Normalizing loudness (target -14 LUFS / -1 dBTP)..."
measure=$(ffmpeg -hide_banner -nostats -i "$raw" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$measure" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
ffmpeg -hide_banner -loglevel error -y -i "$raw" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$final"
rm -f "$raw"

scripts/qc.sh "$final"
