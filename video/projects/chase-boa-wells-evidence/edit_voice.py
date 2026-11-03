"""Tighten the ElevenLabs voiceover for v3 (creator-requested 32-38 s cut).
Keeps whole spoken clauses only (no word splicing), cuts in silence, 8 ms fades,
writes public/voice/<slug>/voice_v3.wav + alignment_v3.json + props_v3.json.
The original voice.mp3 is never modified."""
import json, subprocess, struct, wave, math, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V = os.path.join(ROOT, 'public/voice/chase-boa-wells-evidence')
SR = 44100
pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f'{V}/voice.mp3', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
x = struct.unpack('<%dh' % (len(pcm) // 2), pcm)
words = json.load(open(f'{V}/alignment.json'))['words']

def rms(t, win=0.01):
    a = int(t * SR); s = x[a:a + int(win * SR)]
    return math.sqrt(sum(v * v for v in s) / max(1, len(s)))

def quiet_after(t, lim=60):
    while t < len(x) / SR - 0.06:
        if all(rms(t + k * 0.01) < lim for k in range(6)):
            return t + 0.03
        t += 0.005
    return len(x) / SR

def quiet_before(t, lim=60):
    while t > 0.06:
        if all(rms(t - (k + 1) * 0.01) < lim for k in range(4)):
            return t - 0.01
        t -= 0.005
    return 0.0

# (first word index, last word index, gap after in seconds)
idx = {i: w for i, w in enumerate(words)}
def find(text, after=0):
    for i, w in enumerate(words):
        if i >= after and w['text'] == text:
            return i
    raise KeyError(text)
segs = [
    (find('$180'), find('fee.'), 0.30),            # cold open: "$180 a year if you can't avoid the fee."
    (find('Number'), find('Chase.'), 0.20),          # "Number three: Chase."
    (find('Their'), find('criteria.'), 0.34),       # Chase fee line
    (find('Number', 15), find('America.'), 0.20),    # "Number two: Bank of America."
    (find('In'), find('accounts.'), 0.36),           # BofA CFPB line
    (find('Number', 50), find('Fargo.'), 0.20),      # "Number one: Wells Fargo."
    (find('They'), find("permission."), 0.70),       # Wells Fargo line
    (find("I'm"), find('finance.'), 0.22),           # "I'm 22, still learning personal finance." ("Like," dropped)
    (find("I'm", find('finance.')), find('matters.', find('finance.')), 0.30),
    (find('What'), find('again?'), 0.0),
]
out, align, cursor = [], [], 0.0
fade = int(0.008 * SR)
for a, b, gap in segs:
    t0 = quiet_before(words[a]['start'] + 0.02)
    if a > 0 and t0 < words[a - 1]['end'] - 0.02:
        # no silence before this clause (mid-sentence start): cut at the energy dip between the words
        lo, hi = words[a]['start'] - 0.08, words[a]['start'] + 0.04
        t0 = min((lo + k * 0.0025 for k in range(int((hi - lo) / 0.0025))), key=lambda t: rms(t, 0.005))
    t1 = quiet_after(words[b]['end'] - 0.08)
    s = list(x[int(t0 * SR):int(t1 * SR)])
    for k in range(min(fade, len(s))):
        g = k / fade; s[k] = int(s[k] * g); s[-1 - k] = int(s[-1 - k] * g)
    for w in words[a:b + 1]:
        align.append({'text': w['text'], 'start': round(cursor + max(0, w['start'] - t0), 3), 'end': round(cursor + min(t1, w['end']) - t0, 3)})
    out += s + [0] * int(gap * SR)
    cursor += (t1 - t0) + gap
    print(f'{t0:6.2f}-{t1:6.2f} -> {cursor - gap - (t1 - t0):6.2f}  {" ".join(w["text"] for w in words[a:b + 1])}')
wf = wave.open(f'{V}/voice_v3.wav', 'wb'); wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
wf.writeframes(struct.pack('<%dh' % len(out), *out)); wf.close()
json.dump({'words': align}, open(f'{V}/alignment_v3.json', 'w'))
json.dump({'voiceAudio': 'voice/chase-boa-wells-evidence/voice_v3.wav', 'alignment': 'voice/chase-boa-wells-evidence/alignment_v3.json'}, open(f'{V}/props_v3.json', 'w'), indent=1)
print(f'edited voice: {cursor:.2f}s, {len(align)} words')
