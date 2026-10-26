# Stack With Gio video studio: working rules

- Read README.md for the workflow and component catalog. Remotion skills are in `.claude/skills/`.
- Time everything from `narration.json` via `makeCues()`; never hard-code frames for spoken beats.
- Motion: `interpolate`/`spring` with `src/lib/motion.ts` easings only. No CSS animations, no `Math.random`.
- Keep key text and visuals inside `SAFE` (`src/brand/theme.ts`). Check with
  `npm run preview -- <Comp>:<frames>`, which overlays the platform UI zones in red.
- Never claim an animation works without rendering frames and looking at them.
- No invented numbers: charts need a `source`; counters and bars showing the same value share frames and easing.
- Screenshots: blur private data from frame 0 (`ScreenshotReveal.privacy`).
- Finish with `npm run render -- <Comp> <name>` (QC must pass) and `npm run sync`.
- Run `npm run lint` before committing.
