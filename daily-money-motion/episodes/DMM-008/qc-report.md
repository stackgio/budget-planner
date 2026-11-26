# DMM-008 — quality-control report

**File:** `video/renders/daily/DMM-008/DMM-008_v04.mp4` · sha256 `014461748047b54f5e30191573e214eb38f8d67a934cca9b4e7be241130aa9b7`
**Automated QC:** 0 FAIL / 0 WARN (with speech-to-text). **Clarity 9.5.** **Average creative score 9.0.**
**Renders:** v01 → v02 → v03 (delivered 2026-11-26 morning) → **v04** (creator update: hook + CTA on every video), 4 of max 4, plus 6 still rounds. Only v04 is committed.
**Run:** scheduled firing for 2026-11-26 (production day; rolling 72 h from 2026-11-17); v04 made the same day on the creator's request: "add a good CTA on every video … and a good hook in the beginning".

## Clarity check (CHECKLIST B2)
- **One-sentence message:** two people keep the same $5,000 in savings; the U.S. average rate pays about $20 a year, an example 4% rate pays $200, so check what your savings account pays.
- **Narration only:** 38 words, five short sentences (max 9 words), no jargon ("APY" appears only in the footnote). The comparison is explicit: "Two people … One bank … The other …". ✅
- **Sound off:** frame 0 "YOUR SAVINGS COULD BE EARNING / 10× MORE?"; then two people (A, B), each with a bank card ("BANK A / $5,000 SAVED / ?.??%" → "0.39% U.S. AVERAGE*"; "BANK B / $5,000 SAVED / ?.??%" → "4.00% EXAMPLE RATE") and a mailbox. Months 1–12 tick; each bank mails an envelope every month (thin for A, fat for B); B's mailbox fills, A's has a thin strip; "INTEREST PAID $19.50 vs $200.00" and "+$180.50 MORE" under B. ✅
- **Side by side, labelled, never merged:** the two people, banks, mailboxes and counters are separate and labelled A/B throughout. ✅
- **Every symbol labelled:** bank cards say BANK A/B, the rate and what it pays; the month counter says MONTH n OF 12; the counters say INTEREST PAID. The mailbox itself is not labelled (it is the universal picture of "mail you receive"); the counters below it explain it. ✅
- **Takeaway in words:** "SAME $5,000. DIFFERENT BANK. / CHECK YOUR SAVINGS RATE." ✅

## Hook and CTA (CHECKLIST B3, new rule)
- **Spoken hook (0–1.9 s, 8 words):** "Your savings could be earning ten times more." On screen from frame 0: "10× MORE?" stamp (pulsing) under the caption, then it lifts away and the scene rises in. "Ten times" = 4.00% ÷ 0.39% = 10.3, asserted in `facts.ts`; "could" + "?" because 4.00% is an example.
- **Spoken CTA (8.2–10.2 s):** "Check your savings rate, and follow for more." On screen from the word "follow" to the last frame: button "+ FOLLOW STACK WITH GIO" (breathing, light sweep) + "COMMENT YOUR SAVINGS RATE BELOW". Replaces the plain signature.
- Automated: spoken hook 8 words (PASS), CTA verb "follow" (PASS), on-screen CTA declared (PASS).

## Accuracy
- **0.39%** verified from the primary source: FDIC, *National Rates and Rate Caps – November 2026* (fdic.gov, last updated Nov 16, 2026), Savings national deposit rate 0.39. Labelled "U.S. AVERAGE*" with the source footnoted.
- **4.00%** is a labelled EXAMPLE (bank card says "EXAMPLE RATE"; footnote says "EXAMPLE · $5,000 kept for one year at 4.00% APY, paid monthly. Rates change and are not guaranteed"). Context only (not shown as fact): Fortune (Nov 24, 2026) listed top high-yield savings rates up to 4.70% APY, Investopedia (Nov 25, 2026) up to 5.00%. 4.00% is deliberately below those.
- **$5,000** is an EXAMPLE balance. All figures come from `facts.ts`: monthly compounding at the APY, one year = balance × APY exactly → $19.50 and $200.00; difference $180.50; "about twenty dollars" and "ten times more" asserted in code.
- No return is guaranteed or implied: savings rates are variable and that is stated on screen.

## Automated QC on the final (`qc_episode.py DMM-008 DMM-008_v04.mp4 --stt`)
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

Hard export checks (`render.sh`): 1080×1920 · 30 fps · 450 frames decoded · 15.0 s · H.264 yuv420p · AAC · decode clean · no black frames · no frozen stretch · no clipping. **PASS.**

## Human-judgment scores (1–10)
| Area | Score | Why |
|---|---|---|
| **Clarity** (gate ≥ 9) | **9.5** | Two labelled people/banks/mailboxes side by side; the difference is shown three ways (rate, mailbox fill, counter); takeaway in words |
| Hook | 9.5 | Spoken "Your savings could be earning ten times more." + a big pulsing "10× MORE?" readable on frame 0 + "?.??%" rate slots |
| CTA | 9.0 | Spoken "…and follow for more" + an animated FOLLOW button and a topic-specific action ("COMMENT YOUR SAVINGS RATE BELOW") to the last frame |
| Script and accuracy | 9.5 | FDIC-verified average, labelled example, every number in `facts.ts` |
| Voice clarity and timing | 9.0 | 34/34 words recognised by STT; max sync error 0.093 s; 10.0 s read |
| SFX levels | 9.0 | 40.1 dB under the voice, peak −31.7 dBFS, no music; one soft rustle for all 12 envelopes |
| Captions | 9.0 | One-thought pages, never more than 2 lines |
| Visual quality | 8.5 | Clean and readable; people and mailboxes are simple flat icons |
| Transitions and camera | 8.5 | One setup by design (hook stamp → scene rise → constant slow drift) |
| Layout and safe zones | 8.5 | Auto safe-zone check passes; the bottom (counters, CTA, footnote) is now tightly packed |
| Payoff | 9.0 | The year plays out; B's mailbox fills; counters land on $19.50 / $200.00; "+$180.50 MORE" |
| Technical | 9.5 | All checks pass |
| Originality | 9.0 | New metaphor (mailboxes + monthly envelopes) and topic; similarity ≤ 0.782 |
| Likely retention | 9.0 | Stronger 2-second hook; voice to 10.2 s, year and payoff to 12.7 s, CTA keeps moving to the end |
| **Average (all 14)** | **9.0** | (126.5 / 14 = 9.04) |

## Corrections made (root cause → fix)
1. **"≈ $19 A YEAR" instead of $20 (still round 1).** Floating point: 5,000 × 0.39% computed as 19.4999… and rounded down. → Rounded with an epsilon; `facts.ts` asserts "about $20".
2. **Frame 0 cropped the left person and pushed bank B toward the right UI band (still round 1).** The intro pull-back used a 1.1× scale. → Replaced with a pure vertical rise (no scale), so nothing nears the edges.
3. **Mailbox flag swung across the open mailbox, over the envelopes (still round 1).** It rotated about the wrong pivot. → The flag now rises straight up beside the box.
4. **Envelope stacks weren't proportional (A looked like ~⅓ of B).** Fixed row heights. → Stack height is proportional to interest (A ≈ 13 px vs B ≈ 132 px over 12 months, ≈ 10×).
5. **Ending had no new information for ~3 s after month 12 (v01 review).** → Added the designed payoff "B GOT $180.50 MORE THIS YEAR", computed in `facts.ts`.
6. **Bank cards half-empty for the first 2.5 s, so the hook was weak (v02 review).** → "?.??%" placeholders that resolve to the rates as they are spoken (v03).
7. **v04 (creator request): hook + CTA.** New narration (same voice; script change, not a mix fix) with a hook first sentence and a spoken CTA; new reusable `HookStamp` and `CTACard` components; the scene waits under the hook stamp, then rises; the payoff moved under B's counter to make room for the CTA; SFX v02 adds one soft tink for the CTA. QC now checks hook length and CTA presence.
8. **False STT WARN 25/26 (QC-tool bug).** A lone number word ("twenty") wasn't converted to digits while STT wrote "20". → `collapse()` now converts lone number words on both sides; checked offline against DMM-005/006/007/008 transcripts (all full match).

## Remaining concerns / NOT verified
- **Audio measured, not listened to.** STT tagged a chime as "[ding]" (v03: "[notification sound]"): it might read as a phone notification. Levels are very low (peak −31.7 dBFS), but the creator should listen.
- The CTA says "FOLLOW STACK WITH GIO" (no @handle, since I don't know the exact handle per platform). Tell me the handle if you want it on the button.
- v04 used the last of the 4 render rounds.
- **No viral reference adapted.** Instagram play counts for savings-account reels could not be fetched (influencers-club returned HTTP 502 twice); topic demand is an ASSUMPTION based on many recent reels on the same subject found via Firecrawl search (captions only, not watched).
- The 0.39% "U.S. average" is the FDIC national rate (an average across banks); many big banks pay less and some pay more. The 4.00% is an example and can change at any time.
- The month counter shows the month in progress while the INTEREST PAID counters show months completed (e.g. "MONTH 9" with 8 payments): a literal viewer might notice.
- ElevenLabs plan must allow commercial use (open item since DMM-003).
