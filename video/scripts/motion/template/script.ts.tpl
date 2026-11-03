import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: '__COMP__',
	slug: '__SLUG__',
	title: '__TITLE__',
	mode: '__MODE__',
	looks: ['editorial', 'cinematic', 'editorial'],
	hookStyle: 'TODO',
	signatureMoves: ['TODO'],
};

/**
 * Narration, one entry per spoken line. When a voiceover exists this text
 * must match what is SPOKEN (the audio is the timing authority) — build it
 * from public/voice/__SLUG__/script-lines.json after `voice.py transcribe`.
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Placeholder hook line that grabs attention in two seconds.'},
	{id: 'L2', text: 'Placeholder middle line where the money actually moves.'},
	{id: 'L3', text: 'Placeholder ending with the takeaway.'},
];

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'hook' | 'body' | 'end'>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'body', firstLine: 'L2', transitionFrames: 20},
	{id: 'end', firstLine: 'L3', transitionFrames: 16},
];

/** Seconds held after the last word. */
export const TAIL_SEC = 1.6;
