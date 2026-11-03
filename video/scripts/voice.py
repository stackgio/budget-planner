#!/usr/bin/env python3
"""Narration for story videos → public/voice/<slug>/{voice.mp3, alignment.json}

  # ElevenLabs text-to-speech WITH timestamps (exact sync)
  ELEVENLABS_API_KEY=... python3 scripts/voice.py tts debt-three-things --voice <voice_id>

  # Your own recording: ElevenLabs forced alignment against the script (exact sync)
  ELEVENLABS_API_KEY=... python3 scripts/voice.py align debt-three-things path/to/my-take.mp3

  # Your own recording without an API key: copy it in; timings are then
  # estimated and stretched to the audio length ("audio-scaled", approximate)
  python3 scripts/voice.py copy debt-three-things path/to/my-take.mp3

Then render with the printed props file:
  bash scripts/render-story.sh public/voice/<slug>/props.json

The script text comes from src/videos/<slug>/script.ts (the `text:` fields).
Standard library only.
"""
import argparse
import base64
import json
import os
import re
import shutil
import sys
import urllib.request
import uuid

ROOT = os.path.join(os.path.dirname(__file__), "..")
API = "https://api.elevenlabs.io/v1"


def script_text(slug):
    src = open(os.path.join(ROOT, "src", "videos", slug, "script.ts"), encoding="utf8").read()
    lines = re.findall(r"text:\s*(['\"])(.*?)\1\s*[,}]", src)
    if not lines:
        sys.exit(f"no script lines found in src/videos/{slug}/script.ts")
    return " ".join(t for _, t in lines).replace("\\'", "'")


def out_dir(slug):
    d = os.path.join(ROOT, "public", "voice", slug)
    os.makedirs(d, exist_ok=True)
    return d


def key():
    k = os.environ.get("ELEVENLABS_API_KEY")
    if not k:
        sys.exit("set ELEVENLABS_API_KEY (or use `copy` for approximate timing)")
    return k


def write_props(slug, alignment=True):
    d = out_dir(slug)
    props = {"voiceAudio": f"voice/{slug}/voice.mp3"}
    if alignment:
        props["alignment"] = f"voice/{slug}/alignment.json"
    p = os.path.join(d, "props.json")
    json.dump(props, open(p, "w"), indent=1)
    print("props:", os.path.relpath(p, ROOT))


def tts(slug, voice, model):
    body = json.dumps({"text": script_text(slug), "model_id": model}).encode()
    req = urllib.request.Request(f"{API}/text-to-speech/{voice}/with-timestamps", data=body, headers={"xi-api-key": key(), "Content-Type": "application/json"})
    res = json.load(urllib.request.urlopen(req, timeout=180))
    d = out_dir(slug)
    open(os.path.join(d, "voice.mp3"), "wb").write(base64.b64decode(res["audio_base64"]))
    json.dump({"alignment": res.get("alignment") or res.get("normalized_alignment")}, open(os.path.join(d, "alignment.json"), "w"))
    write_props(slug)


def align(slug, audio):
    d = out_dir(slug)
    dst = os.path.join(d, "voice.mp3")
    shutil.copyfile(audio, dst)
    boundary = uuid.uuid4().hex
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="text"\r\n\r\n{script_text(slug)}\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="voice.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode(),
        open(dst, "rb").read(),
        f"\r\n--{boundary}--\r\n".encode(),
    ]
    req = urllib.request.Request(f"{API}/forced-alignment", data=b"".join(parts), headers={"xi-api-key": key(), "Content-Type": f"multipart/form-data; boundary={boundary}"})
    res = json.load(urllib.request.urlopen(req, timeout=300))
    json.dump({"words": [{"text": w["text"], "start": w["start"], "end": w["end"]} for w in res["words"]]}, open(os.path.join(d, "alignment.json"), "w"))
    write_props(slug)


def copy(slug, audio):
    shutil.copyfile(audio, os.path.join(out_dir(slug), "voice.mp3"))
    write_props(slug, alignment=False)
    print("note: no word timestamps — scenes use estimated timing stretched to the audio (approximate, not final sync)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["tts", "align", "copy"])
    ap.add_argument("slug")
    ap.add_argument("audio", nargs="?")
    ap.add_argument("--voice", help="ElevenLabs voice id (tts)")
    ap.add_argument("--model", default="eleven_multilingual_v2")
    a = ap.parse_args()
    if a.mode == "tts":
        if not a.voice:
            sys.exit("--voice is required for tts")
        tts(a.slug, a.voice, a.model)
    elif not a.audio:
        sys.exit("audio file required")
    elif a.mode == "align":
        align(a.slug, a.audio)
    else:
        copy(a.slug, a.audio)
