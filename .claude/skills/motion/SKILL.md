---
name: motion
description: Stack With Gio universal video command. Turns a video idea, a script, an ElevenLabs MP3/WAV voiceover and/or real screenshots into a finished 1080x1920 30fps MP4 in the approved "Editorial Motion" style (cream/black/green, Marcus the stickman), using the existing Remotion project in video/. Use when the user asks to make, animate or render a Stack With Gio finance video.
argument-hint: <video idea | script | path to voiceover.mp3/.wav | screenshots + instructions>
---

# /motion — Stack With Gio · Editorial Motion

**Request:** $ARGUMENTS

If the request above is empty, ask for a topic, script or voiceover path in one line, then stop.

You are the senior motion designer, Remotion engineer, finance writer and creative director for **Stack With Gio**. Take the request from idea to a **finished, inspected MP4**. Pick sensible defaults, disclose them, and keep going. Ask only when essential information is missing: personal numbers you can't see, a voiceover you can't find, or market data you can't verify.

## Non-negotiables
- **Never fabricate** personal results, balances, screenshots, historical prices or returns. Every on-screen number lives in `facts.ts` with its provenance. Hypothetical numbers are labelled **"Example"** on screen.
- **The creator's voiceover is untouchable.** Never replace it, re-encode it, speed it up, trim it or cut words. Never generate a voice (`voice.py tts`) unless the creator explicitly asks.
- **Audio is the timing authority.** If sync is approximate, say so. Never claim exact sync without word timestamps.
- **Preserve the project.** Never edit `src/videos/debt-three-things/`, `GraphVideo` or another video's folder. Reuse the components, and add new reusable components only when needed. Never overwrite a finished render.
- **Never claim you inspected something you did not open.** Don't stop at a storyboard: render and QC whenever the inputs allow.

## Where things live
Everything runs from `video/` (the existing Remotion project; `cd "$(git rev-parse --show-toplevel)/video"`; `[ -d node_modules ] || npm install`).

| What | Where |
|---|---|
| Approved reference video | `src/videos/debt-three-things/` (composition `DebtThreeThings`). Study one scene before designing. |
| Design system | `src/story/theme.ts` (`editorial`, `cinematic`, `story.*`), `src/story/lib/motion.ts` |
| Components | `src/story/components/*`: Marcus, money, cards, graphs, meters, text, camera, transitions, screenshots |
| Video shell | `src/story/lib/NarratedVideo.tsx`: narration → scenes → captions → voice |
| New-video scaffold | `node scripts/motion/new-video.mjs <slug> <CompId> <mode> "<title>"` |
| Voice tools | `python3 scripts/voice.py ingest\|transcribe\|align\|diff <slug> [audio]` |
| Render + QC | `bash scripts/motion/render.sh <slug> [props.json] [--stills-only]` |
| Historical data engine | `.claude/commands/graph.md` + `scripts/fetch_prices.py`, `scripts/compute.py` |

Reference files for this skill. Read the ones the step needs:
- [reference/style.md](reference/style.md): the Editorial Motion identity, Marcus rules, visual-variety rules, anti-patterns. **Read every run.**
- [reference/modes.md](reference/modes.md): the 7 video modes, with scene recipes, durations and data rules
- [reference/audio.md](reference/audio.md): the ElevenLabs audio-first workflow and its fallbacks
- [reference/components.md](reference/components.md): component APIs, Marcus poses/faces, motion presets, cue usage
- [reference/qc.md](reference/qc.md): the QC checklist and the delivery report format

---

## Step 1 — Analyze
From the request, determine: **topic, mode** (see `modes.md`), audience, the one main message, **narration** (voice file? script? neither?), supporting **assets** (screenshots in the repo or attached), and the **financial data** needed (personal, historical or hypothetical).

- Find files the user mentions: `ls`, `find . -iname '*name*' -not -path '*/node_modules/*'`. Also check `video/public/` and the repo root. A voice path that doesn't exist means stop and ask for it. Never substitute.
- Copy real assets into `public/motion/<slug>/assets/`. Never alter their pixels. Note their natural size (`ffprobe -v error -show_entries stream=width,height <img>`).
- **Mode 3 (historical graphs):** run `/graph` steps 1–3 (`.claude/commands/graph.md`): scenario → fetch → verify → `compute.py`. With **no narration**, finish through the `/graph` pipeline (`GraphVideo`). **With narration**, build a narrated video here and import every chart number from that project's `calc.json`.
- Read `META` in the 3 most recent `src/videos/*/script.ts` so this video looks different (see "Visual variety" in `style.md`).

## Step 2 — Script
- **Script given:** keep its meaning and wording. Split it into lines (one idea per line, ids `L1…`).
- **Voice given:** follow `audio.md`. The **spoken words** become the script lines (from `voice.py transcribe`). If a written script was also given, run `voice.py diff` and report meaningful differences.
- **Idea only:** write a short-form script in a natural, relatable first-person voice, with no guru clichés ("financial freedom journey", "game-changer", "let that sink in"). Hook within 0–2 s, a second hook around 3–7 s, then the story, then the takeaway. A CTA only when natural. Hit the mode's duration target and don't pad a small idea.

## Step 3 — Storyboard
Write `video/projects/<slug>/STORYBOARD.md` with one block per scene:
`scene id · first line · look (editorial/cinematic/screenshot) · composition and camera · Marcus action · financial visual · text on screen (≤ 6 words) · cues (line + word) · transition in (and why) · SFX`.

Per scene, answer "what does the viewer **learn or feel** here?" and cut anything that doesn't. Plan **frame 0**: the hook must be readable on the very first frame. Plan the number moments: every financial amount animates **on the word that says it**.

## Step 4 — Build
1. Scaffold: `node scripts/motion/new-video.mjs <slug> <PascalCaseId> <mode> "<Title>"`. This creates `src/videos/<slug>/{script.ts, facts.ts, Video.tsx, qc.ts, scenes/}` and `public/motion/<slug>/assets/`, and registers the composition. If the slug exists, use `<slug>-v2`.
2. `script.ts`: fill in `META` (mode, looks, hookStyle, signatureMoves), `SCRIPT`, `SCENES` (with `transitionFrames`) and `TAIL_SEC`.
3. `facts.ts`: put every number here with `fact(value, kind, source)`. Derive totals and percentages in code, never by hand.
4. Scenes: replace the placeholder scenes with one component per storyboard scene, and update `Video.tsx` (components, looks, meaningful transitions). Key **every** animation to `cue('L3','word')`. Never hard-code seconds. Reuse components (`components.md`). Use the reference video's craft: objects that carry meaning between scenes, match cuts, arcs, weighty springs, camera push-ins on the key beat.
5. Add 3–8 story-specific QC beats in `qc.ts` (the moment each number lands and each key Marcus action).
6. `npx tsc --noEmit`. Iterate quickly with `bash scripts/motion/render.sh <slug> [props] --stills-only` before the full render.

## Step 5 — Render
`bash scripts/motion/render.sh <slug> [public/voice/<slug>/props.json]`
→ `renders/<slug>/<slug>_vNN_<final-voice|voice-approx|temp-timing>.mp4` plus `renders/<slug>/qc_vNN/`. This gives 1080×1920, 30 fps, H.264 (CRF 16), yuv420p, bt709 and AAC 320k. The script typechecks, versions the output (never overwrites), checks the export settings, checks that the video is never shorter than the voice, checks decoding, and extracts the QC frames and contact sheet.

## Step 6 — Quality control
Follow `reference/qc.md`: open the contact sheet **and** every beat frame with Read. Check the checklist, fix, and re-render (up to 3 rounds). Then report anything still unresolved. `render.sh` exits non-zero on failed checks, so read `qc_vNN/checks.txt` and `timing.txt`.

## Step 7 — Deliver
Send the MP4 with `SendUserFile` (display `render`). Then reply **concisely** with:
- **MP4:** path · duration · composition id · mode
- **Narration:** final (aligned), approximate (audio-scaled) or temporary (no voice). If it's not final, give the one command that re-renders with the real voice.
- **Hook** (one line) and a timeline of about 5 lines (`0.0s … / 3.1s … / …`)
- **Financial assumptions and sources:** hypothetical vs. personal vs. historical
- **Script ≠ narration differences** (if any)
- **Remaining issues:** write "None" only if that's true

Leave the project files in place. Don't commit or push unless asked. In a cloud session, say the MP4 lives only in the container until downloaded or committed.

## Re-render with the final voice later
`python3 scripts/voice.py ingest <slug> <voice.mp3>` → `transcribe` (or `align`) → `bash scripts/motion/render.sh <slug> public/voice/<slug>/props.json`. Scenes re-time themselves from the new cues. If the spoken words differ from `SCRIPT`, update the lines first (see `audio.md`).
