#!/usr/bin/env python3
"""Generate Stack With Gio's subtle sound-effect kit into public/sfx/*.wav.

Everything is synthesised here (noise, sines, envelopes): original and
royalty-free. Levels are deliberately low (peak about -9 dBFS) so effects sit
under narration. Re-run any time: python3 scripts/make_sfx.py
"""
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, d=0.2, curve=4.0):
    x = np.arange(n) / SR
    att = np.clip(x / max(a, 1e-4), 0, 1)
    dec = np.exp(-np.maximum(0, x - a) * curve / max(d, 1e-4))
    return att * dec


def lowpass(x, alpha):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def bandsweep(x, a0, a1):
    """one-pole lowpass whose coefficient sweeps a0->a1, minus a slower one = moving band"""
    n = len(x)
    alphas = np.linspace(a0, a1, n)
    y = np.zeros(n)
    lo = 0.0
    lo2 = 0.0
    for i in range(n):
        lo += alphas[i] * (x[i] - lo)
        lo2 += alphas[i] * 0.25 * (x[i] - lo2)
        y[i] = lo - lo2
    return y


def norm(x, peak_db=-9.0):
    x = x - np.mean(x)
    m = np.max(np.abs(x)) or 1
    return x / m * (10 ** (peak_db / 20))


def fade(x, ms=6):
    n = int(SR * ms / 1000)
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    return x


def save(name, x, peak_db=-9.0):
    x = fade(norm(x, peak_db))
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def whoosh(d=0.45, a0=0.02, a1=0.25):
    n = int(SR * d)
    x = rng.standard_normal(n)
    y = bandsweep(x, a0, a1)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    return y * shape


def tone(f, d, decay, harm=(1.0,), detune=0.0):
    x = t(d)
    s = sum(a * np.sin(2 * np.pi * f * (k + 1) * (1 + detune * k) * x) for k, a in enumerate(harm))
    return s * env(len(x), 0.002, decay, 5)


save("whoosh", whoosh(0.42, 0.015, 0.3), -11)
save("whoosh-soft", whoosh(0.6, 0.01, 0.12), -15)
# pop: quick pitch drop
x = t(0.12)
f = 900 * np.exp(-x * 30) + 260
save("pop", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.001, 0.05, 6), -12)
# coin: bright inharmonic ring
save("coin", tone(2093, 0.5, 0.25, (1, 0.5, 0.3), 0.37) + tone(2637, 0.5, 0.2, (0.6,)) * np.r_[np.zeros(int(SR * 0.06)), np.ones(int(SR * 0.44))], -12)
# cash: paper riffle + small ding
n = int(SR * 0.35)
rif = rng.standard_normal(n) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * t(0.35)))) * env(n, 0.01, 0.2, 3)
rif = rif - lowpass(rif, 0.08)
ding = np.r_[np.zeros(int(SR * 0.12)), tone(1568, 0.23, 0.15, (1, 0.4))]
save("cash", rif * 0.7 + ding[:n] * 0.5, -12)
# card: short slide/swipe
n = int(SR * 0.22)
sw = rng.standard_normal(n)
sw = (sw - lowpass(sw, 0.3)) * np.sin(np.linspace(0, np.pi, n)) ** 2
save("card", sw, -14)
# paper: flick / rustle
n = int(SR * 0.18)
pa = rng.standard_normal(n) * env(n, 0.003, 0.06, 3)
save("paper", pa - lowpass(pa, 0.2), -14)
# thud: low body + soft noise click
x = t(0.35)
th = np.sin(2 * np.pi * (55 + 60 * np.exp(-x * 25)) * x) * env(len(x), 0.002, 0.18, 4)
cl = lowpass(rng.standard_normal(len(x)), 0.15) * env(len(x), 0.001, 0.03, 6)
save("thud", th + 0.4 * cl, -8)
# stamp: thud + wood knock
x = t(0.25)
kn = tone(420, 0.25, 0.06, (1, 0.5, 0.2), 0.11)
save("stamp", th[: len(x)] * 0.8 + kn * 0.6, -9)
# chime: two-note rise (success)
c1 = tone(1046.5, 0.6, 0.35, (1, 0.25))
c2 = np.r_[np.zeros(int(SR * 0.11)), tone(1568, 0.49, 0.35, (1, 0.25))]
save("chime", c1 + c2, -13)
# tick: clock tick
save("tick", tone(3200, 0.04, 0.012, (1,)) + 0.5 * tone(1800, 0.04, 0.01, (1,)), -16)
# click: UI click
save("click", tone(1400, 0.05, 0.015, (1, 0.3)), -16)
print("wrote", sorted(os.listdir(OUT)))
