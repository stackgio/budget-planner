# Automated QC — DMM-006 — DMM-006_v02.mp4

Objective measurements only. They do not judge creativity, retention or taste.

| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -18.0 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -4.8 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.5 dBFS RMS vs everything else -57.6 dBFS → 40.2 dB below (min 20) |
| audio | SFX peak | PASS | -33.9 dBFS (max -24) |
| audio | no background music | PASS | 78 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-18.6 1s:-17.4 2s:-17.4 3s:-17.4 4s:-18.9 5s:-17.7 6s:-18.0 7s:-17.2 8s:-14.9 9s:-19.3 10s:-20.5 11s:-53.8 12s:-240.0 13s:-240.0 14s:-240.0 |
| speech | intelligibility (STT) | PASS | 36/36 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.091 s over 37 aligned words |
| speech | STT audio events | PASS | ['[bell dings]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 29 distinct words OK |
| picture | frame 0 not blank | PASS | 19.52% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.58 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.5 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.746, 'DMM-002': 0.805, 'DMM-003': 0.832, 'DMM-004': 0.833, 'DMM-005': 0.76} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**
