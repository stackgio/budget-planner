import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'MarketCrashNov5',
	slug: 'market-crash-nov5',
	title: 'Why the Market Crashed (Nov 5, 2026)',
	mode: 'personal-journey',
	looks: ['news-dark-red', 'news-dark-neutral', 'news-dark-green', 'screenshot', 'news-dark-green'],
	hookStyle: 'surprising-number',
	signatureMoves: [
		'full-bleed red −5.5% on frame 0 that match-cuts into the first data card',
		'one shared percentage scale reused for Nasdaq, S&P and Nvidia (honest comparison)',
		'layered 2.5D data-center diagram: rules → slower buildout → uncertainty (crane stalls)',
		'red→green panel reset into the genuine SoFi order screenshot',
		'hypothetical fork paths labelled SCENARIOS — NOT PREDICTIONS, ending on a split-screen debate',
	],
};

/**
 * Narration — EXACTLY as spoken in the creator's ElevenLabs file
 * (ElevenLabs Scribe transcript, public/voice/market-crash-nov5/transcript.json).
 * L5 is split at its clause boundary so the data-center scene starts on "and now".
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'The stock market just got absolutely crushed yesterday.'},
	{id: 'L2', text: 'But what actually caused it?'},
	{id: 'L3', text: 'The Nasdaq dropped five point five percent, and the S&P 500 fell over four percent.'},
	{id: 'L4', text: 'One major concern?'},
	{id: 'L5', text: 'Democrats just won big in the midterm elections,'},
	{id: 'L5b', text: 'and now investors are worried that tougher AI regulations could slow down the massive expansion of AI data centers.'},
	{id: 'L6', text: 'Why does that matter?'},
	{id: 'L7', text: 'Because companies are spending billions of dollars building AI infrastructure, and investors are already questioning whether those investments will pay off.'},
	{id: 'L8', text: 'Those fears added even more pressure to tech stocks, with Nvidia falling over nine percent.'},
	{id: 'L9', text: "But while some investors are panic selling, I'm doing the complete opposite."},
	{id: 'L10', text: "I'm still buying the dip."},
	{id: 'L11', text: 'I actually bought more SoFi stock because I believe in its long-term potential.'},
	{id: 'L12', text: "Now, I'm only twenty-two, and I'm still learning about investing."},
	{id: 'L13', text: "I know that just because a stock drops doesn't mean it's a bargain."},
	{id: 'L14', text: "It could fall even further, but I'm sticking to my long-term investing plan."},
	{id: 'L15', text: 'So what do you think?'},
	{id: 'L16', text: 'Is this a buying opportunity, or is the market about to get even worse?'},
];

export type SceneId = 'hook' | 'damage' | 'election' | 'datacenter' | 'billions' | 'nvidia' | 'pivot' | 'sofi' | 'risk' | 'debate';

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'damage', firstLine: 'L3', transitionFrames: 8}, // match cut: the −5.5% continues into card 1
	{id: 'election', firstLine: 'L4', transitionFrames: 14}, // wipe along the red baseline
	{id: 'datacenter', firstLine: 'L5b', transitionFrames: 16}, // lateral slide: politics → infrastructure
	{id: 'billions', firstLine: 'L6', transitionFrames: 8}, // match cut: same racks, camera pulls back
	{id: 'nvidia', firstLine: 'L8', transitionFrames: 18}, // iris out of the CHIPS node
	{id: 'pivot', firstLine: 'L9', transitionFrames: 8}, // match cut: red bar becomes "panic selling"
	{id: 'sofi', firstLine: 'L11', transitionFrames: 14}, // phone rises from below
	{id: 'risk', firstLine: 'L13', transitionFrames: 14}, // wipe
	{id: 'debate', firstLine: 'L15', transitionFrames: 16}, // dark panel sweep
];

/** Seconds held after the last word (audio ends ~0.37 s after it; video never cuts the voice). */
export const TAIL_SEC = 0.9;
