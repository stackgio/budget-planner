#!/usr/bin/env python3
"""DMM-008 audio: SUBTLE SOUND EFFECTS ONLY. No music, no pads, no drones.

Series default (config.json -> audio): Stack voice narration + very subtle SFX,
NO background music. Fixed gain (never peak-normalised), ducked 6 dB under the voice.
No impacts, no repetitive ticks (the 12 monthly envelopes share ONE soft rustle).
Events: $5,000 SAVED pulse, bank A rate, bank B rate (soft chimes), the year of
envelopes (soft rustle + gentle swell), month 12 (one chime), headline (one tink).
Usage: python3 scripts/daily/make_dmm008_sfx.py timing.json out.wav
"""

import json, sys, wave
import numpy as np

SR, FPS, DUR = 48000, 30, 15.0
N = int(SR * DUR)
GAIN = 0.705 * 10 ** (-13 / 20)  # same fixed master level as DMM-003 v03/v04
VO_DUCK = 10 ** (-6 / 20)
VO_OFFSET = 6

rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
T = json.load(open(sys.argv[1])); dst = sys.argv[2]
fr = lambda f: f / FPS
tt = lambda d: np.arange(int(SR * d)) / SR


def place(sig, at, pan=0.0, g=1.0):
    i = int(at * SR)
    if i >= N: return
    if i < 0: sig, i = sig[-i:], 0
    j = min(N, i + len(sig)); s = sig[: j - i] * g
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))


def onepole(x, c):
    a = np.exp(-2 * np.pi * c / SR); y = np.empty_like(x); acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc; y[k] = acc
    return y


def band(d, lo, hi):
    n = rng.standard_normal(int(SR * d)); return onepole(n, hi) - onepole(n, lo)


def chime(level, f0, dur=1.4, att=0.01):
    t = tt(dur)
    s = sum(np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * (3.2 + 2.5 * m)) / m for m in (1, 2.0, 3.01))
    return level * s * np.minimum(1, t / att)


def swell(d, level, lo=200, hi=1600, rise=True):
    n = band(d, lo, hi); n /= np.max(np.abs(n)) + 1e-9
    t = tt(d)
    env = (t / d) ** 1.6 if rise else np.sin(np.pi * t / d) ** 2
    env *= np.minimum(1, (d - t) / 0.35)  # always a soft tail
    return level * n * env


place(chime(0.045, 1180, dur=0.6), fr(T["saved"] + 4), pan=0.0)          # "$5,000 SAVED" pulse
place(chime(0.05, 880, dur=0.7), fr(T["bankA"] + 3), pan=-0.25)          # bank A rate appears
place(chime(0.06, 1320, dur=0.8), fr(T["bankB"] + 3), pan=0.25)          # bank B rate appears
y0, y1 = fr(T["yearStart"]), fr(T["yearDone"])
place(swell(y1 - y0, 0.06, 900, 4200, rise=False), y0)                   # soft paper rustle while the year runs (no ticks)
place(swell(y1 - y0, 0.05, 180, 1000), y0, pan=0.2)                      # gentle rise toward month 12
place(chime(0.08, 990), fr(T["yearDone"] + 1), pan=0.2)                   # month 12: $19.50 vs $200
place(chime(0.06, 2640, dur=0.8), fr(T["headline"] + 2))                 # headline lands

gain = np.full(N, GAIN)
v0, v1 = int(fr(VO_OFFSET) * SR), int((fr(T["voEnd"]) + 0.15) * SR)
duck = np.ones(N); duck[v0:v1] = VO_DUCK
k = int(0.08 * SR); duck = np.convolve(duck, np.ones(k) / k, mode="same")
L *= gain * duck; R *= gain * duck

fade = int(0.5 * SR)
for ch in (L, R): ch[-fade:] *= np.linspace(1, 0, fade) ** 1.5
pcm = (np.clip(np.stack([L, R], axis=1), -1, 1) * 32767).astype(np.int16)
with wave.open(dst, "wb") as wv:
    wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes(pcm.tobytes())
print("wrote", dst, "peak dBFS %.1f" % (20 * np.log10(max(np.max(np.abs(L)), np.max(np.abs(R))) + 1e-12)))
