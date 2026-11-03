# Audio-first workflow (ElevenLabs voiceover)

The creator's MP3/WAV is the **main narration and the timing authority**. It's copied byte-for-byte and played at 1.0× from `public/voice/<slug>/voice.<ext>`. Never replace, re-encode, speed up, trim, or cut words from it. Never generate a substitute voice.

All commands run from `video/`. Each one writes `public/voice/<slug>/props.json`, which `render.sh` takes as its second argument.

## 1. Locate and ingest
```bash
python3 scripts/voice.py ingest <slug> path/to/voiceover.mp3
```
This validates the file with ffprobe (audio stream, codec, sample rate, channels, duration > 0.3 s), copies it byte-identical (sha256-verified, original extension kept), and writes `audio.json`. It refuses to replace a **different** voice already ingested for that slug unless you pass `--replace`. Only use `--replace` when the creator approved it; the old file is kept as `.prev`.

If the path doesn't exist, search the repo (`find . -iname '*.mp3' -o -iname '*.wav' | grep -v node_modules`). If it's still missing, **ask**. Never continue with a different file.

## 2. Get word timestamps (exact sync)
Prefer, in this order:

| Situation | Command | Result |
|---|---|---|
| Voice only (no script) | `python3 scripts/voice.py transcribe <slug>` | transcript + word timestamps (ElevenLabs Scribe; falls back to local faster-whisper/openai-whisper if installed) |
| Voice + script | `transcribe` **and** `diff` (preferred), or `align` | `transcribe` catches script differences; `align` (ElevenLabs forced alignment) maps your script onto the audio but can't detect differences |
| No API key and no Whisper | ask for the written script, then render audio-scaled | **APPROXIMATE**: timings are estimated and stretched to the real duration |

Notes:
- `ELEVENLABS_API_KEY` must be in the environment. In Claude Code on the web it's set in the environment's settings (secrets/variables); network access to `api.elevenlabs.io` must be allowed. Optional: `pip install faster-whisper` for offline transcription (it downloads a model on first use).
- `transcribe` writes `transcript.json`, `alignment.json` (words) and `script-lines.json`, and prints ready-to-paste `SCRIPT` lines with their times.
- **Script lines must match what is spoken.** Build `SCRIPT` from `script-lines.json` (you may merge or split lines at sentence or clause boundaries to suit scenes, but keep the words as spoken, including how numbers were transcribed, e.g. `$500` vs `five hundred dollars`). `cue('L4','$500')` must use the token exactly as it appears in the line.
- After rendering, `qc_vNN/timing.txt` prints `alignment: matched/total` and every `MISMATCH`. A mismatch means that word's timing fell back to its neighbour, so fix the line text until there are 0 mismatches. That's the condition for calling sync final.

## 3. Script vs. narration
`python3 scripts/voice.py diff <slug>` compares `script.ts` with `transcript.json` and lists every replace, insert and delete. Report meaningful differences to the creator: changed numbers, dropped sentences, a different CTA. Ignore pure punctuation. Never "fix" the audio to match the script; the audio wins.

## 4. Build around the narration
- Scene boundaries = speech boundaries: each scene starts on a line (`SCENES[].firstLine`), and `buildSceneWindows` centres the transition just before that line.
- Number animations start on the word that says the amount: `cue('L4', '$500')`. They should settle by the end of the phrase (`cue('L4', '$500', 0, 'end')`).
- Marcus's actions land on verbs and reactions: `cue('L3', 'car', -0.1)` to start the flinch a hair before the word.
- If the audio runs longer than the last word + `TAIL_SEC`, the last scene extends automatically. The video is never shorter than the voice (`render.sh` fails if it is).
- SFX sit under the voice (volumes 0.25–0.55). Never put an SFX on top of a key spoken number.

## 5. Text-only workflow (no voice yet)
Render with no props. `NarratedVideo` uses **temporary** syllable-weighted timing (about 165 wpm × `tempRate`). The output is named `_temp-timing.mp4` and the report says TEMPORARY. Never present temp timing as synced. When the creator sends the voiceover later:
```bash
python3 scripts/voice.py ingest <slug> voice.mp3 && python3 scripts/voice.py transcribe <slug>
# update SCRIPT lines to the spoken words if `diff` shows changes, then:
bash scripts/motion/render.sh <slug> public/voice/<slug>/props.json
```
Every scene and cue re-times automatically.

## Reporting sync honestly
| narration source | file tag | what to tell the creator |
|---|---|---|
| `aligned` + 0 mismatches | `final-voice` | synced to word timestamps |
| `aligned` with mismatches | `final-voice` | synced, except the listed words (approximate) |
| `audio-scaled` | `voice-approx` | real voice, but timing is estimated; send a key or install Whisper for exact sync |
| `temp` | `temp-timing` | no voice; placeholder timing |
