"""Synthesises the subtle reveal sound effects (no music) and writes sfx.wav.

Cues line up with the visual reveals in index.html (see timing.md).
"""
import sys, wave
import numpy as np

SR, DUR = 48000, 26.6
out = np.zeros(int(SR * DUR))


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(t / attack, 1) * np.exp(-t / decay)


def tick(f):  # soft rounded "tock" for each duration reveal
    n = int(.25 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t)
    return s * env(n, .002, .045)


def chime(fs, decay=.35):  # gentle two-note chime
    n = int(1.2 * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * env(n, .004, decay) for f in fs) / len(fs)


def swish(length=.45):  # filtered-noise swell for the rows -> choices morph
    n = int(length * SR); rng = np.random.default_rng(7)
    x = np.convolve(rng.standard_normal(n), np.ones(40) / 40, "same")
    shape = np.sin(np.pi * np.arange(n) / n) ** 2
    return x * shape * 2.5


def put(t, s, gain):
    i = int(t * SR); out[i:i + len(s)] += s[:len(out) - i] * gain


# hook: the two results land (≈26 years, then ≈6½ years)
put(0.85, tick(620), .09)
put(1.10, tick(990), .09)
# chart: each duration reveal, rising pitch across the four rows
for t, f in [(9.80, 660), (12.55, 740), (15.11, 830), (17.55, 990)]:
    put(t, tick(f), .12)

pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else "sfx.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
