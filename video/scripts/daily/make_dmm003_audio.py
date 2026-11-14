#!/usr/bin/env python3
"""DMM-003 bed + SFX (original, synthesised), event-synced to the narration timing.
The voice itself is NOT in this file: Remotion plays the untouched ElevenLabs MP3
on its own track. Music is ducked while the voice speaks.
Usage: python3 scripts/daily/make_dmm003_audio.py timing.json out.wav
"""
import json, sys, wave
import numpy as np

SR, FPS, DUR = 48000, 30, 15.0
N = int(SR * DUR)
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


def tink(level, f0=2400):
    t = tt(0.5)
    s = sum(np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * (9 + 6 * m)) / m for m in (1, 2.71, 5.2))
    return level * s


def pour(d, level, bright=1.0):
    n = band(d, 300, 2600 * bright); n /= np.max(np.abs(n)) + 1e-9
    t = tt(d); bub = 0.75 + 0.25 * np.sin(2 * np.pi * 7.3 * t + 2 * np.sin(2 * np.pi * 1.1 * t))
    env = np.minimum(1, t / 0.12) * np.minimum(1, (d - t) / 0.18)
    return level * n * bub * env


hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def pad(ms, d, lvl, att=0.8, rel=1.2):
    t = tt(d); s = np.zeros_like(t)
    for k, m in enumerate(ms):
        f = hz(m); ph = 2 * np.pi * f * t * (1 + 0.0015 * np.sin(2 * np.pi * 0.17 * t + k))
        s += np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    env = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (d - t) / rel))
    return lvl * s / len(ms) * env


# ---- music: soft pad + pluck pulse; minor-ish before the flip, major after
flip = fr(T["flip"]); endc = fr(T["endCard"])
music = np.zeros(N); 
def mplace(sig, at):
    i = int(at * SR); j = min(N, i + len(sig)); music[i:j] += sig[: j - i]
mplace(pad([45, 52, 57, 60], flip + 0.3, 0.5), 0)
mplace(pad([41, 48, 57, 60], 0.01 + 0.0, 0.0), 0)
mplace(pad([48, 55, 59, 64, 67], DUR - flip, 0.55, att=0.6, rel=2.0), flip)
beat = 60 / 92
for b in range(int(DUR / beat)):
    at = b * beat
    if at > DUR - 0.8: break
    m = (69 if at < flip else 72) + (0, 7, 12, 7)[b % 4]
    t = tt(0.35); pl = np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 14) * 0.18
    mplace(pl, at)
# ducking: low under the voice, lifts for the ending
duck = np.full(N, 0.32)
v0, v1 = int(fr(6) * SR), int(fr(T["voEnd"] + 6) * SR)
ramp = int(0.4 * SR)
duck[:v0] = 0.55
duck[v1:] = 0.75
duck[v1:v1 + ramp] = np.linspace(0.32, 0.75, ramp)
music *= duck
L += music; R += music

# ---- SFX
for k in range(4):
    place(tink(0.10, 2200 + 180 * k), fr(-6 + k * 5 + 8), pan=-0.2 + 0.13 * k)  # tower assembles
a0, a1 = fr(T["rent"] - 16), fr(T["usually"])
place(pour(a1 - a0, 0.16), a0)
place(pour(fr(T["left"]) - fr(T["toSavings"]), 0.07, bright=1.6), fr(T["toSavings"]))  # thin trickle
place(tink(0.07, 3100), fr(T["nothing"] + 3))  # one last drip, then nothing
w = band(0.55, 250, 2200); tw = tt(0.55)
place(w / np.max(np.abs(w)) * np.sin(np.pi * tw / 0.55) ** 2 * 0.16, flip)  # flip whoosh
place(tink(0.14, 1900), fr(T["flip"] + 24))  # tray lands on top
b0, b1 = fr(T["savings2"] - 10), fr(T["rest"] + 18)
place(pour(b1 - b0, 0.16), b0)
place(tink(0.13, 2640) + tink(0.08, 3960), fr(T["savings2"] + 14))  # savings full chime
tb = tt(1.6)
place(np.sin(2 * np.pi * (48 + 30 * np.exp(-tb * 7)) * tb) * np.exp(-tb * 2.5) * 0.35, endc)  # end hit
place(tink(0.12, 2640), fr(T["yearCallout"]))

fade = int(0.5 * SR)
for ch in (L, R): ch[-fade:] *= np.linspace(1, 0, fade) ** 1.5
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
g = min(1.0, 10 ** (-6 / 20) / peak)  # keep headroom for the voice track
pcm = (np.stack([L * g, R * g], axis=1) * 32767).astype(np.int16)
with wave.open(dst, "wb") as wv:
    wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes(pcm.tobytes())
print("wrote", dst, "gain", round(g, 3))
