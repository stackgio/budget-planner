# Component cheat sheet (`video/src/story/`)

Read the component source before using a prop you haven't used before. When you need something new, add a **reusable, typed, palette-aware** component in `src/story/components/` (not inside a video folder), then mention it in this file.

## Timing: cues, never seconds
```tsx
const frame = useCurrentFrame(); const {fps} = useVideoConfig();
const {cue} = useCues();                 // inside any scene
const tSay = cue('L4', '$500');          // scene-local frame where "$500" starts (punctuation/case-insensitive)
const tEnd = cue('L4', undefined, 0, 'end'); // end of line L4
const tPre = cue('L3', 'car', -0.15);    // 0.15 s before the word
```
Scene `firstLine`s and `transitionFrames` live in `script.ts`. `buildSceneWindows` centres each transition on the line start. Frame 0 of a scene's component is its sequence start, which includes the incoming transition overlap.

## Motion (`lib/motion.ts`)
`sp(frame, fps, start, 'snappy'|'bouncy'|'heavy'|'smooth'|'limb')` spring 0→1 · `prog(frame, start, dur, E.out)` eased 0→1 · `kf(frame, [f0,f1], [v0,v1], E.inOut)` keyframes · `mix(a,b,t)` · `arc(t, from, to, lift)` → [x,y] · `shake(frame, at, amp, dur)` → {x,y} · `wobble(frame, seed, speed, amp)` · easings `E.out/inOut/in/soft/back`.

## Marcus (`components/Marcus.tsx`)
```tsx
<Marcus x={760} y={story.ground} scale={1.05} facing={-1} seed={1} onDark={false}
  frontProp={<g>…svg in hand space…</g>}
  track={[
    {at: 0, pose: 'idle', face: 'curious'},
    {at: tSay, pose: 'shock', face: 'shock', spring: 'bouncy'},
    {at: tSay + 30, pose: ['point', {head: -10}], face: 'determined'},
    {at: tEnd, pose: 'celebrate', face: 'joy', cycle: 'cheer'},
  ]} />
```
- **Poses:** idle, relaxed, shock, flinch, worried, point, present, hold, feed, push, stop, celebrate, fist, think, shrug, sit, sitType, walk. Override joints with `[name, {joint: deg}]`.
- **Faces:** neutral, happy, joy, shock, worried, determined, focused, smug, curious (or partial `{mouthCurve, sweat, lookX…}`).
- **Cycles:** walk (move `x` yourself while walking), type, cheer, breathe-hard.
- Auto-grounded on `y`. `facing` 1 = right. Gallery of all poses: composition `MarcusGallery`.

## Finance objects
| Component | Key props | Typical use |
|---|---|---|
| `CreditCard` | `w, variant: debt\|offer\|green, balance (node), balanceLabel, rotX/rotY/rot, shine, badge` | debt balance on a card, "0% offer" temptation |
| `Bill` / `Coin` / `CashStack` (`Money.tsx`) | `w/size, value, rot, spin, count` | cash moving (arc it!) |
| `Wallet` (`Money.tsx`) | `w, open 0..1, bills` | spending, side income |
| `Receipt` (`Money.tsx`) | `title, lines:[label,amt][], total, reveal 0..1, stamp 0..1, stampText, totalTone` | bills, repair costs, budgets |
| `SavingsJar` (`Money.tsx`) | `w, level 0..1, label, amount, palette` | emergency fund, dividends collected |
| `ProgressBar` | `progress, w, h, milestones[], label, valueLabel, knob, palette` | savings or payoff progress |
| `DebtMeter` | `total, remaining, size, label, hit` | 240° payoff gauge (counter = what's left) |
| `AllocationBar` | `items:[{label, amount, color?}], progress, w, focus, format` | paycheck/budget split, legend rows |
| `NumberCounter` | `value, prefix, suffix, fontSize, color, roll, fixedDigits` | every animated amount (`roll={false}` for a cash-register snap) |
| `StoryGraph` | `w, h, series:[{id, values, color, dash, fill, endLabel}], progress, yMax, xLabels, yLabels, markers, palette` | payoff curves, growth, narrated historical charts |
| `Comparison` | `left/right: {title, value, caption, tone, visual}, at, palette, vs` | A vs B |
| `Thermostat` / `HouseKey` / `SpeechBubble` / `Stamp` / `DotGrid` / `Paycheck` / `GradCap` (`HomeProps.tsx`) | `Thermostat {w, temp, mode, power 0..1, dial, glow}` · `HouseKey {w}` (rotate via style, origin `22% 50%` = bow) · `SpeechBubble {w, tail, dashed}` · `Stamp {text, at, color, rot}` · `DotGrid {dot, gap}` | home-ownership stories, AC/repair hooks, ending card layouts |
| `CreatorClip` | `src, trimBefore, trimAfter, words (clip-local s), captionTop, captionSize, handle` | third-party creator clips in a cold open: untouched pixels, captions placed clear of burned-in text, handle credit chip |
| `Screenshot` | `src, natural:{w,h}, w, redact: Region[], mark, highlight, zoomTo, focus, viewportH, frame: card\|phone\|none` | real evidence; regions in the image's natural pixels |

## Type, framing, chrome
- `KineticText`: `text, at, mode: rise|pop|slam|none, exitAt, fontSize, color, colors:{WORD: color}, marker:{words, color, at}, stagger, align`. Use `at < 0` for text visible on frame 0.
- `Camera`: `keys:[{at, zoom, x, y, rot, ease}]` (x/y = focus point in the 1080×1920 frame), `handheld`, `shakeX/Y`.
- `Backgrounds`: `EditorialBg {floorY, tint}`, `CinematicBg {lightX, lightY, light, warm, floorY}`.
- `Chrome`: `ChapterTag {n, label, at, exitAt, palette}`, `BrandBug {palette, opacity}`, `Sfx {at, name, volume}`.
- `Captions`: rendered automatically by `NarratedVideo` (word-synced, palette follows the scene). Turn off with prop `captions: false` only if the creator asks.
- `Transitions`: `iris({x, y})`, `panelSweep({color, direction: 'up'|'left'})`, `matchCut()`, plus `slide({direction})`, `wipe()`, `fade()` from `@remotion/transitions/*`. Set them per scene in `Video.tsx` → `transitions: {sceneId: {presentation, timing: 'linear'|'spring'}}`.

## Video shell (`lib/NarratedVideo.tsx`)
`VideoDef = {script, scenes, tailSec, components, looks, transitions?, leadSec?, intro?, overlay?}`. `intro: {durationInFrames, component}` plays before the narration (e.g. a creator-clip cold open); export `INTRO_FRAMES` from `script.ts` so `report.ts` offsets QC beats. `overlay` draws over the narrated part (watermark) and gets `paletteAt`. `Captions` also takes `top`, `fontSize`, `backdrop`; `SavingsJar` takes `showLabel={false}` to avoid implying a balance. Props schema `narratedSchema`: `voiceAudio, alignment, voiceVolume, captions, sfx, sfxVolume, tempRate`. Narration resolution: alignment → aligned; voice only → audio-scaled; nothing → temp.

## Facts (`lib/meta.ts`)
`fact(value, 'personal'|'historical'|'hypothetical'|'computed', source)`. Scenes read `FACTS.x.value`. Anything `hypothetical` on screen needs a visible "EXAMPLE" label.

## Assets
Creator files go in `public/motion/<slug>/assets/` and are referenced as `motion/<slug>/assets/<file>` (through `staticFile` inside components). Logos only from official sources (see `/graph` rules). Never draw a fake logo or a fake app UI presented as real.
