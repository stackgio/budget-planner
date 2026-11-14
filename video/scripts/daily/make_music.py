#!/usr/bin/env python3
"""Original 15-second music bed for Daily Money Motion (120 BPM, 450 frames @30fps).

Fully synthesised here (sines, filtered noise, envelopes) — original work owned
by the project, so it is cleared for every platform. Structure follows the
series' 0-2 / 2-6 / 6-12 / 12-15 s grid:
  0-2 s   pulse + sub (hook energy, no intro)
  2-12 s  kick on beats, soft hats on off-beats, minor-to-major chord walk
  9.5-11.5 s noise riser into the payoff
  11.5-15 s resolved major chord, soft hit, natural decay (clean ending)
Peak normalised to -3 dBFS so SFX sit on top without clipping.
Usage: python3 scripts/daily/make_music.py [out.wav]
"""
import os
import sys
import wave

import numpy as np

SR = 48000
DUR = 15.0
BPM = 120
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(11)
out = np.zeros(N)


def tt(d):
    return np.arange(int(SR * d)) / SR


def place(sig, at):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if i < N:
        out[i:j] += sig[: j - i]


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc
        y[k] = acc
    return y


def kick(level=1.0):
    t = tt(0.32)
    f = 42 + 80 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return level * np.sin(ph) * np.exp(-t * 11)


def hat(level=1.0):
    t = tt(0.06)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 6000)  # crude high-pass
    return level * n * np.exp(-t * 70)


def note(freq, d, level=1.0, attack=0.04, release=0.5, bright=0.25):
    t = tt(d)
    s = np.sin(2 * np.pi * freq * t) + bright * np.sin(4 * np.pi * freq * t) + bright * 0.4 * np.sin(6 * np.pi * freq * t)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (d - t) / release))
    return level * s * env


def chord(freqs, d, level):
    return sum(note(f, d, level / len(freqs)) for f in freqs)


hz = lambda m: 440 * 2 ** ((m - 69) / 12)  # midi -> Hz

# chord walk, 2 s each (4 beats): Am - F - C - G - Am - F(sus) then resolve C(add9) at 12 s
prog = [
    (0, [57, 60, 64]),
    (2, [53, 57, 60]),
    (4, [48, 55, 64]),
    (6, [55, 59, 62]),
    (8, [57, 60, 64]),
    (10, [53, 57, 60, 65]),
]
RESOLVE = 11.5  # = payoff frame 345 / 30
for at, ms in prog:
    d = min(2.05, RESOLVE - at + 0.05)
    place(chord([hz(m) for m in ms], d, 0.22), at)
    place(note(hz(ms[0] - 12), d - 0.05, 0.28, attack=0.01, release=0.3, bright=0.1), at)  # bass root
place(chord([hz(m) for m in [48, 55, 60, 62, 64, 67]], DUR - RESOLVE, 0.34), RESOLVE)
place(note(hz(36), DUR - RESOLVE, 0.32, attack=0.01, release=2.2, bright=0.1), RESOLVE)

# rhythm: pulse from frame 0, full kit from 2 s, kit stops at 12 s for the resolve
for b in range(int(RESOLVE / BEAT)):
    at = b * BEAT
    place(kick(0.55 if at < 2 else 0.7), at)
    if at >= 2:
        place(hat(0.10), at + BEAT / 2)
place(kick(0.9), RESOLVE)

# riser 10-12 s (filtered noise swelling)
r = rng.standard_normal(int(2 * SR))
r = r - lowpass(r, 2500)
place(r * np.linspace(0, 1, len(r)) ** 2.2 * 0.09, RESOLVE - 2.0)

# gentle overall fade at the very end (last 0.6 s)
fade = int(0.6 * SR)
out[-fade:] *= np.linspace(1, 0, fade) ** 1.5

peak = np.max(np.abs(out))
out = out / peak * (10 ** (-3 / 20))
stereo = np.stack([out, out], axis=1)
pcm = (stereo * 32767).astype(np.int16)

dst = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'daily', 'music', 'dmm-bed-120bpm.wav')
os.makedirs(os.path.dirname(dst), exist_ok=True)
with wave.open(dst, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', dst, f'{DUR}s', 'peak -3 dBFS')
