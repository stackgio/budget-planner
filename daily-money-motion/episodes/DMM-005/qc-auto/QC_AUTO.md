# Automated QC — DMM-005 — DMM-005_v03.mp4

Objective measurements only. They do not judge creativity, retention or taste.

| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -17.7 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -5.2 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.3 dBFS RMS vs everything else -55.6 dBFS → 38.3 dB below (min 20) |
| audio | SFX peak | PASS | -33.1 dBFS (max -24) |
| audio | no background music | PASS | 70 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-17.7 1s:-15.5 2s:-17.4 3s:-17.3 4s:-18.2 5s:-15.4 6s:-21.0 7s:-17.1 8s:-35.5 9s:-51.0 10s:-240.0 11s:-49.6 12s:-92.6 13s:-240.0 14s:-240.0 |
| speech | intelligibility (STT) | PASS | 31/31 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.078 s |
| speech | STT audio events | PASS | none |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 27 distinct words OK |
| picture | frame 0 not blank | PASS | 3.13% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.80 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.7 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.707, 'DMM-002': 0.789, 'DMM-003': 0.789, 'DMM-004': 0.815} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**
