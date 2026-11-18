# Automated QC — DMM-005 — DMM-005_v06.mp4

Objective measurements only. They do not judge creativity, retention or taste.

| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -17.0 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -4.3 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -16.7 dBFS RMS vs everything else -56.0 dBFS → 39.4 dB below (min 20) |
| audio | SFX peak | PASS | -32.9 dBFS (max -24) |
| audio | no background music | PASS | 59 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-21.5 1s:-16.6 2s:-17.6 3s:-15.6 4s:-15.7 5s:-15.7 6s:-16.2 7s:-17.2 8s:-15.3 9s:-17.6 10s:-39.5 11s:-51.8 12s:-61.7 13s:-240.0 14s:-240.0 |
| speech | intelligibility (STT) | PASS | 35/35 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.072 s over 39 aligned words |
| speech | STT audio events | PASS | ['[chime]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 30 distinct words OK |
| picture | frame 0 not blank | PASS | 0.87% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.41 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.2 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.697, 'DMM-002': 0.749, 'DMM-003': 0.729, 'DMM-004': 0.76} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**
