#!/usr/bin/env python3
"""DMM-007 audio: SUBTLE SOUND EFFECTS ONLY. No music, no pads, no drones.

Series default (config.json -> audio): Stack voice narration + very subtle SFX,
NO background music. Effects are generated from the episode's own event timing
(timing.ts -> T, passed as JSON), at FIXED gain (never peak-normalised), and
ducked a further 6 dB while the narration plays. No impacts, no repetitive ticks.

Events:
  - rain: a very soft, low rain texture that thickens on "surprise" (band noise, fixed low gain)
  - "car" and "doctor" (labelled bills fall): one soft low tink each
  - "Build" (umbrella opens): a soft air puff
  - fund filling (Ten ... week 40): a very soft rising swell
  - fund full ($400, COVERED): one soft chime
  - headline: one soft glass tink
The narration is NOT in this file; Remotion plays the untouched ElevenLabs MP3.
Usage: python3 scripts/daily/make_dmm007_sfx.py timing.json out.wav
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


place(swell(DUR - 0.6, 0.035, 1500, 5000, rise=False), 0.1)              # soft rain texture
place(swell(fr(T["fillDone"]) - fr(T["surprise"]), 0.03, 1500, 5000, rise=False), fr(T["surprise"]))  # heavier rain
place(chime(0.05, 1180, dur=0.6), fr(T["car"] + 2), pan=-0.1)        # CAR REPAIR
place(chime(0.05, 1320, dur=0.6), fr(T["doctor"] + 2), pan=0.15)     # DOCTOR BILL
place(swell(0.6, 0.08, 200, 1200, rise=False), fr(T["build"]))       # umbrella opens
f0, f1 = fr(T["fillStart"]), fr(T["fillDone"])
place(swell(f1 - f0, 0.08, 180, 1200), f0, pan=-0.2)                # fund filling
place(chime(0.08, 990), fr(T["fillDone"] + 1), pan=-0.2)             # $400, covered
place(chime(0.06, 2640, dur=0.8), fr(T["headline"] + 2))             # headline lands

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
