#!/usr/bin/env python3
"""
Tighten selected silences in the creator's voiceover WITHOUT touching any word.

The source MP3 is never modified or re-encoded: this only writes an edit list of
kept source-frame ranges (played back segment by segment in Remotion at 1.0x)
plus the word alignment re-timed onto the edited timeline.

Every cut is placed inside a gap between words, in audio below CUT_DB, at least
MARGIN seconds away from either word. The script refuses otherwise.

usage (from video/): python3 projects/car-payment-reality-v2/tighten_gaps.py
"""
import json
import subprocess
import sys

import numpy as np

FPS = 30
SRC = 'public/voice/car-payment-reality/voice.mp3'
ALIGN = 'public/voice/car-payment-reality/alignment.json'
OUT = 'public/voice/car-payment-reality-v2'
CUT_DB = -70.0
MARGIN = 0.08

# (last word before the gap, its start time) -> remaining gap in seconds.
# Opener and the gap before the final question are tightened most; the beat
# before "But me personally" and the pauses inside phrases ("Bro, that's",
# "it, go for it", "curious, what's") are left exactly as recorded.
TARGETS = {
    ('car?', 4.44): 0.26,  # opener: "...for a car?" → "Like,"
    ('me.', 7.02): 0.26,  # "crazy to me." → "And the worst part?"
    ('part?', 8.10): 0.30,  # "worst part?" → "That's JUST..."
    ('that.', 13.50): 0.34,
    ('gas.', 17.84): 0.34,
    ('car.', 22.96): 0.34,
    ('yet.', 28.82): 0.34,
    ('money.', 32.10): 0.34,
    ('life.', 36.84): 0.34,
    ('car.', 39.78): 0.34,
    ('personally,', 43.64): 0.42,  # keep a real beat after "me personally"
    ('pocket.', 48.36): 0.34,
    ('month?', 53.14): 0.26,  # before the final question
}


def main():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-f', 's16le', '-ac', '1', '-ar', '44100', '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    sr = 44100
    dur = len(a) / sr

    def max_db(t0, t1):
        seg = a[int(t0 * sr): int(t1 * sr)]
        return float(20 * np.log10(np.max(np.abs(seg)) + 1e-9)) if len(seg) else -120.0

    words = json.load(open(ALIGN))['words']
    cuts = []  # (src_start_frame, src_end_frame) removed
    used = set()
    for i in range(len(words) - 1):
        w, nxt = words[i], words[i + 1]
        key = (w['text'], round(w['start'], 2))
        if key not in TARGETS:
            continue
        used.add(key)
        gap = nxt['start'] - w['end']
        remove = int(round((gap - TARGETS[key]) * FPS))
        if remove <= 0:
            continue
        lo, hi = w['end'] + MARGIN, nxt['start'] - MARGIN
        # centre the cut in the gap, snapped to whole frames
        mid = (w['end'] + nxt['start']) / 2
        f0 = int(round(mid * FPS - remove / 2))
        f1 = f0 + remove
        t0, t1 = f0 / FPS, f1 / FPS
        if t0 < lo or t1 > hi:
            sys.exit(f'cut after "{w["text"]}" ({t0:.3f}-{t1:.3f}) would come within {MARGIN}s of a word')
        level = max_db(t0 - 0.02, t1 + 0.02)
        if level > CUT_DB:
            sys.exit(f'cut after "{w["text"]}" is not silent ({level:.1f} dBFS)')
        cuts.append((f0, f1, w['text'], nxt['text'], gap, level))
    missing = set(TARGETS) - used
    if missing:
        sys.exit(f'targets not found in alignment: {missing}')

    total_src = int(np.ceil(dur * FPS))
    segments, cur = [], 0
    for f0, f1, *_ in cuts:
        segments.append([cur, f0])
        cur = f1
    segments.append([cur, total_src])

    def remap(t):
        f = t * FPS
        removed = 0
        for f0, f1, *_ in cuts:
            if f >= f1:
                removed += f1 - f0
            elif f > f0:
                raise ValueError(f'time {t} falls inside a cut')
        return (f - removed) / FPS

    out_words = [{'text': w['text'], 'start': round(remap(w['start']), 4), 'end': round(remap(w['end']), 4)} for w in words]
    edited_frames = sum(b - a_ for a_, b in segments)
    json.dump({'words': out_words}, open(f'{OUT}/alignment.json', 'w'), indent=1)
    json.dump(
        {
            'source': 'voice/car-payment-reality/voice.mp3',
            'fps': FPS,
            'sourceFrames': total_src,
            'editedFrames': edited_frames,
            'segments': segments,
            'cuts': [{'afterWord': c[2], 'beforeWord': c[3], 'srcFrames': [c[0], c[1]], 'gapSec': round(c[4], 3), 'removedSec': round((c[1] - c[0]) / FPS, 3), 'maxDb': round(c[5], 1)} for c in cuts],
        },
        open(f'{OUT}/edit.json', 'w'),
        indent=1,
    )
    json.dump({'voiceAudio': None, 'voiceSource': 'voice/car-payment-reality/voice.mp3', 'voiceEdit': 'voice/car-payment-reality-v2/edit.json', 'alignment': 'voice/car-payment-reality-v2/alignment.json'}, open(f'{OUT}/props.json', 'w'), indent=1)
    removed = sum(c[1] - c[0] for c in cuts) / FPS
    for c in cuts:
        print(f'  cut {(c[1]-c[0])/FPS:.3f}s after "{c[2]}" (gap {c[4]:.2f}s → {c[4]-(c[1]-c[0])/FPS:.2f}s, peak {c[5]:.1f} dBFS)')
    print(f'{len(cuts)} silences tightened, {removed:.2f}s removed; voice {dur:.2f}s → {edited_frames / FPS:.2f}s; words untouched: {len(words)}')


if __name__ == '__main__':
    main()
