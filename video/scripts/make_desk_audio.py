#!/usr/bin/env python3
"""Desk-video audio kit (original, synthesised, royalty-free).

  public/sfx/keys.wav          — a small set of car keys landing on a desk
  public/music/desk-bed.wav    — a quiet, warm 72 s chord bed (soft electric-piano
                                 pad + sub), even dynamics so narration stays clear

Run: python3 scripts/make_desk_audio.py
"""
import os
import wave

import numpy as np

SR = 44100
ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
rng = np.random.default_rng(11)


def write(path, x, stereo=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2 if stereo else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def keys():
    n = int(SR * 0.75)
    out = np.zeros(n)
    # thud of the fob on the desk
    tt = np.arange(int(SR * 0.12)) / SR
    thud = np.sin(2 * np.pi * 95 * tt) * np.exp(-tt * 38) * 0.6
    thud += rng.normal(0, 1, len(tt)) * np.exp(-tt * 90) * 0.15
    out[: len(thud)] += thud
    # metal clinks: inharmonic partials, fast decays, staggered
    for k, at in enumerate([0.004, 0.03, 0.075, 0.12, 0.2, 0.31]):
        base = rng.uniform(2300, 3400)
        ln = int(SR * 0.28)
        tt = np.arange(ln) / SR
        s = np.zeros(ln)
        for ratio, amp in [(1.0, 1.0), (1.47, 0.6), (2.09, 0.45), (2.76, 0.3), (3.51, 0.18)]:
            s += amp * np.sin(2 * np.pi * base * ratio * tt + rng.uniform(0, 6.28))
        s *= np.exp(-tt * rng.uniform(22, 38)) * (0.32 / (1 + 0.5 * k))
        s[: int(SR * 0.002)] *= np.linspace(0, 1, int(SR * 0.002))
        i = int(at * SR)
        out[i : i + ln] += s[: max(0, min(ln, n - i))]
    out /= np.max(np.abs(out)) / 0.35  # about -9 dBFS peak
    write(os.path.join(ROOT, "sfx", "keys.wav"), out)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def bed(dur=72.0, bpm=84):
    n = int(SR * dur)
    L = np.zeros(n)
    R = np.zeros(n)
    beat = 60 / bpm
    bar = beat * 4
    # Fmaj9 – Am7 – Dm9 – Bbmaj7(#11-ish), two bars each, warm and unresolved
    prog = [
        [53, 60, 64, 67, 69],
        [57, 60, 64, 67, 71],
        [50, 57, 60, 64, 65],
        [46, 57, 62, 65, 69],
    ]
    t_chord = bar * 2
    idx = 0
    t0 = 0.0
    while t0 < dur:
        chord = prog[idx % len(prog)]
        ln = int(SR * (t_chord + 1.6))
        tt = np.arange(ln) / SR
        att = np.clip(tt / 0.9, 0, 1)
        rel = np.clip((t_chord + 1.6 - tt) / 1.6, 0, 1)
        envl = att * rel
        for j, m in enumerate(chord):
            f = midi(m + 12 if j > 0 else m)
            det = 1 + (rng.uniform(-1, 1) * 0.0015)
            tone = np.sin(2 * np.pi * f * det * tt) + 0.18 * np.sin(2 * np.pi * 2 * f * tt) + 0.05 * np.sin(2 * np.pi * 3 * f * tt)
            trem = 1 + 0.06 * np.sin(2 * np.pi * 0.35 * tt + j)
            v = tone * envl * trem * (0.10 if j > 0 else 0.0)
            pan = 0.5 + (j - 2) * 0.12
            i = int(t0 * SR)
            e = min(n, i + ln)
            L[i:e] += v[: e - i] * (1 - pan)
            R[i:e] += v[: e - i] * pan
        # soft sub on the root
        f = midi(chord[0] - 12)
        sub = np.sin(2 * np.pi * f * tt) * envl * 0.16
        i = int(t0 * SR)
        e = min(n, i + ln)
        L[i:e] += sub[: e - i]
        R[i:e] += sub[: e - i]
        # soft felt-piano plucks on beats 1 and 3 (chord tones, gentle)
        for b in range(8):
            if b % 2:
                continue
            m = chord[1 + (b // 2) % 4] + 12
            pl = int(SR * 1.4)
            tp = np.arange(pl) / SR
            p = (np.sin(2 * np.pi * midi(m) * tp) + 0.3 * np.sin(2 * np.pi * 2 * midi(m) * tp)) * np.exp(-tp * 3.2) * 0.07
            p[: int(SR * 0.006)] *= np.linspace(0, 1, int(SR * 0.006))
            ip = int((t0 + b * beat) * SR)
            ep = min(n, ip + pl)
            if ip < n:
                L[ip:ep] += p[: ep - ip] * 0.55
                R[ip:ep] += p[: ep - ip] * 0.45
        t0 += t_chord
        idx += 1
    # gentle lowpass for warmth
    def lp(x, a=0.18):
        y = np.empty_like(x)
        acc = 0.0
        for k in range(len(x)):
            acc += a * (x[k] - acc)
            y[k] = acc
        return y

    L, R = lp(L), lp(R)
    fade = np.ones(n)
    fi, fo = int(SR * 1.5), int(SR * 3)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[-fo:] = np.linspace(1, 0, fo)
    L *= fade
    R *= fade
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    L, R = L / peak * 0.5, R / peak * 0.5  # about -6 dBFS; the video mixes it far lower
    st = np.empty(n * 2)
    st[0::2] = L
    st[1::2] = R
    write(os.path.join(ROOT, "music", "desk-bed.wav"), st, stereo=True)


if __name__ == "__main__":
    keys()
    bed()
    print("wrote public/sfx/keys.wav and public/music/desk-bed.wav")
