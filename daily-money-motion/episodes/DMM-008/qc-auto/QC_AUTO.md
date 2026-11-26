# Automated QC — DMM-008 — DMM-008_v03.mp4

Objective measurements only. They do not judge creativity, retention or taste.

| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -17.6 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -4.5 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.2 dBFS RMS vs everything else -57.5 dBFS → 40.2 dB below (min 20) |
| audio | SFX peak | PASS | -32.5 dBFS (max -24) |
| audio | no background music | PASS | 71 SFX-silent 100 ms windows; 1 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-17.8 1s:-16.4 2s:-17.8 3s:-15.6 4s:-16.5 5s:-17.7 6s:-16.9 7s:-19.0 8s:-21.9 9s:-48.2 10s:-54.5 11s:-48.5 12s:-64.3 13s:-240.0 14s:-240.0 |
| speech | intelligibility (STT) | PASS | 26/26 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.072 s over 25 aligned words |
| speech | STT audio events | PASS | ['[notification sound]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 24 distinct words OK |
| picture | frame 0 not blank | PASS | 3.02% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.89 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.2 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.72, 'DMM-002': 0.753, 'DMM-003': 0.758, 'DMM-004': 0.758, 'DMM-005': 0.772, 'DMM-006': 0.773, 'DMM-007': 0.778} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**
