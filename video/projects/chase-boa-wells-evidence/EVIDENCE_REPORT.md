# Evidence report — "3 Banks I'd Think Twice About" (composition `BankEvidence`)

Voiceover: `ElevenLabs_2026-11-03T21_45_35_Stack_voice__gen_sp100_s50_sb75_v4.mp3` (45.6 s, byte-identical copy).
Sources captured: **Nov 3, 2026** with a headless browser via Firecrawl (live fetch, `maxAge: 0`). The originals are in `video/public/motion/chase-boa-wells-evidence/raw/`. The on-screen crops in `assets/` are **ffmpeg crops only**: no pixel edits, no recreated text. Highlights are overlays drawn on top of the crops.

Timestamps are video time (the narration starts at 0.0 s). Evidence stays on screen until the next beat.

| # | Narration claim | What's shown on screen | Source (direct URL) | Supports it? | On screen |
|---|---|---|---|---|---|
| 1 | "Their Total Checking account can charge $15 a month" | Chase.com section headed **"$15 or $0 Monthly Service Fee"**, highlighted on "$15". Tag: CURRENT · CHECKED NOV 2026 | https://www.chase.com/personal/checking/total-checking | Yes. The page says the fee is $15 unless one of the waiver options is met | 6.4 s → 11.0 s (highlight at 8.0 s) |
| 2 | "…unless you meet certain criteria" | The same section's four ways to avoid the fee ($500+ qualifying electronic deposits / $1,500+ daily balance / $5,000+ average balance / linked qualifying account), highlighted. Pill: "FEE CAN BE WAIVED" | same | Yes | 9.5 s → 11.0 s |
| 3 | "That's $180 a year if you can't avoid the fee" | Chase footnote 1: "…Otherwise a $15 Monthly Service Fee will apply." (highlighted). Then the animated **$15 × 12 = $180/yr**, labelled "POTENTIAL COST, if charged all 12 months" and "Not everyone pays it" | same (footnote 1) | Yes. $180 is our arithmetic (15 × 12), shown as the maximum if the fee is charged every month | 11.3 s → 16.3 s ($180 lands at 11.5 s) |
| 4 | "In 2023, regulators took action against them…" | 2023 → CFPB ACTION timeline, then the CFPB release (CFPB logo, headline, **JUL 11, 2023**). Tag: HISTORICAL · JUL 2023 | https://www.consumerfinance.gov/archive/newsroom/bank-of-america-for-illegally-charging-junk-fees-withholding-credit-card-rewards-opening-fake-accounts/ | Yes. "Today, the Consumer Financial Protection Bureau (CFPB) ordered Bank of America to pay…" | 18.9 s (timeline), 20.7 s → 24.5 s (screenshot) |
| 5 | "…over improper fees" | Headline highlight: "Illegally Charging **Junk Fees**" | same | Yes. The CFPB release covers repeat $35 non-sufficient-funds fees ("double-dipping"); the OCC also found that practice illegal | 22.4 s |
| 6 | "…and unauthorized accounts" | Headline highlight: "**Opening Fake Accounts**" | same | Yes. "Bank of America employees illegally applied for and enrolled consumers in credit card accounts without consumers' knowledge or authorization" | 23.1 s |
| 7 | "They had employees opening accounts without customers' permission" | Logo + **"2016 — Unauthorized Accounts Scandal"**, account-opening animation, then the CFPB release (CFPB logo, headline, **SEP 08, 2016**) with "Secretly Opening Unauthorized Accounts" highlighted. Tag: HISTORICAL · SEP 2016 | https://www.consumerfinance.gov/archive/newsroom/consumer-financial-protection-bureau-fines-wells-fargo-100-million-widespread-illegal-practice-secretly-opening-unauthorized-accounts/ | Yes. "employees boosted sales figures by covertly opening accounts… without their knowledge or consent" | 28.4 s (title), 29.6 s → 35.0 s (screenshot; highlights at 30.4 s and 31.1 s) |
| 8 | Logos | Chase, Bank of America and Wells Fargo logos cropped from each bank's own homepage header (chase.com, bankofamerica.com, wellsfargo.com), captured Nov 3, 2026 | official sites | n/a | 5.4 s, 17.5 s, 28.4 s, 38.9 s |

Opinions stay framed as opinions ("I'd think twice", "a pretty big red flag for me", "not bad for everybody"). The end recap labels Chase as **FEE · CURRENT**, while Bank of America and Wells Fargo are **CFPB · 2023** and **CFPB · 2016**, so the historical actions don't read as present-day practice.

## Flags / caveats
- **The CFPB pages are now in the CFPB "Newsroom Archive".** Each page shows the agency's own banner: "This is archived content… may be outdated." I kept that banner in the screenshots. The URL path is `/archive/newsroom/…`.
- **The Chase fee is shown as "$15 or $0".** That's the page's own wording. The exact phrase "$15 Monthly Service Fee" appears in footnote 1, which is the line shown in the calculation scene. Chase also states that new accounts aren't charged for at least the first two statement periods. The video doesn't claim otherwise, but $180 is a ceiling, not a typical cost.
- **Wells Fargo:** the 2016 order covers conduct from 2011 onward. The CFPB release says these accounts "may not have been authorized", based on the bank's own analysis. The video doesn't show the "2 million" figure because the narration doesn't mention it.
- **Narration transcript:** no ElevenLabs key or Whisper model was reachable, so I transcribed offline (PocketSphinx) and force-aligned. All 123 words matched. A few words were acoustically ambiguous: "criteria" (vs "requirements"), "can't" (vs "can"), "pretty big", and "What" (vs "Which"). These only change caption text. Please read the captions once.
- **Screenshot-capture caveat:** Firecrawl's browser rendered the pages; I didn't take the screenshots in a personal browser session. For a belt-and-braces archive, you can save your own screenshots of the three URLs above.

## Files
- Raw captures: `video/public/motion/chase-boa-wells-evidence/raw/{chase_total_checking_full,cfpb_boa_2023_full,cfpb_wf_2016_full,boa_home,wf_home}.png`
- Crops used: `video/public/motion/chase-boa-wells-evidence/assets/*.png`
- Provenance in code: `video/src/videos/chase-boa-wells-evidence/{facts.ts,assets.ts}`

---

# v04 update (current cut) — `chase-boa-wells-evidence_v04_final-voice.mp4`, 36.35 s

Narration is the **same ElevenLabs take**, tightened by `projects/chase-boa-wells-evidence/edit_voice.py` into `public/voice/chase-boa-wells-evidence/voice_v3.wav`. The script keeps whole spoken clauses only, cuts in silence, and never splices new sentences together. The original `voice.mp3` is untouched. Captions are aligned word by word (87/87 matched).

**Removed lines:** "These are three banks I'd personally think twice about trusting with my money.", "I'd rather keep that money.", "When it comes to my money, trust matters.", "That's a pretty big red flag for me." and the word "Like,". The cold open reuses Gio's own Chase clause "$180 a year if you can't avoid the fee." (the word "That's" is cut). The requested line "One of these banks could cost you $180 a year in checking fees" is **on screen**, not spoken, because it isn't in the recording.

| Claim | Evidence on screen | Source | On screen (v04) |
|---|---|---|---|
| $180/yr potential checking fee (hook) | "$180/yr", "= $15/MONTH × 12", tag "POTENTIAL · IF NOT WAIVED" | Chase footnote 1 ($15) × 12 | 0.0 s → 3.4 s |
| Chase charges $15/month | Chase.com's own heading "$15 or $0 Monthly Service Fee" (highlighted) | https://www.chase.com/personal/checking/total-checking | 5.4 s (highlight 6.9 s) |
| $15 × 12 = $180 | "$15 × 12 = $180", labelled "per year, only if charged every month" | arithmetic | 6.9 s → 8.0 s |
| The fee can be avoided | "You can avoid the fee by doing ONE of the following…" (highlighted) + "$0 FEE IF YOU QUALIFY · e.g. $500+ in qualifying electronic deposits" | same page | 8.5 s → 11 s |
| 2023 CFPB action against BofA | 2023 → CFPB ACTION timeline; CFPB logo + headline + JUL 11, 2023; HISTORICAL · 2023 | https://www.consumerfinance.gov/archive/newsroom/bank-of-america-for-illegally-charging-junk-fees-withholding-credit-card-rewards-opening-fake-accounts/ | 12.6 s / 14.3 s |
| Improper fees | "Illegally Charging Junk Fees" highlighted; plain-language line "Repeat $35 fees on declined charges" | same: "charging customers $35 after the bank declined a transaction… repeatedly charged for the same transaction" | 16.1 s |
| Unauthorized accounts | "Opening Fake Accounts" highlighted; plain-language line "Credit cards opened without consent" | same: "enrolled consumers in credit card accounts without consumers' knowledge or authorization" | 16.7 s |
| Wells Fargo unauthorized-accounts scandal | "2016 — Unauthorized Accounts Scandal", HISTORICAL · 2016; CFPB logo + headline + SEP 08, 2016; "Secretly Opening Unauthorized Accounts" highlighted; "A 2016 case — not a claim about today." | https://www.consumerfinance.gov/archive/newsroom/consumer-financial-protection-bureau-fines-wells-fargo-100-million-widespread-illegal-practice-secretly-opening-unauthorized-accounts/ | 19.2 s → 23.8 s |
| Final question | "What bank would you never use again?" | — | 32.1 s → 36.35 s (about 4.2 s on screen) |
