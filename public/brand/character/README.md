# Gio character reference

Drop the official reference art for the white stickman with the backward black cap here
(e.g. `gio-front.png`, `gio-side.png`, `gio-expressions.png`).

The animated rig lives in `src/components/character/` and was built from the written
description, since no reference files were supplied yet. To match the reference:

- Proportions, stroke width, head size: `R` in `src/components/character/Stickman.tsx`
- Cap shape (dome, brim behind the head, button): `Cap` in the same file
- Faces: `Face` in the same file
- Poses: `src/components/character/poses.ts`

After any change, render `CharacterSheet` (Studio → Reference) and compare side by side:
`npx remotion still CharacterSheet out/checks/character-sheet.png`
