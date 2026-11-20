#!/usr/bin/env python3
"""Tighten the pauses in an ingested voiceover WITHOUT touching any word.

Only use this when the creator explicitly asks to trim gaps. The original file
(public/voice/<slug>/voice.*) is never modified; this writes a derived copy:

  public/voice/<slug>/voice_tight.wav       pauses shortened, words untouched, 1.0x
  public/voice/<slug>/alignment_tight.json  word timestamps remapped exactly
  public/voice/<slug>/props_tight.json      props for render.sh
  public/voice/<slug>/cuts_tight.json       every removed span (source seconds)

Cuts are made only inside silences detected by ffmpeg (-40 dB, >= 0.2 s) that
sit between two words, keeping `target` seconds of the pause (half on each side)
and a 6 ms fade at each join so nothing clicks.

Usage: python3 scripts/motion/tighten_voice.py <slug> [--sentence 0.22] [--chapter 0.34]
       [--after-number 0.2] [--chapter-words "One,Two,Three,Four,Five,Save"]
"""
import argparse, json, re, subprocess, sys
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("--sentence", type=float, default=0.22, help="pause kept between ordinary words/sentences")
ap.add_argument("--chapter", type=float, default=0.34, help="pause kept before a chapter word (new step)")
ap.add_argument("--after-number", type=float, default=0.2, help="pause kept after a step number word ('One,')")
ap.add_argument("--chapter-words", default="One,Two,Three,Four,Five,Save")
a = ap.parse_args()

d = Path("public/voice") / a.slug
src = next((p for p in sorted(d.glob("voice.*")) if p.suffix in (".mp3", ".wav", ".m4a", ".flac")), None)
if not src:
    sys.exit(f"no voice.* in {d}")
words = json.loads((d / "alignment.json").read_text())["words"]
chapter = {w.strip().lower() for w in a.chapter_words.split(",")}
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())

log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", "silencedetect=n=-40dB:d=0.2", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
sil = list(zip(starts, ends))
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
                           capture_output=True, text=True).stdout)

cuts = []
for w0, w1 in zip(words, words[1:]):
    lo, hi = w0["end"] - 0.12, w1["start"] + 0.12
    s = next(((s0, s1) for s0, s1 in sil if lo <= (s0 + s1) / 2 <= hi), None)
    if not s:
        continue
    nxt, cur = norm(w1["text"]), norm(w0["text"])
    target = a.chapter if nxt in chapter else a.after_number if cur in chapter else a.sentence
    s0, s1 = s
    if s1 - s0 <= target + 0.04:
        continue
    c0, c1 = s0 + target / 2, s1 - target / 2
    if c0 < w0["end"] - 0.02 or c1 > w1["start"] + 0.02:  # never cut into a word
        c0, c1 = max(c0, w0["end"]), min(c1, w1["start"])
    if c1 - c0 > 0.03:
        cuts.append((round(c0, 4), round(c1, 4)))

keep, t = [], 0.0
for c0, c1 in cuts:
    keep.append((t, c0)); t = c1
keep.append((t, dur))

F = 0.006
parts, labels = [], []
for i, (k0, k1) in enumerate(keep):
    fades = []
    if i > 0: fades.append(f"afade=t=in:st=0:d={F}")
    if i < len(keep) - 1: fades.append(f"afade=t=out:st={k1 - k0 - F:.4f}:d={F}")
    chain = ",".join([f"atrim=start={k0:.4f}:end={k1:.4f}", "asetpts=PTS-STARTPTS"] + fades)
    parts.append(f"[0:a]{chain}[s{i}]"); labels.append(f"[s{i}]")
fc = ";".join(parts) + ";" + "".join(labels) + f"concat=n={len(keep)}:v=0:a=1[out]"
out = d / "voice_tight.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-filter_complex", fc, "-map", "[out]", "-c:a", "pcm_s16le", str(out)], check=True)

def remap(x):
    return x - sum(c1 - c0 for c0, c1 in cuts if c1 <= x + 1e-6)

tight = [{"text": w["text"], "start": round(remap(w["start"]), 4), "end": round(remap(w["end"]), 4)} for w in words]
(d / "alignment_tight.json").write_text(json.dumps({"words": tight, "source": f"{src.name} with pauses tightened", "cuts": cuts}))
(d / "cuts_tight.json").write_text(json.dumps({"source": src.name, "cuts_sec": cuts, "removed_sec": round(sum(c1 - c0 for c0, c1 in cuts), 3),
                                                "targets": {"sentence": a.sentence, "chapter": a.chapter, "after_number": a.after_number}}, indent=1))
(d / "props_tight.json").write_text(json.dumps({"voiceAudio": f"voice/{a.slug}/voice_tight.wav", "alignment": f"voice/{a.slug}/alignment_tight.json"}, indent=1))
ndur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout)
print(f"{len(cuts)} pauses tightened, removed {sum(c1 - c0 for c0, c1 in cuts):.2f}s: {dur:.2f}s -> {ndur:.2f}s (last word ends {tight[-1]['end']:.2f}s)")
print(f"original untouched: {src}")
print(f"props: {d / 'props_tight.json'}")
