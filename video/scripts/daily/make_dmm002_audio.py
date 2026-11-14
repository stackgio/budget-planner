#!/usr/bin/env python3
"""DMM-002 soundtrack: original, synthesised here, frame-synced to the picture.

Input: JSON {"landings": [frame,...], "launches": [...], "payoff": f, "headOut": f}
exported from src/daily/episodes/dmm002/timing.ts (see render notes).
Layers:
  - tactile paper "slap" + tiny thump on every note landing (quieter as the
    rate rises, so 365 drops become a soft rush instead of a wall of clicks)
  - a breathy flutter while each of the first slow notes falls (ASMR hook)
  - atmospheric pad: dark open fifth that slowly brightens, resolving to a
    major add9 bloom with a low boom exactly on the payoff frame
  - noise riser into the payoff, a soft air-whoosh on the headline swap
Output: 48 kHz stereo WAV, peak-normalised to -1.5 dBFS (mixed loudness checked after render).
Usage: python3 scripts/daily/make_dmm002_audio.py timing.json out.wav
"""
import json
import sys
import wave

import numpy as np

SR = 48000
FPS = 30
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(2)
L = np.zeros(N)
R = np.zeros(N)

spec = json.load(open(sys.argv[1]))
dst = sys.argv[2]


def fr(f):
    return f / FPS


def tt(d):
    return np.arange(int(SR * d)) / SR


def place(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= N:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    j = min(N, i + len(sig))
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan))
    R[i:j] += s * (1 + min(0, pan))


def onepole(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc
        y[k] = acc
    return y


def bandnoise(d, lo, hi):
    n = rng.standard_normal(int(SR * d))
    return onepole(n, hi) - onepole(n, lo)


def slap(level):
    t = tt(0.09)
    paper = bandnoise(0.09, 900, 5200) * np.exp(-t * 55)
    thump = np.sin(2 * np.pi * (95 + 60 * np.exp(-t * 40)) * t) * np.exp(-t * 38)
    return level * (0.9 * paper / (np.max(np.abs(paper)) + 1e-9) + 0.55 * thump)


def flutter(d):
    t = tt(d)
    n = bandnoise(d, 1500, 7000)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 13 * t) ** 2
    env = np.minimum(1, t / (d * 0.6)) * np.minimum(1, (d - t) / 0.05)
    return n / (np.max(np.abs(n)) + 1e-9) * am * env


hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def pad(freqs, d, level, attack=1.2, release=1.5, bright=0.3):
    t = tt(d)
    s = np.zeros_like(t)
    for k, f in enumerate(freqs):
        det = 1 + 0.0018 * np.sin(2 * np.pi * 0.21 * t + k)
        ph = 2 * np.pi * f * np.cumsum(det) / SR
        s += np.sin(ph) + bright * np.sin(2 * ph) * 0.5 + bright * 0.25 * np.sin(3 * ph)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (d - t) / release))
    return level * s / len(freqs) * env


lands = spec["landings"]
launches = spec["launches"]
payoff = fr(spec["payoff"])
head_out = fr(spec["headOut"])

# --- note landings
for i, f in enumerate(lands):
    gap = lands[i] - lands[i - 1] if i > 0 else 30
    level = 0.9 if i < 4 else float(np.clip(0.55 * (gap / 6) ** 0.5, 0.1, 0.55))
    place(slap(level * rng.uniform(0.85, 1.0)), fr(f), pan=float(rng.uniform(-0.25, 0.25)))
# --- flutter during the first slow falls (the ASMR hook)
for i in range(5):
    d = (lands[i] - launches[i]) / FPS
    place(flutter(d) * 0.16, fr(launches[i]), pan=0.1 * (-1) ** i)
# --- time-lapse rush: rises with drop density between first acceleration and payoff
rush_start, rush_end = fr(lands[5]), payoff
d = rush_end - rush_start
n = bandnoise(d, 1200, 6500)
n = n / np.max(np.abs(n))
t = tt(d)
place(n * (t / d) ** 1.8 * 0.22, rush_start)

# --- pad: D minor-ish open fifth that brightens, resolving on the payoff
place(pad([hz(38), hz(45), hz(50)], payoff + 0.2, 0.55, attack=0.4, release=0.6, bright=0.15), 0.0)
place(pad([hz(62), hz(65), hz(69)], payoff - 5.5, 0.16, attack=3.0, release=0.5, bright=0.2), 5.5)
place(pad([hz(38), hz(50), hz(57), hz(62), hz(64), hz(66), hz(69)], DUR - payoff, 0.62, attack=0.05, release=2.6, bright=0.35), payoff)
# low boom on the payoff
tb = tt(2.2)
place(np.sin(2 * np.pi * (34 + 50 * np.exp(-tb * 6)) * tb) * np.exp(-tb * 2.2) * 0.9, payoff)
# riser into the payoff
dr = 2.6
nr = bandnoise(dr, 400, 3000)
nr = nr / np.max(np.abs(nr))
place(nr * np.linspace(0, 1, len(nr)) ** 3 * 0.25, payoff - dr)
# whoosh on the headline swap
dw = 0.6
nw = bandnoise(dw, 300, 2500)
tw = tt(dw)
place(nw / np.max(np.abs(nw)) * np.sin(np.pi * tw / dw) ** 2 * 0.2, head_out - 0.1)

# master: gentle tail fade, peak normalise
fade = int(0.5 * SR)
for ch in (L, R):
    ch[-fade:] *= np.linspace(1, 0, fade) ** 1.6
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
g = 10 ** (-1.5 / 20) / peak
pcm = (np.stack([L * g, R * g], axis=1) * 32767).astype(np.int16)
with wave.open(dst, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", dst)
