# STACK WITH GIO — EDITORIAL MOTION (visual identity)

Source of truth: `video/src/videos/debt-three-things/` (the approved "3 Things I Wish I Knew Before Paying Off Debt" test, composition `DebtThreeThings`) and `video/src/story/theme.ts`. Its rendered MP4 (`debt-three-things.mp4`) was never committed, so when in doubt, render a still: `node scripts/stills.mjs DebtThreeThings /tmp/ref hook=40 extra=700 stay=1000 --scale=0.4` and open it. **Don't redesign the style. Extend it.**

## Palette (`src/story/theme.ts`)
| Look | Background | Ink | Accent | Use for |
|---|---|---|---|---|
| `editorial` | warm cream `#F5F0E6` paper with grain (`EditorialBg`) | `#121316` | green `#1E9E57` | explaining, lists, decisions, endings |
| `cinematic` | matte black `#0B0C0E`, lamp/key light, vignette (`CinematicBg`) | `#F5F2EA` | green `#2CD47A` | effort, drama, late-night grind, data and charts |
| white/off-white | `#FFFFFF` / `#FAFAF7` (`theme.ts`) | `#0E0F12` | `#16A34A` | data-heavy charts, screenshot showcases |

Secondary colours carry **meaning only**: `danger` (red-orange) for debt, interest and loss; `gold` for dividends, milestones and rewards; `muted` for labels. Green means progress or money that's working for you. Never use green for debt.

Vary the background per video and per scene. Mix looks within a video (the reference goes editorial → cinematic → editorial), and switch looks on a meaningful transition.

## Typography
- Inter only (bundled in `src/fonts.ts`), weights 800–900 for headlines and numbers, 700 for labels.
- Scale (`story.type`): mega 220 (hero number) · display 112 (hook) · h1 84 · h2 60 · label 30 · small 24. **Nothing under 24 px.** Keep labels letter-spaced (`letterSpacing: 3–4`, uppercase).
- Headlines are ink, with 1–2 key words in accent (`KineticText colors={{WORD: P.accent}}`). Numbers are huge, tabular, and come from `NumberCounter`.
- Keep on-screen text to **≤ 6 words per beat**. The narration carries the sentence and captions carry the words. Never put the narration on screen as paragraphs.
- Chapter structure: `ChapterTag` (green numbered square + uppercase label, e.g. `02 · EXTRA MONEY`).

## Layout and safe zones (TikTok / Reels / Shorts / FB Reels)
- `story.safe` = top 170, bottom 330, left 72, right 120. Scene content stays above `story.contentBottom` (1390). The caption band starts at `story.captionTop` (1430). Marcus stands on `story.ground` (1340).
- The hook is fully readable on **frame 0** (KineticText with a negative `at`, e.g. `at={-14}`).
- Keep the brand subtle: `BrandBug` at small size inside the safe area, usually only on the ending. No logo intros.

## Marcus (recurring character)
White stickman, black outline, **backward black baseball cap** (`story.marcus`). The rig is `src/story/components/Marcus.tsx`. **Never restyle him, recolour him, change his proportions or draw a new stickman.** On dark scenes pass `onDark`. Scale stays between 0.9 and 1.15 (the reference uses 1.05–1.1).

He acts through `track` keys (pose + face + optional cycle) keyed to cues, with spring-blended overlapping action. Use him purposefully: reacting to a number, holding or handing over an object, pointing at the thing being explained, celebrating a real milestone. Leave him out when a scene is pure data or a screenshot speaks for itself. He's a supporting actor, not a mascot in every frame.

## Motion language
- **Springs by intent** (`lib/motion.ts`): `snappy` UI chips · `bouncy` hero arrivals · `heavy` bills, slams, big numbers · `smooth` camera and layout · `limb` Marcus.
- Objects travel in **arcs** (`arc()`), not straight lines. Impacts get a short decaying `shake()`, sparingly.
- **Objects carry meaning across cuts.** In the reference, the balance number shrinks into the card; the scene then match-cuts on identical framing. Plan at least one continuity move per video.
- Camera: `Camera` keys push in on the key beat (zoom 1.05–1.12) and settle back. Use at most one push per scene. Handheld drift only in cinematic scenes, and subtle (≤ 1).
- Transitions must carry meaning: `iris` (light from a point: lamp, coin, zero balance), `panelSweep` (chapter change, "paid off"), `matchCut` (same framing, object continues), `slide` (new topic). **Never** use generic fades everywhere or the same transition twice in a row.
- Numbers animate **on the spoken word**: they count or roll as the amount is said and settle before the next idea. Debt goes down with a meter or gauge; savings fill a jar or bar; growth draws a line.
- SFX (`Sfx`, from `public/sfx/`): whoosh, pop, coin, cash, card, paper, thud, stamp, chime, tick, click. They sit about −9 dBFS under the voice. Use 1–3 per scene, each one tied to an on-screen event. No music (added at publishing).

## Visual variety (every video must feel fresh)
Before designing, read `META` from the 3 most recent `src/videos/*/script.ts` and change **at least three** of:
- hook style (surprising number · question · relatable situation · POV · object metaphor · bold claim)
- opening look (cream / black / white / screenshot-first)
- hero visual (card, jar, receipt, gauge, graph, wallet, paycheck bar, screenshot zoom, comparison panels)
- Marcus's role (absent · reacting · actor · narrator-pointer) and his first pose
- camera grammar (static lock-offs · push-ins · lateral tracking · top-down desk)
- transition set and pacing (fast cuts vs. one continuous transforming scene)
- composition (left-heavy · centered hero · split screen · full-bleed number)

Reuse the **design system**, not the layouts. Record your choices in `META.signatureMoves`.

## Anti-patterns (reject in QC)
Random floating objects · constant zooming · fade-only transitions · every element popping in the same way · excessive glow or particles · fake 3D · cheap AI-looking imagery · tiny graph labels · subtitle walls · slideshow layouts (title + bullet list) · overcrowded frames · a restyled Marcus · decorative text that says nothing · fabricated logos.
