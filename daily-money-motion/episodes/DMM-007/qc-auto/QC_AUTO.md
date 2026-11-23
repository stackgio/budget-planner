# Automated QC — DMM-007 — DMM-007_v02.mp4

Objective measurements only. They do not judge creativity, retention or taste.

| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -18.1 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -5.0 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.7 dBFS RMS vs everything else -57.8 dBFS → 40.2 dB below (min 20) |
| audio | SFX peak | PASS | -32.2 dBFS (max -24) |
| audio | no background music | PASS | 34 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-15.4 1s:-17.9 2s:-19.5 3s:-17.4 4s:-17.0 5s:-20.0 6s:-17.1 7s:-18.5 8s:-21.7 9s:-48.3 10s:-48.6 11s:-65.7 12s:-72.1 13s:-83.4 14s:-131.5 |
| speech | intelligibility (STT) | PASS | 33/33 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.069 s over 33 aligned words |
| speech | STT audio events | PASS | ['[chime]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 31 distinct words OK |
| picture | frame 0 not blank | PASS | 2.93% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.56 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.0 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.725, 'DMM-002': 0.749, 'DMM-003': 0.796, 'DMM-004': 0.813, 'DMM-005': 0.747, 'DMM-006': 0.803} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**
