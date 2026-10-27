# Stack With Gio — "Your first $100,000" v4 (1080×1920, 27.5 s)

- `stackwithgio_first-100k_v4_1080x1920.mp4`: the finished video (H.264 High, 30 fps, AAC 48 kHz stereo, -0.8 dBFS peak).
  v1–v3 are in git history.
- `voiceover.mp3`: the recorded narration (`voiceover-script.md`). `tighten.py` shortens its long pauses to 0.28 s
  and writes `warp.json` / `warp.js`, so the animation and SFX keep their timings in original-voiceover seconds.
- `index.html`: the whole animation. `renderAt(t)` draws any moment deterministically.
  - Open `index.html?t=12.6` to see a still, or `index.html?play` to watch it play silently in real time.
  - Data, timings and layout constants sit at the top of the script.
- `timing.md`: the measured voiceover map and scene plan (times in original-voiceover seconds).
- `model.py`: the financial model (307 / 196 / 128 / 77 months).
- `sfx.py` → `sfx.wav`: synthesised reveal sounds (no music).
- `render.js`: renders frames in headless Chromium (Playwright) and pipes them to ffmpeg.

Rebuild:

```sh
python3 tighten.py voiceover.mp3 voiceover_tight.wav      # also writes warp.json / warp.js
python3 sfx.py sfx.wav
NODE_PATH=$(npm root -g) node render.js frames silent.mp4
D=27.522   # 28.8 minus warp.json "removed"
ffmpeg -i silent.mp4 -i voiceover_tight.wav -i sfx.wav -filter_complex \
  "[1:a]aresample=48000,volume=6dB[v];[2:a]volume=6dB[s];[v][s]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89:level=false,apad,atrim=0:$D,pan=stereo|c0=c0|c1=c0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart -t $D out.mp4
```

The fonts are Inter and Inter Display, installed locally.
