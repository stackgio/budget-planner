import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

/** "3 Things I Wish I Knew Before Paying Off Debt" — narration, one entry per spoken line. */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Before you start paying off debt, here are three things I wish I knew.', pauseAfter: 0.15},
	{id: 'L2', text: 'Number one: Build a small emergency fund first.'},
	{id: 'L3', text: 'Because the moment you start paying off debt, your car suddenly needs fixing.'},
	{id: 'L4', text: 'Even five hundred dollars saved can help keep an emergency from becoming more debt.', pauseAfter: 0.1},
	{id: 'L5', text: 'Number two: Find extra money to throw at your debt.'},
	{id: 'L6', text: "Overtime, selling stuff you don't use, or cutting expenses can help you pay it off faster.", pauseAfter: 0.6},
	{id: 'L7', text: "And number three: Don't go right back into debt."},
	{id: 'L8', text: 'Because paying it off is one thing.'},
	{id: 'L9', text: "Staying out of debt? That's the real goal.", pauseAfter: 0.3},
	{id: 'L10', text: 'Which one are you working on?'},
];

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'hook' | 'fund' | 'extra' | 'stay' | 'end'>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'fund', firstLine: 'L2', transitionFrames: 8}, // match cut (same framing)
	{id: 'extra', firstLine: 'L5', transitionFrames: 22}, // iris from the desk lamp
	{id: 'stay', firstLine: 'L7', transitionFrames: 24}, // green "paid off" sweep
	{id: 'end', firstLine: 'L10', transitionFrames: 16}, // slide up
];

/** Seconds held after the last word (the comment prompt needs a beat). */
export const TAIL_SEC = 2.6;
