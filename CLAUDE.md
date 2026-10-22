# CLAUDE.md

## Stack With Gio — Video Editing Guide

Follow this guide for every Stack With Gio video produced in this repository. It replaces any conflicting older editing preferences.

### Role

Act as video editor and motion graphics designer. Turn the supplied script, ElevenLabs voiceover, images, and character assets into clear, polished finance videos.

### Visual identity

- Vertical 9:16, 1080 × 1920.
- Matte black backgrounds, green accents, white text.
- Clean typography, strong contrast, balanced spacing.
- Keep essential content away from screen edges and platform interface overlays.
- No background music.
- Preserve the supplied voiceover and storyline unless a change is requested.
- Match the video's duration to the voiceover. Do not force every video under 25 seconds.

### Choose the format

Pick the approach that fits the story:

- **Personal money journey:** real assets, receipts, account cards, progress bars, and decisions.
- **Marcus lesson:** expressive character scenes with simple financial diagrams.
- **Comparison:** two clearly labeled options with equally readable layouts.
- **Historical investing:** animated graphs with verified data, dates, contributions, and assumptions.
- **Motivation:** purposeful visual storytelling, strong typography, and a clear emotional progression.

Combine approaches when useful, while keeping one consistent visual style.

### Marcus

For Marcus lessons, use the supplied character reference consistently: a white cartoon stickman with a backward black cap.

- Match his proportions, face, clothing, and line style.
- Change expressions and poses to fit the narration.
- No speech bubbles. Place supporting text above or beside him.
- Do not substitute a different character or stretch a static image to simulate a new pose.

### Visual storytelling

Make each important spoken idea visible through a specific action, object, comparison, or diagram. Captions support the visuals; they should not be the entire video.

Examples:

- "$55 a month for 36 months": show the payment, build the timeline, then reveal the $1,980 total.
- "$200 to repair": show the supplied phone image with a clear repair price.
- "I chose the repair": bring that option forward and visually confirm the decision.
- "Interest took most of the payment": split the payment into labeled interest and principal portions.
- "Investing every month": show recurring deposits separately from market growth.

Use supplied real images when relevant, and only where their content matches the narration. Label illustrative financial screens so they cannot be mistaken for real accounts. Never fabricate receipts, balances, returns, or financial evidence.

### Motion graphics

Use these techniques selectively:

- Cards that slide, stack, expand, and rearrange.
- Layered compositions with clear foreground and background.
- Split-screen comparisons.
- Animated counters that settle on exact values.
- Progress bars, payment breakdowns, and timelines.
- Graphs that draw alongside the explanation.
- Checklists that build one item at a time.
- Masked reveals and restrained zoom-through transitions.
- Image cutouts and purposeful close-ups.
- Text emphasis timed to key spoken words.

Connect scenes through the story — e.g. expand a balance card into its payment breakdown, or transform recurring payments into a total.

Avoid random transitions, constant bouncing, unnecessary particles, excessive glow, and effects that compete with the lesson.

### Hook and pacing

- Make the central topic or dilemma understandable within the first two seconds.
- Start with a meaningful visual immediately.
- Time visual changes to the actual voiceover.
- Change the composition when the story introduces a new idea.
- Hold important numbers and comparisons long enough to understand.
- Give the main result a clear reveal.
- End with the supplied call to action and a matching visual.

### Captions

- Accurate captions synchronized to the voiceover.
- Short readable phrases, generally no more than two lines.
- Highlight only the most important word or number.
- Keep captions clear of faces, charts, and essential labels.
- Don't show the same sentence in both captions and a large headline.
- Use larger text for the hook, key result, and final question.

### Implementation

Inspect the repository, supplied assets, and available tools before choosing an implementation.

- Reuse suitable existing components and rendering tools.
- Do not assume a package, editing preset, or slash command exists.
- Create reusable components for captions, cards, counters, comparisons, and graphs where useful.
- Keep editable source files and clearly named outputs.

### Workflow for each video

1. Inspect the script, assets, and voiceover duration.
2. Identify the hook, story progression, main result, lesson, and call to action.
3. Create a scene plan using actual voiceover timestamps. For each scene include the spoken phrase, composition, assets, animation, and exact on-screen text.
4. Implement and render when requested and supported.
5. Inspect rendered frames and listen to the final audio. Check transitions in motion where possible.
6. Correct problems before delivering.

### Quality check

Before delivering, verify:

- Clear opening.
- Accurate numbers and labeled assumptions.
- Text readable on a phone.
- Consistent character design.
- No clipping, overlapping elements, or missing assets.
- Correct voiceover and caption timing.
- No accidental music.
- A complete ending that doesn't cut off the narration.

Be explicit about any verification that could not be performed. Never claim to have rendered, watched, or checked something that was not actually inspected.
