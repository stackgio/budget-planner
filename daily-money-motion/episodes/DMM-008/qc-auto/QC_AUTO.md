# Automated QC — DMM-008 — DMM-008_v04.mp4

Objective measurements only. They do not judge creativity, retention or taste.

| Category | Check | Status | Detail |
|---|---|---|---|
| export | resolution | PASS | 1080x1920 |
| export | frame rate | PASS | 30/1 |
| export | duration | PASS | 450 frames = 15.00 s |
| export | codec | PASS | h264 yuv420p |
| export | audio stream | PASS | aac |
| audio | integrated loudness | PASS | -18.3 LUFS (target -20..-14) |
| audio | true peak / clipping | PASS | -5.1 dBFS (max -1.0) |
| audio | voice untouched | PASS | correlation 0.9999, gain -0.01 dB vs the ElevenLabs file |
| audio | SFX under voice | PASS | voice -17.7 dBFS RMS vs everything else -57.8 dBFS → 40.1 dB below (min 20) |
| audio | SFX peak | PASS | -31.7 dBFS (max -24) |
| audio | no background music | PASS | 85 SFX-silent 100 ms windows; 0 contain non-voice energy above -55 dBFS |
| audio | per-second level | INFO | 0s:-17.7 1s:-17.6 2s:-21.2 3s:-17.9 4s:-17.0 5s:-16.9 6s:-18.6 7s:-16.8 8s:-18.7 9s:-16.5 10s:-38.8 11s:-54.4 12s:-48.7 13s:-78.2 14s:-240.0 |
| speech | intelligibility (STT) | PASS | 34/34 words recognised in the final mix |
| speech | sync vs plan | PASS | max /error/ 0.093 s over 32 aligned words |
| speech | STT audio events | PASS | ['[ding]'] |
| captions | captions = narration | PASS | caption tokens come from the TTS alignment of the script |
| captions | spelling | PASS | 31 distinct words OK |
| hook | spoken hook (first sentence) | PASS | "Your savings could be earning ten times more." (8 words; max 10) |
| hook | spoken CTA (last sentence) | PASS | "Check your savings rate, and follow for more." → ['follow'] |
| hook | on-screen CTA declared | PASS | FOLLOW STACK WITH GIO · COMMENT YOUR SAVINGS RATE BELOW |
| picture | frame 0 not blank | PASS | 5.68% bright (text) pixels on frame 0 |
| picture | motion in first 2 s | PASS | mean motion 1.08 (min 0.4; calibrated: static ≈0.08, active ≥0.3) |
| picture | abrupt jumps | PASS | none |
| picture | static holds | PASS | longest near-static stretch 0.2 s (max 1.5); stretches ≥1 s: [] |
| picture | safe zones (bright content in UI bands) | PASS | no bright content in top/bottom/right UI bands |
| original | visual similarity to past episodes | PASS | {'DMM-001': 0.732, 'DMM-002': 0.746, 'DMM-003': 0.766, 'DMM-004': 0.75, 'DMM-005': 0.762, 'DMM-006': 0.782, 'DMM-007': 0.775} (mean best-match; max 0.85) |

**0 FAIL · 0 WARN**
