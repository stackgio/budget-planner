#!/usr/bin/env bash
# Synthesize the subtle SFX used by the DebtStory composition (no downloads, deterministic).
set -euo pipefail
cd "$(dirname "$0")/.."
O=public/debt-story/sfx; mkdir -p "$O"
gen() { ffmpeg -v error -y -f lavfi -i "$2" -t "$3" -af "$4" -ar 44100 -ac 1 "$O/$1.wav"; }
# soft two-tone warning
gen alert "aevalsrc='0.5*sin(2*PI*(if(lt(t,0.12),880,660))*t)*exp(-6*mod(t,0.12))':s=44100" 0.3 "afade=t=out:st=0.22:d=0.08"
# tyre air leak
gen hiss "anoisesrc=color=white:amplitude=0.6:seed=7" 1.0 "highpass=f=2500,lowpass=f=9000,afade=t=in:d=0.08,afade=t=out:st=0.55:d=0.45,volume=0.6"
# paper landing on a desk
gen paper "anoisesrc=color=pink:amplitude=0.9:seed=3" 0.16 "lowpass=f=2200,highpass=f=180,afade=t=out:st=0.01:d=0.15"
# notification ping
gen ping "aevalsrc='0.45*sin(2*PI*1568*t)*exp(-9*t)+0.3*sin(2*PI*2349*t)*exp(-12*t)':s=44100" 0.45 "afade=t=out:st=0.35:d=0.1"
# expense pop
gen pop "aevalsrc='0.6*sin(2*PI*(380+2200*t)*t)*exp(-28*t)':s=44100" 0.18 "afade=t=out:st=0.12:d=0.06"
# heavy stack thud
gen thud "aevalsrc='0.9*sin(2*PI*68*t)*exp(-11*t)+0.25*sin(2*PI*140*t)*exp(-18*t)':s=44100" 0.4 "lowpass=f=600,afade=t=out:st=0.3:d=0.1"
# soft whoosh
gen whoosh "anoisesrc=color=pink:amplitude=0.7:seed=11" 0.35 "bandpass=f=900:width_type=o:w=1.4,afade=t=in:d=0.16,afade=t=out:st=0.17:d=0.18"
# savings confirmation (two-note)
gen confirm "aevalsrc='0.35*sin(2*PI*1047*t)*exp(-7*t)+0.35*sin(2*PI*1568*t)*exp(-7*(t-0.09))*gte(t,0.09)':s=44100" 0.6 "afade=t=out:st=0.45:d=0.15"
# milestone chime (C-E-G)
gen chime "aevalsrc='0.3*sin(2*PI*1047*t)*exp(-5*t)+0.3*sin(2*PI*1319*t)*exp(-5*(t-0.08))*gte(t,0.08)+0.3*sin(2*PI*1568*t)*exp(-4*(t-0.16))*gte(t,0.16)':s=44100" 1.0 "afade=t=out:st=0.7:d=0.3"
ls -1 "$O"
