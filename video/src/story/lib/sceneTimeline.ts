import type {Narration} from './narration';
import {cueSec} from './narration';

export type SceneDef<Id extends string = string> = {
	id: Id;
	firstLine: string;
	/** transition INTO this scene, in frames (ignored for the first scene) */
	transitionFrames?: number;
	/** shift the cut later (+) or earlier (−) relative to the first line, in seconds — e.g. let the previous scene breathe over a lead-in phrase */
	offsetSec?: number;
};

export type SceneWindow<Id extends string = string> = {
	id: Id;
	/** absolute frame where this scene's sequence starts (= its local frame 0) */
	start: number;
	/** absolute frame where it ends (includes the outgoing transition overlap) */
	end: number;
	durationInFrames: number;
	/** absolute frame of the cut point (centre of the incoming transition) */
	boundary: number;
	transitionIn: number;
};

/**
 * Turns narration into scene windows for <TransitionSeries>. Scene i starts
 * `leadSec` before its first line, centred on its incoming transition, so
 * a scene's sequence durations always add up exactly:
 *   start(i+1) = start(i) + duration(i) - transition(i+1)
 */
export const buildSceneWindows = <Id extends string>(
	scenes: SceneDef<Id>[],
	narration: Narration,
	fps: number,
	opts: {leadSec?: number; tailSec: number},
): {windows: SceneWindow<Id>[]; durationInFrames: number} => {
	const lead = opts.leadSec ?? 0.12;
	const lastEnd = Math.max(...narration.lines.map((l) => l.end));
	const durationInFrames = Math.ceil((lastEnd + opts.tailSec) * fps);
	const boundaries = scenes.map((s, i) => (i === 0 ? 0 : Math.round((cueSec(narration, s.firstLine) + (s.offsetSec ?? 0) - lead) * fps)));
	const tin = scenes.map((s, i) => (i === 0 ? 0 : (s.transitionFrames ?? 0)));
	const starts = boundaries.map((b, i) => (i === 0 ? 0 : b - Math.floor(tin[i] / 2)));
	const windows = scenes.map((s, i) => {
		const end = i === scenes.length - 1 ? durationInFrames : starts[i + 1] + tin[i + 1];
		return {id: s.id, start: starts[i], end, durationInFrames: end - starts[i], boundary: boundaries[i], transitionIn: tin[i]};
	});
	for (const w of windows) if (w.durationInFrames <= 0) throw new Error(`Scene ${w.id} has no duration — check narration cues`);
	return {windows, durationInFrames};
};
