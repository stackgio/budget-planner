# Stack With Gio · Short-form video studio

A reusable Remotion + React + TypeScript + FFmpeg system for vertical finance videos
(1080×1920, 30 fps, H.264/AAC), with the sample video **"$15.52 dividend"** built on it.

```
npm install
npm run dev            # Remotion Studio: preview, scrub, edit props
npm run render DividendMeme dividend-1552   # → out/dividend-1552.mp4 (+ automatic QC)
```

Requires Node 20.19+/22.13+ and FFmpeg/ffprobe on PATH. The Remotion agent skills are installed in
`.claude/skills/`, so Claude Code follows the official Remotion best practices in this repo.

---

## How to make a video (the workflow)

1. **Script + voice.** `npm run new-video -- my-video MyVideo` scaffolds `src/videos/my-video/`.
   Put the script in `script.txt` (one narration line per row). Generate the voice in ElevenLabs.
2. **Align the narration.** Drop the audio into `public/videos/my-video/` and run one of these:
   - `npm run align -- --video my-video --alignment alignment.json`: the ElevenLabs
     `/v1/text-to-speech/{voice}/with-timestamps` response. Exact character timing; if it includes
     `audio_base64`, the MP3 is written for you.
   - `npm run align -- --video my-video --transcript stt.json`: ElevenLabs Speech-to-Text on the
     final audio. Exact word timing; use it after editing the audio.
   - `npm run align -- --video my-video --srt narration.srt`: an SRT export (word times are estimated).

   This writes `src/videos/my-video/narration.json`: the **single timing source** (lines L1…Ln + every word).
3. **Storyboard.** Write `STORYBOARD.md` next to the video: line → visual → style → cue (see the sample).
4. **Build scenes** with cues, never hard-coded frames:
   ```ts
   const c = makeCues(narration, fps);
   c.line('L2').from      // line start frame
   c.word('boom').from    // the frame "boom" is spoken
   ```
   Re-record the voice → re-run align → the whole edit re-times itself.
5. **Preview frames** (layout + safe zones): `npm run preview -- MyVideo:30,90,150,240` →
   `out/checks/MyVideo.jpg`, a contact sheet with the platform UI zones overlaid in red.
6. **Draft:** `npm run render -- MyVideo my-video --draft` (faster, lower quality).
7. **Check:** QC runs automatically. Then run `npm run sync -- out/my-video-draft.mp4 src/videos/my-video/narration.json`
   to compare audio drift against the narration, and watch the draft for spelling, pacing, cropping and privacy.
8. **Final:** `npm run render -- MyVideo my-video` → `out/my-video.mp4`.

### Revising

- **Text, amounts, toggles:** in Studio, select the composition and edit props in the right panel
  (e.g. `amount`, `showCaptions`, `showSafeZones`), or pass `--props '{"amount":15.52,...}'` to render.
- **Timing:** change the narration, re-align, or shift a cue offset (`c.word('boom').from - 2`).
- **Look:** brand tokens live in `src/brand/theme.ts`, easing/springs in `src/lib/motion.ts`.

### Export spec (checked by `scripts/qc.sh`)

1080×1920 · 30 fps · H.264 High, yuv420p, BT.709 TV range · AAC 48 kHz 320 kbps ·
−14 LUFS integrated, ≤ −1 dBTP (two-pass loudnorm, video stream copied) · faststart.
One master serves TikTok, Reels (Instagram and Facebook) and YouTube Shorts.

---

## Architecture

```
src/
  brand/        theme.ts (colors, type, SAFE zones), fonts.ts (bundled Inter, OFL)
  lib/          timing.ts (narration cues), motion.ts (easing, springs, seeded random, shake)
  components/
    Background, Camera, Scene, Captions, KineticText, KineticStory,
    SplitScreen, ScreenshotReveal, HookEnd (HookTitle, EndCard), SafeZoneOverlay
    character/  Stickman (rig, expressions, props) + poses.ts
    finance/    MoneyCounter, Phone (+LockScreen, Notification), CreditCard (+TapToPay),
                Receipt, DollarBills
    data/       GrowthChart, Timeline, ProgressBar
  videos/       one folder per video: script.txt, narration.json, STORYBOARD.md, <Video>.tsx
    _template/  copied by scripts/new-video.sh
  showcase/     one composition per component (Studio → Components) + CharacterSheet
public/
  fonts/ sfx/ samples/ brand/character/ videos/<id>/ (narration audio)
scripts/        align-narration.ts, render.sh, qc.sh, check-sync.ts, preview-frames.ts,
                contact-sheet.sh, new-video.sh, make-sfx.sh, placeholder-narration.py
```

### Component catalog

| Component | Use it for | Key props |
|---|---|---|
| `MoneyCounter` | Odometer money counts; debt payoff with `from > to` | `from, to, startFrame, endFrame, sign, color, easing` |
| `GrowthChart` | Self-drawing line chart with live head value | `series, startFrame, endFrame, source` (**required**), `annotations, log` |
| `Timeline` | Historical milestones, synced per event | `events[{date,label,at}]` |
| `SplitScreen` | A vs B comparisons, with an optional verdict | `a, b, startFrame, winner` |
| `ProgressBar` | Goals and payoff %; pass the counter's `easing` so they agree | `to, startFrame, endFrame, milestones` |
| `CreditCard`, `TapToPay` | Card beats, approved/declined payments | `variant, tiltY` / `tapFrame, amount, result` |
| `Receipt` | Spending stories; circle the total | `items, circleTotalAt` |
| `Phone`, `LockScreen`, `Notification` | Phone-UI hooks (notifications, alerts) | `enterFrame, title, body, highlightFrame` |
| `Stickman` | Gio: poses, expressions, sunglasses, sweat, phone | `keys[{frame,pose,expression,feel}]` |
| `KineticText` / `KineticStory` | Word-synced type; a full kinetic video from narration | `words[{text,at,color}]` / `narration` |
| `Captions` | Voice-synced captions, active word lit | `words, emphasize, y` |
| `ScreenshotReveal` | Real screenshots with **always-on** privacy blur + focus | `privacy[], highlight, focus` |
| `Camera` | Push-ins, pans, dives; per-key easing | `keys[{frame,x,y,zoom,ease}]` |
| `HookTitle`, `EndCard` | Openers and the brand outro | `tag, words` / `startFrame, cta` |
| `Scene` | Timeline block that keeps absolute frames | `name, from, to` |

### Rules baked in

- All motion is frame-driven (`interpolate`, `spring`). No CSS animations, no `Math.random`.
- Key content stays inside `SAFE`; `KineticText` measures text and shrinks to fit.
- Charts require a `source`. Linked numbers (counter + bar) share frames and easing. No invented figures.
- Screenshots: privacy regions are blurred from the first frame, never animated in.
- No music by default; SFX are subtle and optional (`public/sfx`, regenerated by `npm run sfx`).

## Notes for this sample

- **Narration is a placeholder** (Piper TTS, `scripts/placeholder-narration.py`), because no ElevenLabs
  file was supplied. Its line boundaries are exact; word timings inside a line are estimated. Replace
  `public/videos/dividend-1552/narration.*`, re-run `npm run align`, and the edit follows.
- **Character** was built from the written description. Put the reference art in
  `public/brand/character/` and tune the rig (see the README there).
- Offline or locked-down machine? Set `REMOTION_BROWSER_EXECUTABLE` to an existing Chrome Headless Shell.
