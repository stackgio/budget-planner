/** Stage layout (1080x1920). Everything stays left of the right-edge platform buttons. */
export const LEFT = 80;
export const RIGHT_INSET = 140; // content right edge = 940
export const GAP = 44;
export const CARD_W = (1080 - LEFT - RIGHT_INSET - GAP) / 2; // 408
export const COL_X = [LEFT, LEFT + CARD_W + GAP] as const; // 80, 532
export const MID_X = LEFT + CARD_W + GAP / 2; // 510
export const CARD_Y = 390;
export const CARD_H = 780;
export const BASKET_TOP = 420;
/** tile slots inside a big basket, bottom-up */
export const TILE_W = 320;
export const TILE_H = 64;
export const TILE_X = (CARD_W - TILE_W) / 2;
export const slotY = (i: number) => CARD_H - 22 - 20 - (i + 1) * TILE_H - i * 12;
/** end grid */
export const GRID_Y = [420, 905] as const;
export const GRID_H = 460;
export const GRID_BASKET_TOP = 170;
