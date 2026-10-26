#!/usr/bin/env python3
"""
Placeholder narration for drafting when the ElevenLabs voiceover is not ready yet.

Synthesizes each script line with Piper TTS, joins them with a fixed pause and
writes two files that mimic what ElevenLabs gives you:

  <out-dir>/narration.wav             the audio
  <out-dir>/alignment.json            ElevenLabs /with-timestamps style alignment
                                      ({characters, character_start_times_seconds,
                                        character_end_times_seconds}) plus "lines"

Line boundaries are exact (measured from the synthesized audio). Character times
inside a line are estimated proportionally, so word highlights are approximate.
Real ElevenLabs alignment replaces this file and is exact.

Usage:
  python placeholder-narration.py --script src/videos/<id>/script.txt \
      --model en-us-ryan-high.onnx --out-dir public/videos/<id>
"""
import argparse
import array
import json
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

GAP_SECONDS = 0.35  # pause between lines
SILENCE_THRESHOLD = 600  # int16 amplitude treated as silence when trimming


def read_lines(path: Path) -> list[str]:
    rows = [r.strip() for r in path.read_text().splitlines()]
    return [r for r in rows if r and not r.startswith("#")]


def char_weight(c: str) -> float:
    if c.isalnum():
        return 1.0
    if c in ".!?":
        return 3.0
    if c in ",;:":
        return 2.0
    return 0.6


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--length-scale", type=float, default=1.0)
    args = ap.parse_args()

    voice = PiperVoice.load(args.model)
    rate = voice.config.sample_rate
    cfg = SynthesisConfig(length_scale=args.length_scale)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    all_samples = array.array("h")
    chars: list[str] = []
    starts: list[float] = []
    ends: list[float] = []
    lines_meta = []

    lead = array.array("h", [0] * int(rate * 0.25))
    all_samples.extend(lead)

    for i, text in enumerate(read_lines(Path(args.script))):
        samples = array.array("h")
        for chunk in voice.synthesize(text, cfg):
            samples.frombytes(chunk.audio_int16_bytes)

        # Trim leading/trailing silence so line boundaries hug the speech.
        first = next((k for k, s in enumerate(samples) if abs(s) > SILENCE_THRESHOLD), 0)
        last = next(
            (k for k in range(len(samples) - 1, -1, -1) if abs(samples[k]) > SILENCE_THRESHOLD),
            len(samples) - 1,
        )
        speech = samples[first : last + 1]

        line_start = len(all_samples) / rate
        all_samples.extend(speech)
        line_end = len(all_samples) / rate
        all_samples.extend(array.array("h", [0] * int(rate * GAP_SECONDS)))

        # Distribute characters across the spoken span by weight.
        if chars:
            chars.append(" ")
            starts.append(line_start)
            ends.append(line_start)
        weights = [char_weight(c) for c in text]
        total = sum(weights)
        t = line_start
        for c, w in zip(text, weights):
            d = (line_end - line_start) * w / total
            chars.append(c)
            starts.append(round(t, 4))
            ends.append(round(t + d, 4))
            t += d

        lines_meta.append(
            {"id": f"L{i + 1}", "text": text, "startMs": round(line_start * 1000), "endMs": round(line_end * 1000)}
        )

    with wave.open(str(out_dir / "narration.wav"), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(all_samples.tobytes())

    alignment = {
        "source": "placeholder-piper",
        "alignment": {
            "characters": chars,
            "character_start_times_seconds": starts,
            "character_end_times_seconds": ends,
        },
        "lines": lines_meta,
    }
    (out_dir / "alignment.json").write_text(json.dumps(alignment))
    print(f"Wrote {out_dir / 'narration.wav'} ({len(all_samples) / rate:.2f}s) and alignment.json")
    for line in lines_meta:
        print(f"  {line['id']}: {line['startMs']}-{line['endMs']}ms  {line['text']}")


if __name__ == "__main__":
    main()
