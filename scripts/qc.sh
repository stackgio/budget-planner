#!/usr/bin/env bash
# Technical QC for a short-form master. Exits non-zero if a hard spec fails.
#   scripts/qc.sh out/MyVideo.mp4
set -uo pipefail
f=${1:?Usage: scripts/qc.sh <video.mp4>}
fail=0
ok() { printf '  \033[32mPASS\033[0m %s\n' "$1"; }
bad() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=1; }
warn() { printf '  \033[33mWARN\033[0m %s\n' "$1"; }

probe() { ffprobe -v error -select_streams "$1" -show_entries "stream=$2" -of default=nw=1:nk=1 "$f" | head -1; }

echo "QC: $f"
w=$(probe v:0 width); h=$(probe v:0 height)
[[ $w == 1080 && $h == 1920 ]] && ok "Resolution ${w}x${h} (9:16)" || bad "Resolution ${w}x${h}, expected 1080x1920"

fps=$(probe v:0 r_frame_rate)
[[ $fps == 30/1 ]] && ok "Frame rate $fps" || warn "Frame rate $fps (default is 30/1)"

vc=$(probe v:0 codec_name); pix=$(probe v:0 pix_fmt); prof=$(probe v:0 profile)
[[ $vc == h264 ]] && ok "Video codec H.264 ($prof)" || bad "Video codec $vc, expected h264"
[[ $pix == yuv420p ]] && ok "Pixel format $pix" || bad "Pixel format $pix, expected yuv420p"

ac=$(probe a:0 codec_name); sr=$(probe a:0 sample_rate); ch=$(probe a:0 channels)
[[ $ac == aac ]] && ok "Audio codec AAC ${sr}Hz ${ch}ch" || bad "Audio codec '$ac', expected aac"

vd=$(probe v:0 duration); ad=$(probe a:0 duration)
diff=$(awk -v a="$vd" -v b="$ad" 'BEGIN{d=a-b; if(d<0)d=-d; print d}')
awk -v d="$diff" 'BEGIN{exit !(d<0.1)}' && ok "A/V durations match (video ${vd}s, audio ${ad}s)" || bad "A/V duration mismatch: video ${vd}s audio ${ad}s"
awk -v d="$vd" 'BEGIN{exit !(d<=180)}' && ok "Duration ${vd}s (<= 3 min for Shorts)" || warn "Duration ${vd}s exceeds 3 minutes"

loud=$(ffmpeg -hide_banner -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1)
I=$(echo "$loud" | sed -n 's/^ *I: *\(-\{0,1\}[0-9.]*\) LUFS/\1/p' | tail -1)
TP=$(echo "$loud" | sed -n 's/^ *Peak: *\(-\{0,1\}[0-9.]*\) dBFS/\1/p' | tail -1)
awk -v i="$I" 'BEGIN{exit !(i>=-16 && i<=-12)}' && ok "Integrated loudness ${I} LUFS (target -14)" || warn "Integrated loudness ${I} LUFS (target -14 ±2)"
awk -v p="$TP" 'BEGIN{exit !(p<=-1.0)}' && ok "True peak ${TP} dBTP" || bad "True peak ${TP} dBTP (must be <= -1)"

br=$(ffprobe -v error -show_entries format=bit_rate -of default=nw=1:nk=1 "$f")
ok "Overall bitrate $((br / 1000)) kbps, size $(du -h "$f" | cut -f1)"

blk=$(ffmpeg -hide_banner -nostats -i "$f" -vf blackdetect=d=0.5:pix_th=0.05 -an -f null - 2>&1 | grep -c black_start)
[[ $blk == 0 ]] && ok "No black gaps >= 0.5s" || warn "$blk black segment(s) >= 0.5s (check intros/outros)"

sil=$(ffmpeg -hide_banner -nostats -i "$f" -af silencedetect=n=-50dB:d=1.5 -vn -f null - 2>&1 | grep -c silence_start)
[[ $sil == 0 ]] && ok "No silences >= 1.5s" || warn "$sil silence(s) >= 1.5s (fine on an end card, check elsewhere)"

[[ $fail == 0 ]] && echo "QC passed." || echo "QC FAILED."
exit $fail
