import {story} from '../../story/theme';

/** Shared framing so scenes 1→2 cut on identical positions (match cut). */
export const CARD = {x: 72, y: 500, w: 540};
export const CARD_H = CARD.w * 0.63;
const u = CARD.w / 520;
/** where the card's balance number sits (top-left), and its font size */
export const CARD_BALANCE = {x: CARD.x + 40 * u, y: CARD.y + 168 * u + 20 * u * 1.25, fontSize: 78 * u};
export const MARCUS_A = {x: 840, y: story.ground, scale: 1.1};
export const HEAD = {top: story.safe.top + 20, title: 300};
