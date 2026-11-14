# DMM-002 — research and creative audit (2026-11-14)

## 1. Did I watch the reference videos?
**No.** For all ten references (DMM-001 and DMM-002) I used vidIQ's `watch_shortform_content` tool. It returns an AI-written, scene-by-scene text description plus a single still image. I never saw the moving video, never heard its audio, and could not check the description against the footage. Two of my earlier statements overclaimed: "5 real references watched" (DMM-001 delivery) and "watched the top candidates" (DMM-002). The research notes did state the limit; the chat summaries did not.

What I actually had for @savingjourney_daily (REF-0006):
- vidIQ's outlier-search metadata (views, median, followers, a hook/format summary)
- vidIQ's AI walkthrough (text)
- one still image: "DAY 82 / MY SAVING JOURNEY 💵 / ONE DAY AT A TIME." over a tall clear acrylic box, a light wall, a $100 note near the top, notes at the bottom
- (today) the creator's 10 most recent posts with counts, via vidIQ's TikTok profile tool

## 2. The first 2 seconds
**From vidIQ's description, not verified:** a static high-angle shot of a tall, clear acrylic tower against a white wall. A hand off-screen slides a $100 bill into the top slot. The bill tips and falls through staggered internal shelves. The text sits top-centre the whole time. Sound: paper sliding, then click/thud contacts.

**From the one still I saw:** the text block, the tall clear box, a note near the top, notes at the bottom. No hand is visible in that frame. I can't confirm shelves, motion, timing or sound.

## 3. Editing, camera, animation, transitions, sound
According to the description, there's almost no editing: one continuous take, a locked camera, no animation, no transitions, static text, no music. The sound is raw close-mic ASMR (paper on acrylic, clicks on each shelf, a landing thud). The pace is calm: about 3–4 s per note, roughly 4 notes in 14 s. It loops because the frame never changes.

So **editing craft isn't what made it worth studying**, and I scored it only 6/10 for editing. The plausible drivers (hypotheses) are:
- a **real, physical object** obeying real physics (the bill bouncing through a maze)
- **real money** (stakes and authenticity: a real person's real cash)
- **tactile sound**
- **a series identity**: "Day 82" of a daily journey. The account posts every day, and the viral post had **97.8K shares and 92.8K saves**.
- a **seamless loop**

## 4. What DMM-002 implemented
| Reference element (as described) | In DMM-002? |
|---|---|
| Transparent container | Partly: a drawn 2.5D glass cylinder, not a real acrylic tower, and no internal shelves |
| One note per day + day counter | Yes |
| Per-note tactile sound | Synthesised "slaps" frame-synced to each landing. Not real foley, and not heard by me. |
| No dead first second (motion on frame 0) | Yes (note mid-fall) |
| Bill travelling a path (zig-zag maze, the analysed "payoff") | **No**: notes fall straight down |
| Real object, real room, real light, human hand | **No**: abstract black void, vector shapes, no hand |
| Locked camera, single take | Single take yes; locked no (I added zooms) |
| No music, pure ASMR | **No**: I added a drone/pad score |
| Minimal static text | **No**: 5 headline changes + counter + footnote |
| Uniform calm rhythm (a loop) | **No**: I turned it into a 365-day time-lapse that ends in a bar-chart-like fill |
| Series premise ("Day 82 of my journey") | No (a one-off year summary) |

## 5. Why DMM-002 still looks like a financial infographic
1. **The column is a progress bar.** A vertical container filling to a level with a glowing top, next to a big $ counter, is a bar chart. The time-lapse turns the tactile moment into data.
2. **Text and numbers are the heroes.** A headline, a sub-line, DAY n, a 104-px $ counter and a footnote: four text blocks compete with one object that takes up about 25% of the frame width.
3. **Vector rendering.** Flat SVG gradients and constant strokes. No refraction, no reflections, no shadows cast by notes, no depth of field. The notes are rounded rectangles with a "20", so they read as icons.
4. **No world.** A black void with no surface, no environment, no scale reference, no human.
5. **Mathematical motion.** A uniform stripe stack, identical flutter, a thinned stream that reads as a ladder of rectangles. No collisions, tumbling, settling or random piles.
6. **Brand-green light as the only colour.** It feels like UI, not like a filmed place.

## 6. What I would change (keeping the savings message)
**Highest impact: real footage you shoot, plus our graphics on top (hybrid).** A clear jar or box, real $20 notes, a phone on a tripod, window light, the phone mic close (or a cheap clip-on mic). About 10–15 s of footage. This brings in the authenticity, physics and sound that drove the reference, and it is yours, not a copy of theirs. We then add the series element and a restrained finish: an original day counter, a day-1/day-30/day-365 time jump, and one clean end line.

If you can't film, then in order of effort:
1. **Photoreal rendering**: a 3D glass object with real refraction, contact shadows and depth of field (`@remotion/three`, a new dependency), physics-like tumbling and an uneven pile.
2. **Macro-first camera**: open on an extreme close-up of a note edge entering the slot (shallow focus), then reveal.
3. **A place**: a desk or shelf surface, a soft window key light, warm practical light. Brand green used as an accent only.
4. **Fewer words**: the day counter only while saving. The $ total appears once, at the end. One end line.
5. **Time-lapse as match cuts** (same framing at DAY 1 → 30 → 180 → 365) instead of a bar filling.
6. **Real or licensed foley** instead of synthesised slaps. Drop or greatly reduce the music.
7. **A series**: "Day N" episodes rather than a one-off summary, if it fits your account.

## 7. Where 23.8M and 1,345× came from
- **Source:** vidIQ `vidiq_instagram_tiktok_outlier_search` on 2026-11-14 returned "23.8M views (1344.6x their median of 17.7K) · 36.6K followers". I rounded 1,344.6 to 1,345 and calculated nothing myself.
- **Baseline:** vidIQ's "median" for the creator. Its sample (number of posts, time window) isn't disclosed to me, and I didn't verify it at the time.
- **Cross-check today** (vidIQ TikTok profile feed): the post now shows **24M views**, 1.9M likes, 97.8K shares, 92.8K saves, and it's pinned.
  - The median of the creator's 7 most recent non-pinned posts older than a day (11-09 to 11-13) is **52.3K** (≈ **459×**).
  - Including the 1-day-old post, the median is 40.9K (≈ **588×**).
  - **The 1,345× figure was not reproduced.** It depends on vidIQ's baseline. The video is still an extreme outlier.
- **Other findings that weaken the evidence:**
  - REF-0007 (@giraffe.8206791, "10.4M") has a caption word-for-word identical to @savingjourney_daily's TikTok "Day 12" post (7.8M, posted about 6 weeks earlier). It is **probably a repost of the same footage, not an independent confirmation**.
  - Several of the creator's captions push an "#acrylicsavingsbox" product, and other accounts in this trend sell the box (@spaince94, @garutshopingusa). Part of the trend may be product marketing. This is not confirmed: no promoted or paid flag was returned.

## 8. "512×910 instead of 1080×1920"
Every DMM-002 render probes as **1080×1920, 30 fps, 450 frames** (`ffprobe`), including the committed `video/renders/daily/DMM-002/DMM-002_v03.mp4` (34.7 MB) and `cover.png`. 512×910 is exactly 1080×1920 scaled to 512 px wide (1920 × 512/1080 = 910). So what you're seeing is almost certainly a **downscaled preview copy** made by the app when I sent the file as an inline player. I can't see that conversion, so this is an inference. The full-resolution file is on the branch `claude/daily-money-motion-4tu50i`, and I can re-send it as a download attachment instead of an inline preview.
