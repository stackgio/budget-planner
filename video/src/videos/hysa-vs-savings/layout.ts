import {story} from '../../story/theme';

/** Shared framing so hook → bank cut on identical positions (match cut). */
export const BANK = {x: 72, w: 400, h: (400 * 314) / 400};
/** door centre of the bank in frame coordinates */
export const BANK_DOOR = {x: BANK.x + 200, y: story.ground - BANK.h + 205};
export const MARCUS = {x: 830, scale: 1.05};
/** the year-by-year ladder card (bank + HYSA scenes share it → same framing) */
export const LADDER = {x: story.safe.left, y: 500, w: 1080 - story.safe.left - story.safe.right, h: 320};
/** phone stands where the bank stood */
export const PHONE = {x: 120, w: 210};
/** vault in the safety scene; the CTA irises out of its handle */
export const VAULT = {x: story.safe.left, y: 450, w: 440};
export const VAULT_HANDLE = {x: VAULT.x + VAULT.w / 2, y: VAULT.y + (VAULT.w * 180) / 360};
