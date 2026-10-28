/**
 * Scene content is authored in "stage" space and shifted up by STAGE_SHIFT on screen,
 * leaving the lower-middle band (~70–78% down) free for burned-in subtitles.
 * screenY = stageY - STAGE_SHIFT
 */
export const STAGE_SHIFT = 210;

/** Where the hook's big warning sits (stage space); Scene 2's reveal grows from here. */
export const HOOK_WARN = {x: 770, y: 930};
