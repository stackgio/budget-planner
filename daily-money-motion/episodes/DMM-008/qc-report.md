# DMM-008 — quality-control report

**File:** `video/renders/daily/DMM-008/DMM-008_v03.mp4` · sha256 `8c7b6815cbdb6685e427b2f3720636a357dcc20cd9fcf1bc53492f49896de87d`
**Automated QC:** 0 FAIL / 0 WARN (with speech-to-text). **Clarity 9.5.** **Average creative score 9.0.**
**Renders:** v01 → v02 → v03 (3 of max 4), plus 4 still rounds. Only v03 is committed.
**Run:** scheduled firing for 2026-11-26 (production day; rolling 72 h from 2026-11-17).

## Clarity check (CHECKLIST B2)
- **One-sentence message:** two people keep the same $5,000 in savings; the U.S. average rate pays about $20 a year, an example 4% rate pays $200, so check what your savings account pays.
- **Narration only:** 30 words, six short sentences (max 9 words), no jargon ("APY" appears only in the footnote). The comparison is explicit: "Two people … One bank … The other … Same money. Different bank." ✅
- **Sound off:** two people (A, B), each with a bank card ("BANK A / $5,000 SAVED / ?.??%" → "0.39% U.S. AVERAGE*"; "BANK B / $5,000 SAVED / ?.??%" → "4.00% EXAMPLE RATE") and a mailbox. Months 1–12 tick; each bank mails an envelope every month (thin for A, fat for B); B's mailbox fills, A's has a thin strip; "INTEREST PAID $19.50 vs $200.00"; "B GOT $180.50 MORE THIS YEAR". ✅
- **Side by side, labelled, never merged:** the two people, banks, mailboxes and counters are separate and labelled A/B throughout. ✅
- **Every symbol labelled:** bank cards say BANK A/B, the rate and what it pays; the month counter says MONTH n OF 12; the counters say INTEREST PAID. The mailbox itself is not labelled (it is the universal picture of "mail you receive"); the counters below it explain it. ✅
- **Takeaway in words:** "SAME $5,000. DIFFERENT BANK. / CHECK YOUR SAVINGS RATE." ✅

## Accuracy
- **0.39%** verified from the primary source: FDIC, *National Rates and Rate Caps – November 2026* (fdic.gov, last updated Nov 16, 2026), Savings national deposit rate 0.39. Labelled "U.S. AVERAGE*" with the source footnoted.
- **4.00%** is a labelled EXAMPLE (bank card says "EXAMPLE RATE"; footnote says "EXAMPLE · $5,000 kept for one year at 4.00% APY, paid monthly. Rates change and are not guaranteed"). Context only (not shown as fact): Fortune (Nov 24, 2026) listed top high-yield savings rates up to 4.70% APY, Investopedia (Nov 25, 2026) up to 5.00%. 4.00% is deliberately below those.
- **$5,000** is an EXAMPLE balance. All figures come from `facts.ts`: monthly compounding at the APY, one year = balance × APY exactly → $19.50 and $200.00; difference $180.50; "about twenty dollars" asserted in code.
- No return is guaranteed or implied: savings rates are variable and that is stated on screen.

## Automated QC on the final (`qc_episode.py DMM-008 DMM-008_v03.mp4 --stt`)
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

Hard export checks (`render.sh`): 1080×1920 · 30 fps · 450 frames decoded · 15.0 s · H.264 yuv420p · AAC · decode clean · no black frames · no frozen stretch · no clipping. **PASS.**

## Human-judgment scores (1–10)
| Area | Score | Why |
|---|---|---|
| **Clarity** (gate ≥ 9) | **9.5** | Two labelled people/banks/mailboxes side by side; the difference is shown three ways (rate, mailbox fill, counter); takeaway in words |
| Hook | 9.0 | Frame 0: "TWO PEOPLE SAVE THE SAME" + two identical "$5,000 SAVED" banks with a wobbling "?.??%": a question to answer |
| Script and accuracy | 9.5 | FDIC-verified average, labelled example, every number in `facts.ts` |
| Voice clarity and timing | 9.0 | 26/26 words recognised by STT; max sync error 0.072 s; 8.5 s read |
| SFX levels | 9.0 | 40.2 dB under the voice, peak −32.5 dBFS, no music; one soft rustle for all 12 envelopes (no ticks) |
| Captions | 9.0 | One-thought pages, never more than 2 lines |
| Visual quality | 8.5 | Clean and readable; people and mailboxes are simple flat icons |
| Transitions and camera | 8.5 | One setup by design (intro rise + constant slow drift) |
| Layout and safe zones | 9.0 | Auto safe-zone check passes; nothing overlaps (checked at full resolution) |
| Payoff | 9.0 | A full year plays out after the voice; B's mailbox fills; counters land on $19.50 / $200.00; "B GOT $180.50 MORE THIS YEAR" |
| Technical | 9.5 | All checks pass |
| Originality | 9.0 | New metaphor (mailboxes + monthly envelopes) and a new topic (where savings are kept); similarity ≤ 0.778 |
| Likely retention | 8.5 | Voice ends at 8.7 s; the year and the payoff keep moving to 12.6 s, then a slow drift |
| **Average (all 13)** | **9.0** | |

## Corrections made (root cause → fix)
1. **"≈ $19 A YEAR" instead of $20 (still round 1).** Floating point: 5,000 × 0.39% computed as 19.4999… and rounded down. → Rounded with an epsilon; `facts.ts` asserts "about $20".
2. **Frame 0 cropped the left person and pushed bank B toward the right UI band (still round 1).** The intro pull-back used a 1.1× scale. → Replaced with a pure vertical rise (no scale), so nothing nears the edges.
3. **Mailbox flag swung across the open mailbox, over the envelopes (still round 1).** It rotated about the wrong pivot. → The flag now rises straight up beside the box.
4. **Envelope stacks weren't proportional (A looked like ~⅓ of B).** Fixed row heights. → Stack height is proportional to interest (A ≈ 13 px vs B ≈ 132 px over 12 months, ≈ 10×).
5. **Ending had no new information for ~3 s after month 12 (v01 review).** → Added the designed payoff "B GOT $180.50 MORE THIS YEAR", computed in `facts.ts`.
6. **Bank cards half-empty for the first 2.5 s, so the hook was weak (v02 review).** → "?.??%" placeholders that resolve to the rates as they are spoken (v03).
7. **False STT WARN 25/26 (QC-tool bug).** A lone number word ("twenty") wasn't converted to digits while STT wrote "20". → `collapse()` now converts lone number words on both sides; checked offline against DMM-005/006/007/008 transcripts (all full match).

## Remaining concerns / NOT verified
- **Audio measured, not listened to.** STT tagged the chimes as "[notification sound]": they might read as a phone notification. Levels are very low (peak −32.5 dBFS), but the creator should listen.
- **No viral reference adapted.** Instagram play counts for savings-account reels could not be fetched (influencers-club returned HTTP 502 twice); topic demand is an ASSUMPTION based on many recent reels on the same subject found via Firecrawl search (captions only, not watched).
- The 0.39% "U.S. average" is the FDIC national rate (an average across banks); many big banks pay less and some pay more. The 4.00% is an example and can change at any time.
- The month counter shows the month in progress while the INTEREST PAID counters show months completed (e.g. "MONTH 9" with 8 payments): a literal viewer might notice.
- ElevenLabs plan must allow commercial use (open item since DMM-003).
