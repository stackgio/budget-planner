import {FPS} from '../debt-story/theme';

/**
 * TEMPORARY narration timing. No voiceover recording was supplied, so every phrase is placed by a
 * pace model calibrated on the creator's measured ElevenLabs take from the debt-story video
 * (117 words over 33.0 s of speech = 3.54 words/s, pauses excluded). Dollar amounts count as 1.6
 * words because they are spoken as several ("five hundred dollars").
 *
 * When the real recording arrives: measure each phrase (ffmpeg silencedetect + RMS dips, see
 * projects/debt-payoff-3/STORYBOARD.md), replace this model with the measured {start, end} per
 * phrase and keep the ids. Every scene, caption, SFX and transition reads from these anchors.
 */
const RATE = 3.54;
const LEAD_IN = 0.1;

type Phrase = {id: string; text: string; gap: number};

// `gap` = pause after the phrase (s). *stars* mark the highlighted word in the captions.
const SCRIPT: Phrase[] = [
	{id: 'hook1', text: "If you're trying", gap: 0.04},
	{id: 'hook2', text: 'to pay off *debt,*', gap: 0.12},
	{id: 'three', text: 'here are *three things*', gap: 0.04},
	{id: 'focus', text: "I'd focus on.", gap: 0.4},

	{id: 'n1', text: '*Number one:*', gap: 0.28},
	{id: 'fund', text: 'Build a small *emergency fund.*', gap: 0.4},
	{id: 'amounts', text: 'Even *$500* to *$1,000*', gap: 0.04},
	{id: 'help', text: 'set aside can help.', gap: 0.34},
	{id: 'lastThing', text: 'Because the last thing you want', gap: 0.04},
	{id: 'tire', text: 'is a *flat tire*', gap: 0.06},
	{id: 'bill', text: 'or unexpected *bill*', gap: 0.04},
	{id: 'forcing', text: 'forcing you right back', gap: 0.02},
	{id: 'intoDebt', text: 'into *debt.*', gap: 0.42},

	{id: 'n2', text: '*Number two:*', gap: 0.28},
	{id: 'find', text: 'Find a way to bring in', gap: 0.02},
	{id: 'extra', text: '*extra money.*', gap: 0.4},
	{id: 'couldMean', text: 'That could mean', gap: 0.04},
	{id: 'overtime', text: 'working *overtime,*', gap: 0.1},
	{id: 'shifts', text: 'picking up *extra shifts,*', gap: 0.1},
	{id: 'doordash', text: 'doing *DoorDash,*', gap: 0.1},
	{id: 'selling', text: 'or *selling things*', gap: 0.02},
	{id: 'dontUse', text: "you don't use anymore.", gap: 0.38},
	{id: 'fifty', text: 'Even an extra *$50*', gap: 0.04},
	{id: 'hundred', text: 'or *$100* a week', gap: 0.04},
	{id: 'difference', text: 'can make a *difference.*', gap: 0.42},

	{id: 'n3', text: 'And *number three:*', gap: 0.28},
	{id: 'stop', text: 'Stop adding *new debt.*', gap: 0.4},
	{id: 'point', text: "Because what's the point", gap: 0.04},
	{id: 'paying300', text: 'of paying *$300*', gap: 0.02},
	{id: 'towardCard', text: 'toward your credit card', gap: 0.08},
	{id: 'turning', text: "if you're turning around", gap: 0.02},
	{id: 'charging', text: 'and charging *another $300?*', gap: 0.45},

	{id: 'working', text: "I'm working toward", gap: 0.02},
	{id: 'debtFree', text: 'becoming *debt-free* myself,', gap: 0.14},
	{id: 'learning', text: "and one thing I'm learning", gap: 0.04},
	{id: 'notJust', text: "is that it's not just about", gap: 0.02},
	{id: 'payOff', text: 'how much you *pay off.*', gap: 0.36},
	{id: 'changing', text: "It's about changing", gap: 0.02},
	{id: 'habits', text: 'the *habits*', gap: 0.02},
	{id: 'gotYou', text: 'that got you there.', gap: 0.45},
	{id: 'whats', text: "What's been the *hardest part*", gap: 0.02},
	{id: 'yourDebt', text: 'of paying off your debt?', gap: 0},
];

const words = (t: string) => t.replace(/\*/g, '').split(/\s+/).filter(Boolean);
const weight = (w: string) => (w.includes('$') ? 1.6 : 1);

export type Timed = {id: string; text: string; start: number; end: number; words: {w: string; start: number}[]};

export const PHRASES: Timed[] = (() => {
	let t = LEAD_IN;
	return SCRIPT.map((p) => {
		const ws = words(p.text);
		const total = ws.reduce((a, w) => a + weight(w), 0);
		const start = t;
		let acc = 0;
		const wt = ws.map((w) => {
			const ws0 = start + acc / RATE;
			acc += weight(w);
			return {w, start: ws0};
		});
		const end = start + total / RATE;
		t = end + p.gap;
		return {id: p.id, text: p.text, start, end, words: wt};
	});
})();

const byId = Object.fromEntries(PHRASES.map((p) => [p.id, p]));
export type PhraseId = (typeof SCRIPT)[number]['id'];

export const s = (sec: number) => Math.round(sec * FPS);
/** Frame where phrase `id` starts (or its k-th word starts). */
export const at = (id: string, k = 0) => {
	const p = byId[id];
	if (!p) throw new Error(`unknown phrase ${id}`);
	return s(p.words[Math.min(k, p.words.length - 1)].start);
};
/** Frame where phrase `id` ends. */
export const endOf = (id: string) => s(byId[id].end);

export const VO_END = endOf('yourDebt');
/** Narration end + a 0.6 s hold so the final question can land. */
export const TOTAL_FRAMES = VO_END + s(0.6);

/**
 * Scene windows [from, to) in global frames. Each scene starts a few frames before its first line
 * so the cut lands on the word; consecutive windows overlap by the transition length.
 */
export const XF = 10;
export const SCENES = {
	hook: [0, at('n1') + 2],
	fund: [at('n1') - XF + 2, at('lastThing') + 4],
	tire: [at('lastThing') - XF + 4, at('bill', 2) + 4],
	split: [at('bill', 2) - XF + 4, at('n2') + 6],
	income: [at('n2') - XF + 2, at('fifty') - 2],
	weeks: [at('fifty') - XF - 2, at('n3') + 2],
	card: [at('n3') - XF + 2, at('working') + 8],
	ending: [at('working') - 2, at('whats') + 2],
	cta: [at('whats') - XF + 2, TOTAL_FRAMES],
} as const;
export type SceneId = keyof typeof SCENES;
