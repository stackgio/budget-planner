#!/usr/bin/env bash
# Synthesizes the small, license-free SFX kit into public/sfx/ with FFmpeg.
# Subtle by design: they sit under the narration, never on top of it.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/sfx
q="-hide_banner -loglevel error -y"

# Notification: two soft sine tones (E6 → A6) with fast decay.
ffmpeg $q -f lavfi -i "sine=f=1318.5:d=0.18" -f lavfi -i "sine=f=1760:d=0.32" \
  -filter_complex "[0]afade=t=out:st=0.02:d=0.16,volume=0.5[a];[1]adelay=110|110,afade=t=out:st=0.13:d=0.3,volume=0.45[b];[a][b]amix=inputs=2:normalize=0,aformat=sample_rates=48000:channel_layouts=stereo" \
  public/sfx/notification.wav

# Pop: short downward pitch blip.
ffmpeg $q -f lavfi -i "aevalsrc='0.6*sin(2*PI*(500-1800*t)*t)*exp(-38*t)':s=48000:d=0.16" \
  -af "aformat=channel_layouts=stereo" public/sfx/pop.wav

# Whoosh: band-passed noise swell.
ffmpeg $q -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.5" \
  -af "bandpass=f=1200:w=900,afade=t=in:d=0.3:curve=exp,afade=t=out:st=0.3:d=0.2,volume=0.6,aformat=sample_rates=48000:channel_layouts=stereo" \
  public/sfx/whoosh.wav

# Tick: tiny click for counters / UI taps.
ffmpeg $q -f lavfi -i "aevalsrc='0.5*sin(2*PI*2400*t)*exp(-120*t)':s=48000:d=0.05" \
  -af "aformat=channel_layouts=stereo" public/sfx/tick.wav

ls -la public/sfx
