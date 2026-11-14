# Automated QC — DMM-003 — DRYRUN-2026-11-14_v01.mp4

Objective measurements only. They do not judge creativity, retention or taste.

| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -17.7 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -5.1 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9998, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.4 dBFS RMS vs everything else -51.0 dBFS → 33.7 dB below (min 20) |
| audio | SFX peak | PASS | -33.3 dBFS (max -24) |
| audio | no background music | PASS | 57 SFX-silent 100 ms windows; 1 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-16.4 1s:-17.5 2s:-19.4 3s:-17.0 4s:-17.2 5s:-18.7 6s:-15.8 7s:-17.6 8s:-18.4 9s:-18.0 10s:-77.6 11s:-240.0 12s:-240.0 13s:-48.2 14s:-49.2 |
| speech | intelligibility (STT) | SKIP | run with --stt (uses a little ElevenLabs STT quota) |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 25 distinct words OK |
| picture | frame 0 not blank | PASS | 1.76% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.44 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 1.2 s (max 1.5); stretches ≥1 s: [(13.8, 14.966666666666667)] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.735, 'DMM-002': 0.826} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**
