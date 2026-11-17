import {US_TILES} from './facts';

/**
 * Shared geometry so the basket card, the VOO card and the VTI card line up
 * across cuts (match cut basket → VOO; Apple/Microsoft never move into VTI).
 */
export const VOO_CARD = {x: 190, y: 340, w: 700, h: 840};
export const VTI_CARD = {x: 120, y: 200, w: 840, h: 1180};
/** header inside the card: ticker line + descriptor line */
export const HEADER = {padX: 44, padTop: 40, ticker: 140, desc: 46};

export type TileBox = {x: number; y: number; w: number; h: number; label: string; row: 'top' | 'mid' | 'bottom'};
const BX = 230; // tile block left (inside VOO card, 40px padding)
const BY = 620; // tile block top
export const US_TILE_BOXES: TileBox[] = [
	...US_TILES.top.map((label, i) => ({x: BX + i * 220, y: BY, w: 180, h: 140, label, row: 'top' as const})),
	...US_TILES.mid.map((label, i) => ({x: BX + i * 330, y: BY + 180, w: 290, h: 160, label, row: 'mid' as const})),
	...US_TILES.bottom.map((label, i) => ({x: BX + i * 220, y: BY + 380, w: 180, h: 140, label, row: 'bottom' as const})),
];
export const BLOCK = {x: BX, y: BY, w: 620, h: 520};

/** Small "smaller company" tiles filling the VTI ring around the VOO block. */
export const VTI_SMALL: {x: number; y: number; s: number; d: number}[] = (() => {
	const out: {x: number; y: number; s: number; d: number}[] = [];
	const s = 58;
	const g = 14;
	const x0 = VTI_CARD.x + 32;
	const x1 = VTI_CARD.x + VTI_CARD.w - 32;
	const cx = BLOCK.x + BLOCK.w / 2;
	const cy = BLOCK.y + BLOCK.h / 2;
	const push = (x: number, y: number) => out.push({x, y, s, d: Math.hypot(x + s / 2 - cx, y + s / 2 - cy)});
	const cols = Math.floor((x1 - x0 + g) / (s + g));
	const left = x0 + (x1 - x0 - (cols * (s + g) - g)) / 2;
	// one row above the block, three below, one column each side
	for (const y of [BLOCK.y - (s + g) - 6]) for (let c = 0; c < cols; c++) push(left + c * (s + g), y);
	for (const y of [BLOCK.y + BLOCK.h + 20, BLOCK.y + BLOCK.h + 20 + (s + g), BLOCK.y + BLOCK.h + 20 + 2 * (s + g)])
		for (let c = 0; c < cols; c++) push(left + c * (s + g), y);
	for (let y = BLOCK.y; y + s <= BLOCK.y + BLOCK.h; y += s + g) {
		push(BLOCK.x - s - 12, y);
		push(BLOCK.x + BLOCK.w + 12, y);
	}
	return out;
})();
