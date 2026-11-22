#!/usr/bin/env python3
"""Two-voice dialogue tracks for /motion videos (e.g. Gio + a friend).

The dialogue lives in src/videos/<slug>/dialogue.json:
  {"speakers": {"gio": {"voice_id", "settings"}, ...}, "model_id", "leadSec",
   "lines": [{"id", "speaker", "text", "gapBefore"}]}
Line ids and texts must equal SCRIPT in script.ts (script.ts imports this file).

Commands (run from video/):
  python3 scripts/motion/dialogue.py tts <slug> [--force]
      Generate one ElevenLabs clip per line (cached in public/voice/<slug>/clips/,
      regenerated only when its text/voice changes, or with --force), lay the clips
      on one timeline and write one full-length track per speaker
      (public/voice/<slug>/<speaker>.wav), exact word timings (alignment.json),
      timeline.json and props.json.
  python3 scripts/motion/dialogue.py align <slug>
      DROP-IN: you supply public/voice/<slug>/<speaker>.wav|mp3 yourself (one
      full-length track per speaker, already positioned on the shared timeline).
      Each track is used untouched; ElevenLabs forced alignment maps that speaker's
      lines onto it, and alignment.json + props.json are rewritten.
Then: bash scripts/motion/render.sh <slug> public/voice/<slug>/props.json
"""
import base64, hashlib, json, os, subprocess, sys, urllib.error, urllib.request, uuid

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
API = "https://api.elevenlabs.io/v1"
SR = 44100


def load(slug):
    p = os.path.join(ROOT, "src", "videos", slug, "dialogue.json")
    if not os.path.exists(p):
        sys.exit(f"missing {p}")
    return json.load(open(p))


def vdir(slug, *parts):
    d = os.path.join(ROOT, "public", "voice", slug, *parts)
    os.makedirs(d, exist_ok=True)
    return d


def request(url, body, ctype, timeout=180):
    # api.elevenlabs.io credentials may be injected by a proxy; a real key in the env also works
    hdr = {"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected"), "Content-Type": ctype}
    try:
        return json.load(urllib.request.urlopen(urllib.request.Request(url, data=body, headers=hdr), timeout=timeout))
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code}: {e.read()[:400].decode(errors='replace')}")
    except urllib.error.URLError as e:
        sys.exit(f"ElevenLabs unreachable ({e.reason})")


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True, check=True).stdout.strip())


def words_from_chars(al):
    out, cur = [], None
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                out.append(cur)
            cur = None
            continue
        if cur is None:
            cur = {"text": "", "start": s, "end": e}
        cur["text"] += ch
        cur["end"] = e
    if cur:
        out.append(cur)
    return out


def tts(slug, force=False):
    cfg = load(slug)
    clips = vdir(slug, "clips")
    for ln in cfg["lines"]:
        sp = cfg["speakers"][ln["speaker"]]
        req = {"text": ln["text"], "model_id": cfg["model_id"], "voice_settings": sp.get("settings", {})}
        h = hashlib.sha256(json.dumps([sp["voice_id"], req], sort_keys=True).encode()).hexdigest()[:16]
        mp3, meta = os.path.join(clips, f"{ln['id']}.mp3"), os.path.join(clips, f"{ln['id']}.json")
        if not force and os.path.exists(mp3) and os.path.exists(meta) and json.load(open(meta)).get("hash") == h:
            print(f"  {ln['id']}: cached")
            continue
        res = request(f"{API}/text-to-speech/{sp['voice_id']}/with-timestamps?output_format=mp3_44100_192",
                      json.dumps(req).encode(), "application/json")
        open(mp3, "wb").write(base64.b64decode(res["audio_base64"]))
        json.dump({"hash": h, "voice_id": sp["voice_id"], "text": ln["text"], "alignment": res["alignment"]}, open(meta, "w"))
        print(f"  {ln['id']}: generated ({sp.get('voice_name', sp['voice_id'])}) {duration(mp3):.2f}s")
    build(slug, cfg)


def build(slug, cfg):
    """Place every clip on one timeline; write one full-length track per speaker + exact word timings."""
    clips = vdir(slug, "clips")
    t = cfg.get("leadSec", 0.25)
    timeline, words = [], []
    for ln in cfg["lines"]:
        t += ln.get("gapBefore", 0)
        mp3 = os.path.join(clips, f"{ln['id']}.mp3")
        d = duration(mp3)
        al = json.load(open(os.path.join(clips, f"{ln['id']}.json")))["alignment"]
        for w in words_from_chars(al):
            words.append({"text": w["text"], "start": round(t + w["start"], 3), "end": round(t + w["end"], 3), "line": ln["id"]})
        timeline.append({"id": ln["id"], "speaker": ln["speaker"], "offsetSec": round(t, 3), "durationSec": round(d, 3)})
        t += d
    total = t
    out = vdir(slug)
    for spk in cfg["speakers"]:
        mine = [x for x in timeline if x["speaker"] == spk]
        args = ["ffmpeg", "-v", "error", "-y"]
        for x in mine:
            args += ["-i", os.path.join(clips, f"{x['id']}.mp3")]
        # each clip is decoded and delayed to its slot at 1.0x (no speed change, no trimming, no gain change)
        chains = [f"[{i}:a]aresample={SR},adelay={int(round(x['offsetSec'] * 1000))}:all=1[a{i}]" for i, x in enumerate(mine)]
        mix = "".join(f"[a{i}]" for i in range(len(mine)))
        fc = ";".join(chains) + f";{mix}amix=inputs={len(mine)}:normalize=0:dropout_transition=0,apad=whole_dur={total:.3f}[out]"
        dst = os.path.join(out, f"{spk}.wav")
        subprocess.run(args + ["-filter_complex", fc, "-map", "[out]", "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", dst], check=True)
        print(f"  track {os.path.relpath(dst, ROOT)}  {duration(dst):.2f}s  ({len(mine)} line(s))")
    json.dump({"durationSec": round(total, 3), "lines": timeline}, open(os.path.join(out, "timeline.json"), "w"), indent=1)
    finish(slug, cfg, words)


def align(slug):
    """Drop-in path: align user-supplied full-length speaker tracks."""
    cfg = load(slug)
    out, words = vdir(slug), []
    for spk in cfg["speakers"]:
        track = next((os.path.join(out, f"{spk}{e}") for e in (".wav", ".mp3", ".m4a") if os.path.exists(os.path.join(out, f"{spk}{e}"))), None)
        if not track:
            sys.exit(f"missing public/voice/{slug}/{spk}.wav (or .mp3)")
        mine = [ln for ln in cfg["lines"] if ln["speaker"] == spk]
        text = " ".join(ln["text"] for ln in mine)
        boundary = uuid.uuid4().hex
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="text"\r\n\r\n{text}\r\n'
                f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{os.path.basename(track)}"\r\n'
                f'Content-Type: application/octet-stream\r\n\r\n').encode() + open(track, "rb").read() + f"\r\n--{boundary}--\r\n".encode()
        res = request(f"{API}/forced-alignment", body, f"multipart/form-data; boundary={boundary}", timeout=300)
        ws = [w for w in res["words"] if w["text"].strip()]
        k = 0
        for ln in mine:  # forced alignment returns this speaker's words in order: split them back into lines
            n = len(ln["text"].split())
            for w in ws[k:k + n]:
                words.append({"text": w["text"], "start": w["start"], "end": w["end"], "line": ln["id"]})
            k += n
        print(f"  {spk}: aligned {len(ws)} words on {os.path.relpath(track, ROOT)}")
    order = {ln["id"]: i for i, ln in enumerate(cfg["lines"])}
    words.sort(key=lambda w: (order[w["line"]], w["start"]))
    finish(slug, cfg, words)


def finish(slug, cfg, words):
    out = vdir(slug)
    json.dump({"words": words}, open(os.path.join(out, "alignment.json"), "w"), indent=0)
    tracks = []
    for spk in cfg["speakers"]:
        f = next((f"{spk}{e}" for e in (".wav", ".mp3", ".m4a") if os.path.exists(os.path.join(out, f"{spk}{e}"))), None)
        if f:
            tracks.append(f"voice/{slug}/{f}")
    props = {"voiceAudio": None, "voiceTracks": tracks, "alignment": f"voice/{slug}/alignment.json"}
    json.dump(props, open(os.path.join(out, "props.json"), "w"), indent=1)
    print(f"  alignment: {len(words)} words · props: public/voice/{slug}/props.json")


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("tts", "align"):
        sys.exit(__doc__)
    tts(sys.argv[2], "--force" in sys.argv) if sys.argv[1] == "tts" else align(sys.argv[2])
