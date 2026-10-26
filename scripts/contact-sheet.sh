#!/usr/bin/env bash
# Tiles chosen frames of a video (or an image-sequence folder) into a 3x2 sheet
# with frame numbers burned in. Fast way to review layout and timing.
#   scripts/contact-sheet.sh out/video.mp4 out/checks/sheet.jpg 10 40 90 120 200 300
#   scripts/contact-sheet.sh out/checks/frames out/checks/sheet.jpg 10 40 90 120 200 300
set -euo pipefail
src=$1; out=$2; shift 2
args=(); filters=""; stack=""; k=0
for f in "$@"; do
  if [ -d "$src" ]; then
    args+=(-i "$(ls "$src" | sed -n "$((f + 1))p" | sed "s|^|$src/|")")
    filters+="[$k]scale=360:-1,"
  else
    args+=(-i "$src")
    filters+="[$k]select=eq(n\\,$f),scale=360:-1,"
  fi
  filters+="drawtext=text='f$f':x=10:y=10:fontsize=28:fontcolor=yellow:box=1:boxcolor=black[v$k];"
  stack+="[v$k]"; k=$((k + 1))
done
ffmpeg -hide_banner -loglevel error -y "${args[@]}" -filter_complex "${filters}${stack}xstack=inputs=$k:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0[o]" -map "[o]" -frames:v 1 "$out"
echo "Wrote $out"
