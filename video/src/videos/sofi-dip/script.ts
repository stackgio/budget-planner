import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'SofiDip',
	slug: 'sofi-dip',
	title: 'Everyone Was Panicking. I Bought More.',
	mode: 'personal-journey',
	looks: ['cinematic', 'cinematic', 'cinematic', 'cinematic', 'editorial', 'cinematic', 'editorial', 'editorial', 'cinematic', 'cinematic'],
	hookStyle: 'bold-claim over a real market crash line (black, red, frame-0 text)',
	signatureMoves: [
		'real Nasdaq closes (Oct 6 → Nov 5, 2026) draw down, freeze, and take a green BUY marker',
		'quarterly revenue bars morph into member bars (real SoFi Q3 2024–Q3 2026 data)',
		'real order confirmation as hero proof, rows lifted out into chips',
		'Marcus at the laptop → camera push into an EXAMPLE chart that keeps falling',
		'split-screen audience decision (green vs red)',
	],
};

/** Spoken words (forced-aligned to the ElevenLabs voiceover). Numbers are written as shown on screen. */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'The stock market took a massive hit yesterday,'},
	{id: 'L2', text: 'and while some investors were panic-selling,'},
	{id: 'L3', text: 'I did the complete opposite.'},
	{id: 'L4', text: 'I bought more stock.'},
	{id: 'L5', text: 'The Nasdaq dropped 5.5%,'},
	{id: 'L6', text: 'and the S&P 500 fell over 4%.'},
	{id: 'L7', text: 'But instead of panicking, I saw an opportunity.'},
	{id: 'L8', text: 'I bought more SoFi stock.'},
	{id: 'L9', text: 'Why?'},
	{id: 'L10', text: 'Because SoFi just reported record quarterly revenue of $1.4 billion'},
	{id: 'L11', text: 'and reached over 17 million members.'},
	{id: 'L12', text: "Now, I'm only 22, and I'm still learning about investing."},
	{id: 'L13', text: "I know just because a stock drops doesn't mean it's a good deal."},
	{id: 'L14', text: 'It could fall even further.'},
	{id: 'L15', text: "But I believe in SoFi's long-term potential,"},
	{id: 'L16', text: 'so I decided to buy more.'},
	{id: 'L17', text: 'Would you buy this dip,'},
	{id: 'L18', text: 'or wait for an even bigger drop?'},
	{id: 'L19', text: "This isn't financial advice."},
	{id: 'L20', text: 'Always do your own research.'},
];

type Id = 'panic' | 'opposite' | 'numbers' | 'opp' | 'sofi' | 'why' | 'learn' | 'risk' | 'convict' | 'ask';
export const SCENES: SceneDef<Id>[] = [
	{id: 'panic', firstLine: 'L1'},
	{id: 'opposite', firstLine: 'L3', transitionFrames: 6}, // match cut: same chart freezes
	{id: 'numbers', firstLine: 'L5', transitionFrames: 12}, // slide up into the data
	{id: 'opp', firstLine: 'L7', transitionFrames: 12}, // wipe
	{id: 'sofi', firstLine: 'L8', transitionFrames: 16}, // green panel sweep = the decision
	{id: 'why', firstLine: 'L10', transitionFrames: 14}, // iris from the ticker
	{id: 'learn', firstLine: 'L12', transitionFrames: 16}, // panel sweep (cream) — personal chapter
	{id: 'risk', firstLine: 'L13', transitionFrames: 8}, // match cut through the laptop screen
	{id: 'convict', firstLine: 'L15', transitionFrames: 14}, // slide
	{id: 'ask', firstLine: 'L17', transitionFrames: 12}, // wipe to split screen
];

/** Seconds held after the last word (just enough to read the question + disclaimer). */
export const TAIL_SEC = 1.0;
