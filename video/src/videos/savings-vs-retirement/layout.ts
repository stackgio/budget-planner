import {desk} from '../../story/components/Desk';
import {editorial} from '../../story/theme';

/** Card slots are identical in both scenes (they carry the comparison and the match cut). */
export const CARD = {w: 426, h: 640, y: 330, lx: 72, rx: 534} as const;
export const cardCx = (side: 'L' | 'R') => (side === 'L' ? CARD.lx : CARD.rx) + CARD.w / 2;
/** zone under the cards for labels / props (keep above the caption band at 1430) */
export const BELOW = {top: 1010, bottom: 1380, left: 72, right: 960} as const;

export const C = {
	ink: desk.ink,
	muted: desk.muted,
	green: editorial.accent,
	greenDeep: editorial.accentDeep,
	greenSoft: 'rgba(30,158,87,0.12)',
	// employer money: warm gold, clearly a different source than the paycheck green
	gold: '#C98A12',
	goldSoft: 'rgba(226,167,46,0.16)',
};
