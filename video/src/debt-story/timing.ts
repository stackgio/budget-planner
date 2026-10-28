import {FPS} from './theme';

/** Seconds → frame. Every anchor below is measured from the narration (see projects/debt-story/STORYBOARD.md). */
export const s = (sec: number) => Math.round(sec * FPS);

export const VO = {
	duration: 40.594,
	// 1 — hook
	swear: s(0.0),
	payingOff: s(1.03),
	everything: s(2.92),
	breaks: s(3.84),
	// 2-4
	tire: s(4.69),
	car: s(5.98),
	bill: s(7.28),
	billRandom: s(7.9),
	billEnd: s(8.69),
	// 5
	like: s(9.2),
	bro: s(9.53),
	out: s(10.82),
	notCollect: s(11.65),
	frustrationEnd: s(12.84),
	// 6
	age: s(13.28),
	goal: s(14.23),
	before2027: s(15.9),
	goalEnd: s(16.68),
	// 7
	learning: s(17.11),
	lifeDoesnt: s(18.36),
	plan: s(20.2),
	// 8
	thatsWhy: s(20.99),
	howImportant: s(22.45),
	emergencyFund: s(23.3),
	reallyIs: s(24.43),
	// 9
	evenHaving: s(24.85),
	d500: s(25.42),
	d1000: s(26.34),
	saved: s(27.5),
	handle: s(28.0),
	unexpected: s(29.0),
	without: s(29.8),
	creditCard: s(30.3),
	creditEnd: s(31.5),
	// 10
	because: s(32.0),
	oneThing: s(33.65),
	staying: s(34.05),
	realGoal: s(35.39),
	realGoalEnd: s(36.36),
	// 11
	whats: s(36.94),
	expense: s(37.68),
	messes: s(38.5),
	budgetEnd: s(40.32),
};

export const TOTAL_FRAMES = 1222;

/** Scene windows in global frames: [from, to). Overlaps are transitions. */
export const SCENES = {
	hook: [0, 140],
	tire: [130, 180],
	shop: [170, 216],
	bills: [214, 278],
	blocked: [270, 396],
	goal: [390, 512],
	plan: [506, 744],
	savings: [738, 958],
	milestone: [952, 1106],
	cta: [1100, TOTAL_FRAMES],
} as const;
