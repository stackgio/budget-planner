#!/usr/bin/env bash
# Crop licensed Adobe Stock sources (see projects/debt-payoff-3-v2/ASSETS.md) to 1080x1920 / 30 fps proxies.
# Usage: bash scripts/v2-prep-stock.sh <dir with the downloaded originals, named <assetId>.mov|.jpg>
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:?usage: v2-prep-stock.sh <raw dir>}"
OUT=public/debt-payoff-3-v2/stock
mkdir -p "$OUT"
# id  crop-x (source px, left edge of the 9:16 window)  seconds-to-keep
# ONLY="id id" re-crops just those ids
clip() {
  local id=$1 x=$2 dur=$3 w h cw
  if [ -n "${ONLY:-}" ] && [[ " $ONLY " != *" $id "* ]]; then return; fi
  IFS=x read -r w h < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$SRC/$id.mov")
  cw=$(( h * 9 / 16 / 2 * 2 ))
  if [ "$w" -le "$cw" ]; then x=0; cw=$w; fi
  ffmpeg -v error -y -i "$SRC/$id.mov" -t "$dur" -an \
    -vf "crop=${cw}:${h}:${x}:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p" \
    -c:v libx264 -preset slow -crf 18 -movflags +faststart "$OUT/$id.mp4"
  echo "$id -> $OUT/$id.mp4"
}
clip 407052217 1080 12   # hook: calculator + bank statement
clip 314073589 120  14   # card macro (sample numbers only)
clip 216482306 560  14   # coins into a jar on bills
clip 315023474 737  12   # mechanic at a wheel (repair)
clip 1028222252 0   14   # vertical clock time-lapse
clip 1332873009 0   10   # vertical delivery courier
clip 230058613 930  9    # packing a parcel to sell
clip 480504243 930  10   # card + phone purchase
clip 290773630 1697 11   # walking away down a street
clip 573461741 900  7    # golden-hour portrait
# flat tyre still: keep a 9:16 window at full height for Ken Burns moves
[ -n "${ONLY:-}" ] || ffmpeg -v error -y -i "$SRC/477125265.jpg" -vf "crop=1282:2280:490:0" -q:v 2 "$OUT/477125265.jpg"
echo done
