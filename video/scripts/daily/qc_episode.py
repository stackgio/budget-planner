#!/usr/bin/env python3
"""Daily Money Motion — automated QC of the ACTUAL exported MP4.

Usage: python3 scripts/daily/qc_episode.py <EPISODE_ID> <mp4> [--stt] [--out DIR]

Reads   daily-money-motion/episodes/<ID>/metadata.json (narration file, offset,
        sfx_track, script) and daily-money-motion/config.json (qc_thresholds).
Writes  <out>/qc_auto.json and <out>/QC_AUTO.md. Exit 1 if any FAIL.

What it measures (objective only — it never scores creativity):
  export   : 1080x1920, 30 fps, exactly 450 decoded frames, h264/yuv420p, audio stream
  audio    : loudness/true peak/clipping; voice untouched in the mix (correlation, gain);
             SFX-to-voice ratio during speech; NO MUSIC (residual = mix - voice must be
             silent wherever the SFX track is silent); SFX peak; per-second levels
  speech   : optional (--stt): ElevenLabs speech-to-text on the final mix -> word match,
             sync error vs the planned word times, and any 'music' audio events.
             Intelligibility only; NOT proof of a good mix.
  captions : caption words == narration words (they are generated from the alignment);
             offline spell check (pyspellchecker) of every caption word
  picture  : frame-0 not blank; motion in the first 2 s; abrupt jumps (frame-diff spikes);
             static holds > max_static_sec; bright content inside platform-UI danger bands
             (top 170 / bottom 330 / right 120 px) on 2 fps samples
  original : perceptual-hash similarity of 1 fps samples vs every previous episode's final render
"""
import json, os, re, subprocess, sys, urllib.request, difflib
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.abspath(os.path.join(HERE, "..", ".."))
ROOT = os.path.abspath(os.path.join(VIDEO, ".."))
DMM = os.path.join(ROOT, "daily-money-motion")
SR = 48000

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 2:
    sys.exit(__doc__)
EP, MP4 = args[0], os.path.abspath(args[1])
STT = "--stt" in sys.argv
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else os.path.join(os.path.dirname(MP4), "qc_auto_" + os.path.splitext(os.path.basename(MP4))[0])
os.makedirs(OUT, exist_ok=True)
CFG = json.load(open(os.path.join(DMM, "config.json")))
TH = CFG["qc_thresholds"]
META = json.load(open(os.path.join(DMM, "episodes", EP, "metadata.json")))
results = []


def rec(cat, name, status, detail, value=None):
    results.append({"category": cat, "check": name, "status": status, "detail": detail, "value": value})


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def P(rel):
    """Resolve a path from metadata (repo-root relative like video/..., or video/ relative)."""
    return os.path.join(ROOT, rel) if rel.startswith("video/") else os.path.join(VIDEO, rel)


def db(x):
    return float(20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12))


def pk(x):
    return float(20 * np.log10(np.max(np.abs(x)) + 1e-12))


# ---------------- export
p = run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,r_frame_rate,nb_read_frames,codec_name,pix_fmt", "-of", "json", MP4])
s = json.loads(p.stdout)["streams"][0]
rec("export", "resolution", "PASS" if (s["width"], s["height"]) == (1080, 1920) else "FAIL", f'{s["width"]}x{s["height"]}')
rec("export", "frame rate", "PASS" if s["r_frame_rate"] == "30/1" else "FAIL", s["r_frame_rate"])
nf = int(s["nb_read_frames"])
rec("export", "duration", "PASS" if nf == 450 else "FAIL", f"{nf} frames = {nf/30:.2f} s", nf)
rec("export", "codec", "PASS" if (s["codec_name"], s["pix_fmt"]) == ("h264", "yuv420p") else "FAIL", f'{s["codec_name"]} {s["pix_fmt"]}')
ac = run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_name", "-of", "csv=p=0", MP4]).stdout.strip()
rec("export", "audio stream", "PASS" if ac else "FAIL", ac or "none")

# ---------------- audio
def pcm(path):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)


mix = pcm(MP4)
eb = run(["ffmpeg", "-nostats", "-i", MP4, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", eb)[-1])
TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", eb)[-1])
rec("audio", "integrated loudness", "PASS" if TH["lufs_min"] <= I <= TH["lufs_max"] else "WARN", f"{I} LUFS (target {TH['lufs_min']}..{TH['lufs_max']})", I)
rec("audio", "true peak / clipping", "PASS" if TP <= TH["true_peak_max"] else "FAIL", f"{TP} dBFS (max {TH['true_peak_max']})", TP)

nar = META["narration"]
voice = pcm(P(nar["file"]))
off = int(nar["offset_sec"] * SR)
vv = np.zeros_like(mix)
n = min(len(voice), len(mix) - off)
vv[off:off + n] = voice[:n]
best = (-1, 0)
seg = slice(0, min(len(mix), SR * 12))
for lag in range(-2400, 2401, 4):
    a = np.roll(vv, lag)[seg]
    c = float(np.dot(a, mix[seg]) / (np.linalg.norm(a) * np.linalg.norm(mix[seg]) + 1e-12))
    if c > best[0]:
        best = (c, lag)
vv = np.roll(vv, best[1])
g = float(np.dot(vv, mix) / (np.dot(vv, vv) + 1e-12))
gdb = 20 * np.log10(max(g, 1e-9))
rec("audio", "voice untouched", "PASS" if best[0] >= TH["voice_corr_min"] and abs(gdb) <= TH["voice_gain_tol_db"] else "FAIL",
    f"correlation {best[0]:.4f}, gain {gdb:+.2f} dB vs the ElevenLabs file", {"corr": best[0], "gain_db": gdb})
res = mix - g * vv
v0 = off / SR + best[1] / SR
v1 = v0 + len(voice) / SR
sp = slice(int((v0 + 0.05) * SR), int((v1 - 0.05) * SR))
ratio = db(g * vv[sp]) - db(res[sp])
rec("audio", "SFX under voice", "PASS" if ratio >= TH["sfx_below_voice_db_min"] else "FAIL",
    f"voice {db(g*vv[sp]):.1f} dBFS RMS vs everything else {db(res[sp]):.1f} dBFS → {ratio:.1f} dB below (min {TH['sfx_below_voice_db_min']})", ratio)
sfx_path = META.get("sfx_track")
if sfx_path:
    sfx = pcm(P(sfx_path))
    sfx = np.pad(sfx, (0, max(0, len(mix) - len(sfx))))[: len(mix)]
    rec("audio", "SFX peak", "PASS" if pk(sfx) <= TH["sfx_peak_max"] else "WARN", f"{pk(sfx):.1f} dBFS (max {TH['sfx_peak_max']})", pk(sfx))
    # no-music: wherever the SFX track is silent (and the voice too), the residual must be ~silent
    win = int(0.1 * SR)
    bad, quiet = 0, 0
    for i in range(0, len(mix) - win, win):
        if pk(sfx[i:i + win]) < -70:
            quiet += 1
            if db(res[i:i + win]) > TH["no_music_residual_max"]:
                bad += 1
    rec("audio", "no background music", "PASS" if quiet and bad / quiet < 0.05 else "FAIL",
        f"{quiet} SFX-silent 100 ms windows; {bad} contain non-voice energy above {TH['no_music_residual_max']} dBFS", {"windows": quiet, "violations": bad})
else:
    rec("audio", "no background music", "WARN", "metadata.json has no sfx_track; can't separate music from SFX")
per_s = [round(db(mix[i * SR:(i + 1) * SR]), 1) for i in range(15)]
rec("audio", "per-second level", "INFO", " ".join(f"{i}s:{v}" for i, v in enumerate(per_s)), per_s)

# ---------------- speech (optional, costs a little ElevenLabs STT usage)
words = json.load(open(os.path.join(os.path.dirname(P(nar["file"])), "words.json")))["words"]
if STT:
    tmp = os.path.join(OUT, "mix.mp3")
    run(["ffmpeg", "-v", "error", "-y", "-i", MP4, "-vn", "-ac", "1", "-c:a", "libmp3lame", "-q:a", "2", tmp])
    bnd = "----qcboundary"
    body = b"".join([
        f'--{bnd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        for k, v in {"model_id": "scribe_v1", "timestamps_granularity": "word", "tag_audio_events": "true"}.items()
    ]) + f'--{bnd}\r\nContent-Disposition: form-data; name="file"; filename="mix.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode() + open(tmp, "rb").read() + f"\r\n--{bnd}--\r\n".encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body, headers={
        "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected"), "Content-Type": f"multipart/form-data; boundary={bnd}"})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=120))
        heard = [w for w in r["words"] if w.get("type") == "word"]
        norm = lambda t: re.sub(r"[^a-z0-9']", "", t.lower())
        a, b = [norm(w["text"]) for w in words], [norm(w["text"]) for w in heard]
        m = sum(x.size for x in difflib.SequenceMatcher(None, a, b).get_matching_blocks())
        rec("speech", "intelligibility (STT)", "PASS" if m == len(a) else "WARN", f"{m}/{len(a)} words recognised in the final mix", m / len(a))
        d = [abs(h["start"] - (w["start"] + nar["offset_sec"])) for w, h in zip(words, heard)] if len(heard) == len(words) else []
        rec("speech", "sync vs plan", ("PASS" if max(d) <= TH["sync_max_sec"] else "WARN") if d else "WARN",
            f"max |error| {max(d):.3f} s" if d else "word counts differ; per-word sync not computed", max(d) if d else None)
        ev = [w["text"] for w in r["words"] if w.get("type") == "audio_event"]
        rec("speech", "STT audio events", "FAIL" if any("music" in e.lower() for e in ev) else "PASS", f"{ev or 'none'}")
    except Exception as e:  # noqa
        rec("speech", "intelligibility (STT)", "WARN", f"STT unavailable: {e}")
else:
    rec("speech", "intelligibility (STT)", "SKIP", "run with --stt (uses a little ElevenLabs STT quota)")

# ---------------- captions
script_words = META["narration"].get("script", " ".join(w["text"] for w in words)).split()
same = [re.sub(r"[^\w']", "", w).lower() for w in script_words] == [re.sub(r"[^\w']", "", w["text"]).lower() for w in words]
rec("captions", "captions = narration", "PASS" if same else "FAIL", "caption tokens come from the TTS alignment of the script" if same else "script and spoken words differ")
try:
    from spellchecker import SpellChecker
    spc = SpellChecker()
    extra = set(w.lower() for w in TH.get("allowed_words", []))
    # Keep the whole contraction first ("doesn't" is in the dictionary, its stem "doesn" is not);
    # a word is unknown only if both the full token and its suffix-stripped stem are unknown.
    strip = lambda t: re.sub(r"('s|'re|'t|'ll|'ve|'d|'m)$", "", t)
    toks = {re.sub(r"[^\w'$%]", "", w).lower().strip("'") for w in script_words}
    toks = {t for t in toks if t and not re.match(r"^[$\d%,.]+$", t) and t not in extra and strip(t) not in extra}
    unk = sorted(t for t in toks if spc.unknown([t]) and spc.unknown([strip(t)]))
    rec("captions", "spelling", "PASS" if not unk else "FAIL", f"unknown: {unk}" if unk else f"{len(toks)} distinct words OK")
except ImportError:
    rec("captions", "spelling", "WARN", "pyspellchecker not installed: pip install pyspellchecker")

# ---------------- picture
W, H = 270, 480
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
f0 = fr[0]
rec("picture", "frame 0 not blank", "PASS" if (f0 > 140).mean() > 0.004 else "FAIL", f"{(f0 > 140).mean()*100:.2f}% bright (text) pixels on frame 0")
diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
# grain-robust motion signal: area-downscale to 54x96 so film grain averages out
raws = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-vf", "scale=54:96:flags=area,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
frs = np.frombuffer(raws, np.uint8).reshape(-1, 96, 54).astype(np.float32)
mot = np.abs(np.diff(frs, axis=0)).mean(axis=(1, 2))
m2 = float(mot[:60].mean())
rec("picture", "motion in first 2 s", "PASS" if m2 >= TH["hook_motion_min"] else "WARN", f"mean motion {m2:.2f} (min {TH['hook_motion_min']}; calibrated: static ≈0.08, active ≥0.3)", m2)
jumps = []
for i in range(2, len(diff) - 2):
    loc = np.median(np.r_[diff[max(0, i - 8):i - 1], diff[i + 2:i + 9]])
    if diff[i] > 10 and diff[i] > 6 * (loc + 0.2):
        jumps.append(i + 1)
rec("picture", "abrupt jumps", "PASS" if not jumps else "WARN", f"frames {jumps} (check each is an intended cut)" if jumps else "none", jumps)
mot_s = np.convolve(mot, np.ones(15) / 15, mode="same")  # 0.5 s smoothing (grain alternates frame to frame)
still = mot_s < TH["static_diff"]
runs, cur = [], 0
for i, sflag in enumerate(still):
    cur = cur + 1 if sflag else 0
    if cur and (i == len(still) - 1 or not still[i + 1]):
        runs.append((i - cur + 2, i + 1))
longest = max([(b - a + 1) / 30 for a, b in runs], default=0)
rec("picture", "static holds", "PASS" if longest <= TH["max_static_sec"] else "WARN",
    f"longest near-static stretch {longest:.1f} s (max {TH['max_static_sec']}); stretches ≥1 s: {[(a/30, b/30) for a, b in runs if (b-a+1) >= 30]}", longest)
# danger bands (platform UI) on 2 fps full-res samples
raw2 = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-vf", "fps=2,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
fs = np.frombuffer(raw2, np.uint8).reshape(-1, 1920, 1080)
sf = CFG.get("safe", {"top": 170, "bottom": 330, "right": 120})
hits = []
for k, im in enumerate(fs):
    bands = {"top": im[:sf["top"] - 10], "bottom": im[1920 - sf["bottom"] + 10:], "right": im[sf["top"]:1920 - sf["bottom"], 1080 - sf["right"] + 10:]}
    for name, b in bands.items():
        frac = float((b > 150).mean())
        if frac > 0.002:
            hits.append((k / 2, name, round(frac * 100, 2)))
rec("picture", "safe zones (bright content in UI bands)", "PASS" if not hits else "FAIL", f"{hits[:12]}" if hits else "no bright content in top/bottom/right UI bands", hits)

# ---------------- originality vs previous episodes (perceptual hash at 1 fps)
def dhash(img):
    h, w = img.shape
    ys = np.linspace(0, h, 17).astype(int); xs = np.linspace(0, w, 18).astype(int)
    g = np.array([[img[ys[i]:ys[i+1], xs[j]:xs[j+1]].mean() for j in range(17)] for i in range(16)])
    return (g[:, 1:] > g[:, :-1]).flatten()


def hashes(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", "fps=1,scale=136:240,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    imgs = np.frombuffer(raw, np.uint8).reshape(-1, 240, 136).astype(np.float32)
    return [dhash(i) for i in imgs]


log = json.load(open(os.path.join(DMM, "production-log.json")))
mine = hashes(MP4)
sims = {}
for e in log["episodes"]:
    if e["id"] == EP or not e.get("final_render"):
        continue
    pth = os.path.join(ROOT, e["final_render"])
    if not os.path.exists(pth):
        continue
    other = hashes(pth)
    best = [max(1 - np.mean(a != b) for b in other) for a in mine]
    sims[e["id"]] = round(float(np.mean(best)), 3)
worst = max(sims.values(), default=0)
rec("original", "visual similarity to past episodes", "PASS" if worst < TH["max_visual_similarity"] else "WARN", f"{sims} (mean best-match; max {TH['max_visual_similarity']})", sims)

# ---------------- report
fails = [r for r in results if r["status"] == "FAIL"]
warns = [r for r in results if r["status"] == "WARN"]
json.dump({"episode": EP, "file": MP4, "results": results, "fails": len(fails), "warns": len(warns)}, open(os.path.join(OUT, "qc_auto.json"), "w"), indent=1, default=float)
with open(os.path.join(OUT, "QC_AUTO.md"), "w") as f:
    f.write(f"# Automated QC — {EP} — {os.path.basename(MP4)}\n\nObjective measurements only. They do not judge creativity, retention or taste.\n\n| Category | Check | Status | Detail |\n|---|---|---|---|\n")
    for r in results:
        f.write(f"| {r['category']} | {r['check']} | {r['status']} | {str(r['detail']).replace('|', '/')} |\n")
    f.write(f"\n**{len(fails)} FAIL · {len(warns)} WARN**\n")
for r in results:
    print(f"{r['status']:5} {r['category']:9} {r['check']}: {r['detail']}")
print(f"\n{len(fails)} FAIL, {len(warns)} WARN → {OUT}/QC_AUTO.md")
sys.exit(1 if fails else 0)
