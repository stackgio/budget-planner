# Automated QC — DMM-004 — DMM-004_v03.mp4

Objective measurements only. They do not judge creativity, retention or taste.

| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -18.1 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -4.9 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9998, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.5 dBFS RMS vs everything else -56.2 dBFS → 38.7 dB below (min 20) |
| audio | SFX peak | PASS | -28.2 dBFS (max -24) |
| audio | no background music | PASS | 47 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-18.2 1s:-16.1 2s:-20.3 3s:-17.6 4s:-17.1 5s:-17.1 6s:-17.1 7s:-19.5 8s:-45.1 9s:-66.1 10s:-80.5 11s:-62.6 12s:-54.4 13s:-47.1 14s:-56.5 |
| speech | intelligibility (STT) | PASS | 33/33 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.061 s |
| speech | STT audio events | PASS | ['[chime]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 27 distinct words OK |
| picture | frame 0 not blank | PASS | 2.50% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 0.61 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.9 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.727, 'DMM-002': 0.8, 'DMM-003': 0.845} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**
