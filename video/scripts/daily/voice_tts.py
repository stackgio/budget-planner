#!/usr/bin/env python3
"""Daily Money Motion narration: ElevenLabs TTS with the creator's saved voice, cached.

- Voice comes from daily-money-motion/config.json -> narrator.voice_id (the
  creator's own saved ElevenLabs voice). Never creates or clones a voice.
- Auth: ELEVENLABS_API_KEY from the environment. In this cloud environment the
  network proxy injects the real key for api.elevenlabs.io, so a placeholder is
  fine; the key is never written to disk or printed.
- Cache: key = sha256(voice_id, model, settings, text). Same inputs -> no API call.
- Output: public/daily/voice/<episode>/voice.mp3 (byte copy of the cached file)
  and words.json (word start/end seconds from the API's character alignment).

Usage: python3 scripts/daily/voice_tts.py <EPISODE_ID> "<script text>" [--force]
"""
import base64
import hashlib
import json
import os
import shutil
import sys
import urllib.error
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CFG = os.path.join(ROOT, "..", "daily-money-motion", "config.json")
CACHE = os.path.join(ROOT, "public", "daily", "voice", "_cache")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    ep, text = sys.argv[1], sys.argv[2].strip()
    force = "--force" in sys.argv
    narr = json.load(open(CFG))["narrator"]
    voice, model, settings = narr["voice_id"], narr["model_id"], narr["voice_settings"]
    key = hashlib.sha256(json.dumps([voice, model, settings, text], sort_keys=True).encode()).hexdigest()[:20]
    os.makedirs(CACHE, exist_ok=True)
    mp3, meta = os.path.join(CACHE, key + ".mp3"), os.path.join(CACHE, key + ".json")
    if force or not (os.path.exists(mp3) and os.path.exists(meta)):
        body = json.dumps({"text": text, "model_id": model, "voice_settings": settings}).encode()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
            data=body,
            headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected"), "Content-Type": "application/json"},
        )
        try:
            res = json.load(urllib.request.urlopen(req, timeout=180))
        except urllib.error.HTTPError as e:
            sys.exit(f"ElevenLabs error {e.code}: {e.read()[:300]!r}")
        open(mp3, "wb").write(base64.b64decode(res["audio_base64"]))
        al = res.get("normalized_alignment") or res["alignment"]
        json.dump({"voice_id": voice, "model_id": model, "settings": settings, "text": text, "alignment": al}, open(meta, "w"))
        print("generated (API call)", key)
    else:
        print("cache hit (no API call)", key)
    m = json.load(open(meta))
    al = m["alignment"]
    chars, starts, ends = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur = [], None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                words.append(cur)
                cur = None
            continue
        if cur is None:
            cur = {"text": c, "start": s, "end": e}
        else:
            cur["text"] += c
            cur["end"] = e
    if cur:
        words.append(cur)
    out = os.path.join(ROOT, "public", "daily", "voice", ep)
    os.makedirs(out, exist_ok=True)
    shutil.copyfile(mp3, os.path.join(out, "voice.mp3"))
    json.dump({"cache_key": key, "voice_id": voice, "model_id": model, "text": text, "words": words}, open(os.path.join(out, "words.json"), "w"), indent=1)
    print(f"{len(words)} words, {words[0]['start']:.2f}s -> {words[-1]['end']:.2f}s")
    for w in words:
        print(f"  {w['start']:6.2f} {w['end']:6.2f}  {w['text']}")


if __name__ == "__main__":
    main()
