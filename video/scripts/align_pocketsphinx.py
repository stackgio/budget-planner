"""Forced alignment of the known script onto the voice with PocketSphinx (offline,
bundled en-US model). Writes alignment.json in the voice.py format:
{"words":[{"text","start","end"}]} where text = display token of the script.
Each display token maps to one or more spoken dictionary words; the token's
time span = first spoken word start .. last spoken word end."""
import json, re, sys
from pocketsphinx import Decoder, get_model_path
import os

raw, out = sys.argv[1], sys.argv[2]
SCRIPT = open(sys.argv[3]).read().split()

SPOKEN = {
    "$100": "one hundred dollars", "$100,": "one hundred dollars", "$70": "seventy dollars",
    "$20": "twenty dollars", "$10?": "ten dollars", "VTI.": "v t i", "VTI,": "v t i", "VTI": "v t i",
    "SCHD.": "s c h d", "SCHD": "s c h d", "VXUS.": "v x u s", "VXUS": "v x u s",
    "ETF": "e t f", "dividend-paying": "dividend paying", "U.S.": "u s",
}

def spoken(tok):
    if tok in SPOKEN: return SPOKEN[tok].split()
    w = re.sub(r"[^a-z']", "", tok.lower().replace("’", "'"))
    return [w] if w else []

pairs = []  # (display token, [spoken words])
for t in SCRIPT:
    pairs.append((t.strip(), spoken(t)))
words = [w for _, s in pairs for w in s]

mp = get_model_path()
d = Decoder(hmm=os.path.join(mp, "en-us/en-us"), dict=os.path.join(mp, "en-us/cmudict-en-us.dict"),
            samprate=16000, loglevel="ERROR")
missing = [w for w in set(words) if d.lookup_word(w) is None]
if missing: sys.exit("not in dict: %s" % missing)
d.set_align_text(" ".join(words))
d.start_utt(); d.process_raw(open(raw, "rb").read(), full_utt=True); d.end_utt()
segs = [(s.word, s.start_frame / 100.0, (s.end_frame + 1) / 100.0) for s in d.seg() if s.word not in ("<s>", "</s>", "<sil>", "(NULL)")]
segs = [(re.sub(r"\(\d+\)$", "", w), a, b) for w, a, b in segs]
assert [w for w, _, _ in segs] == words, (len(segs), len(words))
res, i = [], 0
for tok, sp in pairs:
    chunk = segs[i:i + len(sp)]; i += len(sp)
    res.append({"text": tok, "start": round(chunk[0][1], 3), "end": round(chunk[-1][2], 3)})
json.dump({"words": res, "engine": "pocketsphinx-forced-alignment"}, open(out, "w"), indent=0)
for r in res: print("%6.2f %6.2f %s" % (r["start"], r["end"], r["text"]))
