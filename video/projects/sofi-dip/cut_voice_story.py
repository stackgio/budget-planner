"""Story edit (v3) of the creator's ElevenLabs voiceover for SofiDip.

Only whole phrases are kept or dropped, and every cut sits inside a natural
pause (or, for the first cut, at the onset of the "s" in "some"). No speed
change, no pitch change, no new speech. The original file is untouched;
word timings come from its forced alignment, shifted through the edit list.

Run from video/:  python3 projects/sofi-dip/cut_voice_story.py
"""
import hashlib
import json
import subprocess
import wave

import numpy as np

SRC = 'public/voice/sofi-dip/voice.mp3'
OUT = 'public/voice/sofi-dip-story'
SR = 44100
# (id, source start, source end, gap after in seconds)
SEG = [
    # 1 HOOK
    ('A', 2.895, 7.55, 0.18),   # some investors were panic-selling, I did the complete opposite. I bought more stock.
    # 2 CONTEXT (the only moved phrase: the original opening line now introduces the market recap)
    ('B', 0.0, 2.55, 0.18),     # The stock market took a massive hit yesterday,
    ('C', 7.65, 15.70, 0.12),   # The Nasdaq dropped 5.5%, ... But instead of panicking, I saw an opportunity.
    # 3-6 REASON, RISK, DECISION, ENDING — continuous original audio, untouched order
    ('D', 15.80, None, 0.0),    # I bought more SoFi stock. Why? ... Always do your own research.
]
FADE = int(0.008 * SR)

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float64)
words = json.load(open('public/voice/sofi-dip/alignment.json'))['words']

out, new_words, edl, t = [], [], [], 0.0
for name, a, b, gap in SEG:
    b = b if b is not None else len(x) / SR
    s = x[int(round(a * SR)):int(round(b * SR))].copy()
    if a > 0:
        s[:FADE] *= np.linspace(0, 1, FADE)
    s[-FADE:] *= np.linspace(1, 0, FADE)
    for w in words:
        if w['start'] >= a - 0.01 and w['end'] <= b + 0.01:
            new_words.append({'text': w['text'], 'start': round(w['start'] - a + t, 3), 'end': round(w['end'] - a + t, 3)})
    edl.append({'seg': name, 'srcStart': a, 'srcEnd': round(b, 3), 'outStart': round(t, 3)})
    out.append(s)
    t += len(s) / SR
    if gap:
        out.append(np.zeros(int(gap * SR)))
        t += gap

y = np.concatenate(out).clip(-32768, 32767).astype(np.int16)
with wave.open(f'{OUT}/voice.wav', 'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(y.tobytes())
json.dump({'words': new_words, 'engine': 'pocketsphinx forced alignment of the original, remapped through edl.json'}, open(f'{OUT}/alignment.json', 'w'))
json.dump(
    {
        'source': SRC,
        'sourceSha256': hashlib.sha256(open(SRC, 'rb').read()).hexdigest(),
        'note': 'cut edit at natural pauses; no speed change, no new speech; 8 ms fades at cut points',
        'segments': edl,
        'durationSec': round(len(y) / SR, 3),
    },
    open(f'{OUT}/edl.json', 'w'),
    indent=1,
)
json.dump({'voiceAudio': OUT.replace('public/', '') + '/voice.wav', 'alignment': OUT.replace('public/', '') + '/alignment.json'}, open(f'{OUT}/props.json', 'w'), indent=1)
print(f'{len(y) / SR:.2f}s, {len(new_words)} words')
for e in edl:
    print(e)
