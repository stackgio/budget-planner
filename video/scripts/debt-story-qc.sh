#!/usr/bin/env bash
# QC the exported DebtStory MP4: probe, audio peak/loudness, and a contact sheet of key moments.
# Usage: bash scripts/debt-story-qc.sh [mp4] [outdir]
set -euo pipefail
cd "$(dirname "$0")/.."
MP4="${1:-projects/debt-story/out.mp4}"
OUT="${2:-projects/debt-story/qc}"
mkdir -p "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels:format=duration,bit_rate -of default=nw=1 "$MP4" | tee "$OUT/probe.txt"
ffmpeg -hide_banner -i "$MP4" -af volumedetect,ebur128=peak=true -f null - 2>&1 | grep -E "max_volume|mean_volume|I:|True peak|Peak:" | tail -6 | tee "$OUT/audio.txt"
# key moments (seconds): hook 0/1/3.2, tire, mechanic, bills, BRO freeze, 2027, plan crash, fund, $500, $1000, transfer, pay off, staying, goal, CTA
T=(0 1.0 3.3 5.4 6.6 8.4 10.2 11.0 16.4 19.4 24.2 25.9 27.2 30.6 33.0 35.0 36.4 40.4)
i=0; for t in "${T[@]}"; do ffmpeg -v error -y -ss "$t" -i "$MP4" -frames:v 1 "$OUT/t$(printf %02d $i)_${t}s.png"; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$OUT/t*.png" -vf "scale=360:-1,tile=6x3:padding=8:color=0x222222" -frames:v 1 "$OUT/contact.png"
echo "contact sheet: $OUT/contact.png"
