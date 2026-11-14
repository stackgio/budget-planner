#!/usr/bin/env bash
# Render + QC one Daily Money Motion episode. Versioned output, never overwrites.
# Usage: bash scripts/daily/render.sh <EpisodeId e.g. DMM-001> <CompositionId e.g. DMM001> [--stills-only]
# Output: renders/daily/<EpisodeId>/<EpisodeId>_vNN.mp4 + qc_vNN/ (checks.txt, beat frames,
#         motion strips, contact sheet) + cover_vNN.png
# Exit code is non-zero if any hard check fails.
set -euo pipefail
cd "$(dirname "$0")/../.."
EP="${1:?usage: render.sh <EpisodeId> <CompositionId> [--stills-only]}"
COMP="${2:?usage: render.sh <EpisodeId> <CompositionId> [--stills-only]}"
STILLS_ONLY=0; [ "${3:-}" = "--stills-only" ] && STILLS_ONLY=1
EXPECT_FRAMES=450

BROWSER=()
if [ -n "${REMOTION_BROWSER_EXECUTABLE:-}" ]; then BROWSER=(--browser-executable="$REMOTION_BROWSER_EXECUTABLE")
else for c in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do [ -x "$c" ] && BROWSER=(--browser-executable="$c") && break; done; fi

[ -f public/sfx/whoosh.wav ] || python3 scripts/make_sfx.py
[ -f public/daily/music/dmm-bed-120bpm.wav ] || python3 scripts/daily/make_music.py
echo "== typecheck"; npx tsc --noEmit

OUTDIR="renders/daily/$EP"; mkdir -p "$OUTDIR"
N=1; while [ -e "$OUTDIR/${EP}_v$(printf %02d $N).mp4" ] || [ -d "$OUTDIR/qc_v$(printf %02d $N)" ]; do N=$((N+1)); done
V=$(printf %02d $N); QC="$OUTDIR/qc_v$V"; mkdir -p "$QC"
BEATS=$(npx tsx -e "import {QC_BEATS} from './src/daily/episodes/$(echo "$COMP" | tr 'A-Z' 'a-z')/timing'; console.log(QC_BEATS.map(([n,f]) => n+'='+f).join(' '))")

if [ "$STILLS_ONLY" = 1 ]; then
  node scripts/stills.mjs "$COMP" "$QC" $BEATS --scale=0.5
  echo "stills in $QC"; exit 0
fi

OUT="$OUTDIR/${EP}_v$V.mp4"; TMP="$OUTDIR/.rendering_v$V.mp4"
echo "== render → $OUT"
npx remotion render src/index.ts "$COMP" "$TMP" --codec=h264 --crf=16 --pixel-format=yuv420p \
  --image-format=jpeg --jpeg-quality=95 --color-space=bt709 --audio-codec=aac --audio-bitrate=320k "${BROWSER[@]}"
[ -e "$OUT" ] && { echo "refusing to overwrite $OUT"; exit 1; }
mv "$TMP" "$OUT"

C="$QC/checks.txt"; : > "$C"; FAIL=0
ok() { echo "OK   $*" | tee -a "$C"; }; bad() { echo "FAIL $*" | tee -a "$C"; FAIL=1; }
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,nb_read_frames -show_entries format=duration -of default=nw=1 "$OUT" > "$QC/probe.txt"
g() { grep -m1 "^$1=" "$QC/probe.txt" | cut -d= -f2; }
[ "$(g width)x$(g height)" = "1080x1920" ] && ok "resolution 1080x1920" || bad "resolution $(g width)x$(g height)"
[ "$(g r_frame_rate)" = "30/1" ] && ok "frame rate 30 fps" || bad "frame rate $(g r_frame_rate)"
[ "$(g nb_read_frames)" = "$EXPECT_FRAMES" ] && ok "frame count $EXPECT_FRAMES (decoded)" || bad "frame count $(g nb_read_frames) != $EXPECT_FRAMES"
[ "$(g codec_name)" = "h264" ] && [ "$(g pix_fmt)" = "yuv420p" ] && ok "h264 yuv420p" || bad "codec $(g codec_name) $(g pix_fmt)"
ok "container duration $(g duration)s"
ffmpeg -v error -i "$OUT" -f null - 2> "$QC/decode_errors.txt" || true
[ -s "$QC/decode_errors.txt" ] && bad "decode errors (see decode_errors.txt)" || ok "decode clean"
BLACK=$(ffmpeg -v info -i "$OUT" -vf "blackdetect=d=0.03:pix_th=0.02:pic_th=0.995" -an -f null - 2>&1 | grep -c black_start || true)
[ "$BLACK" = "0" ] && ok "no blank/black frames (blackdetect)" || bad "blackdetect found $BLACK black segment(s)"
FROZEN=$(ffmpeg -v info -i "$OUT" -vf "freezedetect=n=0.0005:d=2.5" -an -f null - 2>&1 | grep -c freeze_start || true)
[ "$FROZEN" = "0" ] && ok "no frozen stretch > 2.5 s" || echo "NOTE $FROZEN static stretch(es) > 2.5 s (fine if it is the intended end hold)" | tee -a "$C"
ACODEC=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$OUT" | head -1)
if [ -n "$ACODEC" ]; then
  ok "audio stream ($ACODEC)"
  ffmpeg -v info -i "$OUT" -af volumedetect -vn -f null - 2>&1 | grep -E "mean_volume|max_volume" | sed 's/.*\] //' | tee -a "$C"
  MAXV=$(ffmpeg -v info -i "$OUT" -af volumedetect -vn -f null - 2>&1 | grep max_volume | sed -E 's/.*max_volume: (-?[0-9.]+) dB/\1/')
  awk "BEGIN{exit !($MAXV < -1.0)}" && ok "no audio clipping (peak $MAXV dB < -1 dB)" || bad "audio peak $MAXV dB (clipping risk)"
else
  echo "NOTE no audio stream" | tee -a "$C"
fi

echo "== QC frames"
for pair in $BEATS; do
  n="${pair%%=*}"; f="${pair##*=}"
  ffmpeg -nostdin -v error -y -i "$OUT" -vf "select=eq(n\,$f)" -vsync 0 -frames:v 1 "$QC/$n.png"
done
# motion strips: 6 fps samples of each act (hook, build, payoff, ending)
for seg in "hook 0 2" "build 2 4" "payoff 6 6" "ending 12 3"; do
  set -- $seg
  ffmpeg -nostdin -v error -y -ss "$2" -t "$3" -i "$OUT" -vf "fps=4,scale=216:-1,tile=6x2" -frames:v 1 "$QC/strip_$1.png"
done
ffmpeg -nostdin -v error -y -i "$OUT" -vf "select='not(mod(n\,45))',scale=270:-1,tile=5x2" -vsync 0 -frames:v 1 "$QC/contact_sheet.png"
# cover: the payoff frame (hook headline + both final numbers visible)
ffmpeg -nostdin -v error -y -i "$OUT" -vf "select=eq(n\,372)" -vsync 0 -frames:v 1 "$OUTDIR/cover_v$V.png"
sha256sum "$OUT" | cut -c1-64 > "$QC/sha256.txt"
echo "rendered $OUT — inspect $QC before approving. hard checks: $([ $FAIL = 0 ] && echo PASS || echo FAIL)"
if [ -f "../daily-money-motion/episodes/$EP/metadata.json" ]; then
  echo "== automated QC (qc_episode.py; add STT with: python3 scripts/daily/qc_episode.py $EP $OUT --stt)"
  python3 scripts/daily/qc_episode.py "$EP" "$OUT" --out "$QC/auto" || FAIL=1
fi
exit $FAIL
