#!/usr/bin/env python3
"""Narration for story / /motion videos → public/voice/<slug>/

The creator's voiceover (usually ElevenLabs MP3/WAV) is the timing authority.
It is copied byte-for-byte and never re-encoded, trimmed or sped up.

  # 1. Ingest + validate the creator's file (MP3/WAV/M4A). Byte-identical copy.
  python3 scripts/voice.py ingest <slug> path/to/voiceover.mp3

  # 2a. No script? Transcribe it with WORD timestamps (exact sync):
  #     ElevenLabs Scribe (needs ELEVENLABS_API_KEY) or local Whisper if installed
  python3 scripts/voice.py transcribe <slug> [--engine auto|elevenlabs|whisper]
  #     → transcript.json, alignment.json, script-lines.json (paste into script.ts)

  # 2b. Have the script too? Forced-align the script to the audio (exact sync):
  ELEVENLABS_API_KEY=... python3 scripts/voice.py align <slug>

  # 3. Script vs. what was actually spoken (needs transcript.json):
  python3 scripts/voice.py diff <slug>

  # Only when the creator explicitly asks for a generated voice:
  ELEVENLABS_API_KEY=... python3 scripts/voice.py tts <slug> --voice <voice_id>

  # Legacy: `copy` = `ingest` (no word timestamps → audio-scaled, approximate)

Every mode writes public/voice/<slug>/props.json for the render scripts.
The script text comes from src/videos/<slug>/script.ts (the `text:` fields).
Standard library only (Whisper fallback uses faster-whisper / openai-whisper if present).
"""
import argparse
import base64
import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
import uuid

ROOT = os.path.join(os.path.dirname(__file__), "..")
API = "https://api.elevenlabs.io/v1"
AUDIO_EXT = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"}


# ── helpers ────────────────────────────────────────────────────────────────
def script_lines(slug):
    p = os.path.join(ROOT, "src", "videos", slug, "script.ts")
    if not os.path.exists(p):
        return []
    src = open(p, encoding="utf8").read()
    return [t.replace("\\'", "'").replace('\\"', '"') for _, t in re.findall(r"text:\s*(['\"])((?:\\.|(?!\1).)*)\1\s*[,}]", src)]


def script_text(slug):
    lines = script_lines(slug)
    if not lines:
        sys.exit(f"no script lines found in src/videos/{slug}/script.ts")
    return " ".join(lines)


def out_dir(slug):
    d = os.path.join(ROOT, "public", "voice", slug)
    os.makedirs(d, exist_ok=True)
    return d


def key(required=True):
    k = os.environ.get("ELEVENLABS_API_KEY")
    if not k and required:
        sys.exit("ELEVENLABS_API_KEY is not set. Options: set it, install faster-whisper for local transcription, "
                 "or provide the written script (timing will then be audio-scaled = approximate).")
    return k


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def probe(path):
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration,format_name,bit_rate:stream=codec_type,codec_name,sample_rate,channels",
             "-of", "json", path], capture_output=True, text=True, check=True).stdout
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        sys.exit(f"ffprobe could not read {path}: {e}")
    j = json.loads(out)
    a = [s for s in j.get("streams", []) if s.get("codec_type") == "audio"]
    if not a:
        sys.exit(f"{path} has no audio stream")
    dur = float(j["format"].get("duration") or 0)
    if dur <= 0.3:
        sys.exit(f"{path} is too short ({dur:.2f}s)")
    return {"durationSec": round(dur, 3), "codec": a[0].get("codec_name"), "sampleRate": int(a[0].get("sample_rate") or 0),
            "channels": a[0].get("channels"), "container": j["format"].get("format_name"), "bitRate": j["format"].get("bit_rate")}


def voice_file(slug):
    """The ingested voice file for a slug (any extension)."""
    d = out_dir(slug)
    for f in sorted(os.listdir(d)):
        if f.startswith("voice.") and os.path.splitext(f)[1].lower() in AUDIO_EXT:
            return os.path.join(d, f)
    return None


def write_props(slug, alignment):
    d = out_dir(slug)
    v = voice_file(slug)
    props = {"voiceAudio": os.path.relpath(v, os.path.join(ROOT, "public"))}
    if alignment:
        props["alignment"] = f"voice/{slug}/alignment.json"
    p = os.path.join(d, "props.json")
    json.dump(props, open(p, "w"), indent=1)
    print("props:", os.path.relpath(p, ROOT), "→", "exact word timing" if alignment else "audio-scaled (APPROXIMATE) timing")


def multipart(fields, file_field, file_path):
    boundary = uuid.uuid4().hex
    parts = []
    for k, v in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    name = os.path.basename(file_path)
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; filename="{name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode())
    parts.append(open(file_path, "rb").read())
    parts.append(f"\r\n--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def post(url, body, ctype, timeout=300):
    req = urllib.request.Request(url, data=body, headers={"xi-api-key": key(), "Content-Type": ctype})
    try:
        return json.load(urllib.request.urlopen(req, timeout=timeout))
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code}: {e.read()[:400].decode(errors='replace')}")
    except urllib.error.URLError as e:
        sys.exit(f"ElevenLabs unreachable ({e.reason}). Check network access to api.elevenlabs.io.")


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def split_lines(words, max_words=16):
    """Group spoken words into script lines at sentence ends (or long clauses)."""
    lines, cur = [], []
    for w in words:
        cur.append(w)
        t = w["text"]
        if re.search(r"[.!?]['\"”]?$", t) or (len(cur) >= max_words and re.search(r"[,;:]$", t)):
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    return [{"id": f"L{i + 1}", "text": " ".join(w["text"] for w in ln), "start": ln[0]["start"], "end": ln[-1]["end"]} for i, ln in enumerate(lines)]


# ── modes ──────────────────────────────────────────────────────────────────
def ingest(slug, audio, replace=False):
    if not os.path.exists(audio):
        sys.exit(f"audio not found: {audio}")
    ext = os.path.splitext(audio)[1].lower()
    if ext not in AUDIO_EXT:
        sys.exit(f"unsupported audio type {ext} (use {', '.join(sorted(AUDIO_EXT))})")
    info = probe(audio)
    d = out_dir(slug)
    existing = voice_file(slug)
    dst = os.path.join(d, "voice" + ext)
    if existing and sha(existing) != sha(audio):
        if not replace:
            sys.exit(f"{os.path.relpath(existing, ROOT)} already holds a DIFFERENT voiceover. Re-run with --replace only if the creator approved replacing it.")
        keep = existing + ".prev"
        shutil.move(existing, keep)
        print("previous voice kept at", os.path.relpath(keep, ROOT))
    if not existing or os.path.abspath(existing) != os.path.abspath(dst) or not os.path.exists(dst):
        shutil.copyfile(audio, dst)
    assert sha(dst) == sha(audio), "copy is not byte-identical"
    info.update({"file": os.path.relpath(dst, ROOT), "source": os.path.abspath(audio), "sha256": sha(dst)})
    json.dump(info, open(os.path.join(d, "audio.json"), "w"), indent=1)
    print(f"voice: {info['file']}  {info['durationSec']}s  {info['codec']} {info['sampleRate']}Hz ch={info['channels']}  sha256 {info['sha256'][:16]} (byte-identical)")
    has_align = os.path.exists(os.path.join(d, "alignment.json"))
    write_props(slug, alignment=has_align)


def need_voice(slug, audio):
    if audio:
        ingest(slug, audio)
    v = voice_file(slug)
    if not v:
        sys.exit(f"no voice ingested for {slug}: run `voice.py ingest {slug} <file>` first")
    return v


def transcribe_elevenlabs(path):
    model = os.environ.get("ELEVENLABS_STT_MODEL", "scribe_v1")
    body, ctype = multipart({"model_id": model, "timestamps_granularity": "word", "tag_audio_events": "false", "diarize": "false"}, "file", path)
    res = post(f"{API}/speech-to-text", body, ctype)
    words = [{"text": w["text"].strip(), "start": float(w["start"]), "end": float(w["end"])}
             for w in res.get("words", []) if w.get("type", "word") == "word" and w["text"].strip()]
    return {"engine": f"elevenlabs:{model}", "text": res.get("text", ""), "words": words}


def transcribe_whisper(path):
    try:
        from faster_whisper import WhisperModel  # type: ignore
        model = WhisperModel(os.environ.get("WHISPER_MODEL", "small.en"), compute_type="int8")
        segs, _ = model.transcribe(path, word_timestamps=True, vad_filter=False)
        words = [{"text": w.word.strip(), "start": float(w.start), "end": float(w.end)} for s in segs for w in (s.words or []) if w.word.strip()]
        return {"engine": "faster-whisper", "text": " ".join(w["text"] for w in words), "words": words}
    except ImportError:
        pass
    try:
        import whisper  # type: ignore
        res = whisper.load_model(os.environ.get("WHISPER_MODEL", "small.en")).transcribe(path, word_timestamps=True)
        words = [{"text": w["word"].strip(), "start": float(w["start"]), "end": float(w["end"])} for s in res["segments"] for w in s.get("words", []) if w["word"].strip()]
        return {"engine": "openai-whisper", "text": res.get("text", ""), "words": words}
    except ImportError:
        return None


def transcribe(slug, audio, engine):
    v = need_voice(slug, audio)
    res = None
    if engine in ("auto", "elevenlabs") and key(required=engine == "elevenlabs"):
        res = transcribe_elevenlabs(v)
    if res is None and engine in ("auto", "whisper"):
        res = transcribe_whisper(v)
    if res is None:
        sys.exit("NO TRANSCRIPTION AVAILABLE: ELEVENLABS_API_KEY is not set and no local Whisper is installed "
                 "(pip install faster-whisper). Ask the creator for the written script, then run `voice.py align` "
                 "(exact, needs the key) or render with audio-scaled timing (approximate).")
    if not res["words"]:
        sys.exit("transcription returned no words")
    d = out_dir(slug)
    json.dump(res, open(os.path.join(d, "transcript.json"), "w"), indent=1)
    json.dump({"words": res["words"]}, open(os.path.join(d, "alignment.json"), "w"))
    lines = split_lines(res["words"])
    json.dump(lines, open(os.path.join(d, "script-lines.json"), "w"), indent=1)
    print(f"transcribed with {res['engine']}: {len(res['words'])} words, {len(lines)} lines\n")
    print("Paste into src/videos/%s/script.ts → SCRIPT (text must stay exactly as spoken):" % slug)
    for ln in lines:
        print(f"\t{{id: '{ln['id']}', text: {json.dumps(ln['text'])}}},  // {ln['start']:.2f}–{ln['end']:.2f}s")
    write_props(slug, alignment=True)
    if script_lines(slug):
        print()
        diff(slug)


def align(slug, audio):
    v = need_voice(slug, audio)
    body, ctype = multipart({"text": script_text(slug)}, "file", v)
    res = post(f"{API}/forced-alignment", body, ctype)
    d = out_dir(slug)
    json.dump({"words": [{"text": w["text"], "start": w["start"], "end": w["end"]} for w in res["words"]]}, open(os.path.join(d, "alignment.json"), "w"))
    print("forced alignment: %d words (script text mapped onto the audio)" % len(res["words"]))
    print("note: forced alignment cannot detect script ≠ narration differences — run `transcribe` + `diff` for that.")
    write_props(slug, alignment=True)


def diff(slug):
    tp = os.path.join(out_dir(slug), "transcript.json")
    if not os.path.exists(tp):
        sys.exit("no transcript.json — run `voice.py transcribe` first")
    spoken = [norm(w["text"]) for w in json.load(open(tp))["words"]]
    spoken = [w for w in spoken if w]
    written = [norm(w) for w in script_text(slug).split()]
    written = [w for w in written if w]
    sm = difflib.SequenceMatcher(a=written, b=spoken, autojunk=False)
    changes = [(op, " ".join(written[i1:i2]), " ".join(spoken[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal"]
    print(f"script vs narration: {sm.ratio() * 100:.1f}% word match, {len(changes)} difference(s)")
    for op, a, b in changes:
        print(f"  {op.upper():8} script: {a or '—'!r:40}  spoken: {b or '—'!r}")
    if changes:
        print("→ the AUDIO is the timing authority: update script.ts lines to what was spoken, and tell the creator about meaningful differences.")
    return changes


def tts(slug, voice, model):
    body = json.dumps({"text": script_text(slug), "model_id": model}).encode()
    res = post(f"{API}/text-to-speech/{voice}/with-timestamps", body, "application/json", timeout=180)
    d = out_dir(slug)
    open(os.path.join(d, "voice.mp3"), "wb").write(base64.b64decode(res["audio_base64"]))
    json.dump({"alignment": res.get("alignment") or res.get("normalized_alignment")}, open(os.path.join(d, "alignment.json"), "w"))
    write_props(slug, alignment=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["ingest", "copy", "transcribe", "align", "diff", "tts"])
    ap.add_argument("slug")
    ap.add_argument("audio", nargs="?")
    ap.add_argument("--voice", help="ElevenLabs voice id (tts)")
    ap.add_argument("--model", default="eleven_multilingual_v2")
    ap.add_argument("--engine", default="auto", choices=["auto", "elevenlabs", "whisper"])
    ap.add_argument("--replace", action="store_true", help="allow replacing a different, already-ingested voice (keeps .prev)")
    a = ap.parse_args()
    if a.mode in ("ingest", "copy"):
        if not a.audio:
            sys.exit("audio file required")
        ingest(a.slug, a.audio, a.replace)
    elif a.mode == "transcribe":
        transcribe(a.slug, a.audio, a.engine)
    elif a.mode == "align":
        align(a.slug, a.audio)
    elif a.mode == "diff":
        diff(a.slug)
    else:
        if not a.voice:
            sys.exit("--voice is required for tts")
        tts(a.slug, a.voice, a.model)
