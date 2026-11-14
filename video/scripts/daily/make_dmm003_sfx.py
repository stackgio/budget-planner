#!/usr/bin/env python3
"""DMM-003 v03 audio: SUBTLE SOUND EFFECTS ONLY. No music, no pads, no drones.

Series default from 2026-11-14 (creator's request): Stack voice narration +
very subtle SFX + NO background music. The creator adds music on each platform.

Compared with v02 (make_dmm003_audio.py):
  - music layer removed entirely (pad, pluck pulse)
  - every kept effect is about 13 dB lower (SFX_TRIM)
  - a further 6 dB duck while the narration is playing (VO_DUCK)
  - removed as distracting, repetitive or startling: the 4 tower-assembly tinks,
    the low impact "boom" on the end card, the second chime partial, and the
    final tink. The flip whoosh is softened (darker, slower attack).
  - FIXED gain (no peak normalisation, which would push quiet SFX back up)
The narration is NOT in this file; Remotion plays the untouched ElevenLabs MP3.
Usage: python3 scripts/daily/make_dmm003_sfx.py timing.json out.wav
"""
import json, sys, wave
import numpy as np

SR, FPS, DUR = 48000, 30, 15.0
N = int(SR * DUR)
SFX_TRIM = 10 ** (-13 / 20)  # about -13 dB vs v02
VO_DUCK = 10 ** (-6 / 20)    # extra -6 dB under the voice
V02_GAIN = 0.705             # the master gain v02 ended up with (to make the trim relative to v02)
VO_OFFSET = 6

rng = np.random.default_rng(3)
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


def tink(level, f0=2400, att=0.004):
    """Soft glass tick: slower attack than v02 so it never 'clicks'."""
    t = tt(0.45)
    s = sum(np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * (11 + 6 * m)) / m for m in (1, 2.71))
    return level * s * np.minimum(1, t / att)


def pour(d, level, bright=1.0):
    n = band(d, 300, 2200 * bright); n /= np.max(np.abs(n)) + 1e-9
    t = tt(d); bub = 0.8 + 0.2 * np.sin(2 * np.pi * 6.1 * t + 2 * np.sin(2 * np.pi * 0.9 * t))
    env = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.3)  # gentle in/out
    return level * n * bub * env


# --- kept effects (v02 levels, before trim)
a0, a1 = fr(T["rent"] - 16), fr(T["usually"])
place(pour(a1 - a0, 0.16), a0)                                           # paycheck pour
place(pour(fr(T["left"]) - fr(T["toSavings"]), 0.07, bright=1.4), fr(T["toSavings"]))  # trickle that dries up
place(tink(0.07, 3100), fr(T["nothing"] + 3))                            # the one last drip
w = band(0.7, 200, 1400); tw = tt(0.7)
place(w / np.max(np.abs(w)) * np.sin(np.pi * tw / 0.7) ** 2 * 0.12, fr(T["flip"]))  # soft flip air
place(tink(0.10, 1900), fr(T["flip"] + 24))                              # tray settles on top
b0, b1 = fr(T["savings2"] - 10), fr(T["rest"] + 18)
place(pour(b1 - b0, 0.16), b0)                                           # second payday pour
place(tink(0.10, 2640), fr(T["savings2"] + 14))                          # savings full

# --- trim + duck under the narration (smooth 80 ms ramps)
gain = np.full(N, V02_GAIN * SFX_TRIM)
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
