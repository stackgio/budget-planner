"""Shorten only long silent gaps in a voiceover (no speech touched, no speed change).

usage: python3 tighten.py <in.mp3> <out.wav> <alignment.json> <out_alignment.json> <cuts.json>
Silences are found with ffmpeg silencedetect (-40 dB). Any silence longer than
MAX_GAP is reduced to KEEP seconds by removing its middle; each splice gets a
short equal-power crossfade, inside silence, so there is no click.
"""
import json, re, subprocess, sys, wave
import numpy as np

src, out, align_in, align_out, cuts_out = sys.argv[1:6]
SR = 44100
MAX_GAP, KEEP, XF = 0.39, 0.32, 0.012

log = subprocess.run(['ffmpeg', '-nostdin', '-i', src, '-af', 'silencedetect=n=-40dB:d=0.25', '-f', 'null', '-'], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', log)]
ends = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', log)]
pcm = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', src, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float64)
dur = len(x) / SR

words = json.load(open(align_in))['words']
cuts = []
for s, e in zip(starts, ends):
    if e >= dur - 0.05:  # trailing silence: leave the file's natural ending alone
        continue
    g = e - s
    if g <= MAX_GAP:
        continue
    rm = g - KEEP
    c0 = s + KEEP / 2
    c1 = c0 + rm
    # never cut inside a transcribed word
    if any(w['start'] < c1 and w['end'] > c0 for w in words):
        print('skip (overlaps word)', s, e)
        continue
    cuts.append((round(c0, 4), round(c1, 4)))

# build output with crossfades at each splice
n = int(XF * SR)
fade_out = np.cos(np.linspace(0, np.pi / 2, n))
fade_in = np.sin(np.linspace(0, np.pi / 2, n))
pieces, pos = [], 0
for c0, c1 in cuts:
    a, b = int(c0 * SR), int(c1 * SR)
    pieces.append(x[pos:a])
    pos = b
pieces.append(x[pos:])
y = pieces[0]
for p in pieces[1:]:
    tail = y[-n:] * fade_out + p[:n] * fade_in
    y = np.concatenate([y[:-n], tail, p[n:]])
y = np.clip(np.round(y), -32768, 32767).astype(np.int16)
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())

def remap(t):
    shift = 0.0
    for c0, c1 in cuts:
        if t >= c1:
            shift += (c1 - c0) + XF
    return round(t - shift, 3)

json.dump({'words': [{**w, 'start': remap(w['start']), 'end': remap(w['end'])} for w in words]}, open(align_out, 'w'), indent=1)
removed = sum(c1 - c0 + XF for c0, c1 in cuts)
json.dump({'cuts': cuts, 'removed_sec': round(removed, 3), 'in_sec': round(dur, 3), 'out_sec': round(len(y) / SR, 3), 'max_gap': MAX_GAP, 'keep': KEEP}, open(cuts_out, 'w'), indent=1)
for c0, c1 in cuts:
    print(f'cut {c0:.3f}-{c1:.3f} ({c1 - c0:.3f}s)')
print(f'removed {removed:.3f}s: {dur:.3f}s -> {len(y) / SR:.3f}s')
