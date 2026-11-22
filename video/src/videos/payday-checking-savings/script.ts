import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';
import dialogue from './dialogue.json';

export const META: VideoMeta = {
	compositionId: 'PaydayCheckingSavings',
	slug: 'payday-checking-savings',
	title: 'Payday: Checking vs High-Yield Savings',
	mode: 'budget',
	looks: ['cinematic'],
	hookStyle: 'question (friend asks on a PAYDAY notification)',
	signatureMoves: [
		'faceless two-voice dialogue: friend questions as white chat bubbles, Gio answers on a board',
		'matte black + bright emerald, no Marcus',
		'one persistent two-column board that fills across two scenes (continuity)',
		'hard cut to a realistic car-key close-up with a warning light on "breaks down"',
		'emerald panel sweep brings the board back',
	],
};

/**
 * Narration = the dialogue (dialogue.json is the single source for the TTS
 * tool and for the timing). F* = friend (shown in bubbles, no caption band),
 * G* = Gio (word-synced captions).
 */
type Line = {id: string; speaker: string; text: string; gapBefore?: number};
const LINES = dialogue.lines as Line[];
export const SCRIPT: ScriptLine[] = LINES.map((l, i) => ({
	id: l.id,
	text: l.text,
	speaker: l.speaker,
	caption: l.speaker !== 'friend',
	// temp-timing only: the gap before the next speaker (real tracks carry their own pauses)
	pauseAfter: Math.max(0, (LINES[i + 1]?.gapBefore ?? 0) - 0.12),
}));

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'payday' | 'checking' | 'carkey' | 'savings'>[] = [
	{id: 'payday', firstLine: 'F1'},
	{id: 'checking', firstLine: 'G1', transitionFrames: 12}, // bubble slides up and away, board rises
	{id: 'carkey', firstLine: 'F2', transitionFrames: 0}, // hard cut to the close-up
	{id: 'savings', firstLine: 'G2', transitionFrames: 18}, // emerald sweep back to the board
];

/** Seconds the completed board holds after the last word. */
export const TAIL_SEC = 2.2;
