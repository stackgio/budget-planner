#!/usr/bin/env bash
# Render a /graph project to MP4 (1080x1920, 30fps, H.264, yuv420p, no audio).
# Usage: bash scripts/render.sh <slug> [extra remotion flags]
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG="${1:?usage: render.sh <slug>}"; shift || true
SPEC="projects/$SLUG/spec.json"
OUT="projects/$SLUG/out.mp4"
[ -f "$SPEC" ] || { echo "missing $SPEC"; exit 1; }

BROWSER_FLAG=()
if [ -n "${REMOTION_BROWSER_EXECUTABLE:-}" ]; then
  BROWSER_FLAG=(--browser-executable="$REMOTION_BROWSER_EXECUTABLE")
else
  for c in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do
    [ -x "$c" ] && BROWSER_FLAG=(--browser-executable="$c") && break
  done
fi

npx tsc --noEmit
npx remotion render src/index.ts GraphVideo "$OUT" \
  --props="$SPEC" --codec=h264 --crf=16 --pixel-format=yuv420p \
  --image-format=jpeg --jpeg-quality=95 --color-space=bt709 "${BROWSER_FLAG[@]}" "$@"
echo "rendered $OUT"
