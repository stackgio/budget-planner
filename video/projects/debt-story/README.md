# Debt story — "Everything breaks" (Stack With Gio)

A 41 s, 1080×1920, 30 fps character-animated short, narrated by the supplied ElevenLabs voiceover.

| What | Where |
|---|---|
| Final video | `projects/debt-story/stack-with-gio-debt-story.mp4` |
| Storyboard + measured narration timing | `projects/debt-story/STORYBOARD.md` |
| Composition | `src/debt-story/DebtStory.tsx` (id `DebtStory`) |
| Timing anchors (one place to retime) | `src/debt-story/timing.ts` |
| Marcus rig (poses, expressions, walk cycle) | `src/debt-story/Marcus.tsx`; preview every pose in the `MarcusSheet` composition |
| Captions | `src/debt-story/Caption.tsx` (cues live in `DebtStory.tsx`) |
| Scenes | `src/debt-story/scenes/S01…S11` |
| Props (car, paper, cards, icons) | `src/debt-story/props/` |
| Narration + SFX | `public/debt-story/` (SFX made by `scripts/debt-story-sfx.sh`) |

## Commands

```bash
npm ci
bash scripts/debt-story-sfx.sh                       # rebuild SFX (optional; committed)
npx remotion studio src/index.ts                     # preview: pick DebtStory
npx remotion render src/index.ts DebtStory projects/debt-story/out.mp4 \
  --codec=h264 --crf=17 --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=192k
bash scripts/debt-story-qc.sh                        # probe, audio peaks, contact sheet
node scripts/debt-story-stills.mjs /tmp/stills 0 300 900   # any frames as PNG
```

If Remotion cannot fetch its own browser, pass `--browser-executable` (or set
`REMOTION_BROWSER_EXECUTABLE` for the stills script).

## Retiming to a new voiceover

1. Measure the pauses: `ffmpeg -i vo.mp3 -af silencedetect=noise=-32dB:d=0.07 -f null -`
2. Update the anchors in `timing.ts`. Scenes, captions and SFX all read from these anchors.
3. Set `TOTAL_FRAMES` to the narration length plus about 0.4 s, and adjust the `SCENES` windows.
