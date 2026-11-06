import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'SofiDip',
	slug: 'sofi-dip',
	title: 'Everyone Was Panicking. I Bought More.',
	mode: 'personal-journey',
	looks: ['cinematic', 'cinematic', 'cinematic', 'editorial', 'editorial', 'cinematic', 'cinematic'],
	hookStyle: 'personal bold claim + real proof by 2.3 s (red crash line freezes, real order rises)',
	signatureMoves: [
		'real Nasdaq closes freeze and take a green BUY marker; the real order confirmation rises over them',
		'one combined stat graphic: $1.4B revenue + 17.1M members, each with real 9-quarter bars',
		'EXAMPLE chart sets up BUY THE DIP? vs WAIT FOR LOWER? early; split screen asks it at the end',
		'Marcus at the laptop framed tight (no empty paper)',
	],
};

/**
 * Spoken words of the CUT voice track (public/voice/sofi-dip-cut, built by
 * projects/sofi-dip/cut_voice.py from the untouched ElevenLabs file). Numbers
 * are written as shown on screen.
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'some investors were panic-selling,'},
	{id: 'L2', text: 'I did the complete opposite.'},
	{id: 'L3', text: 'I bought more SoFi stock.'},
	{id: 'L4', text: 'The Nasdaq dropped 5.5%,'},
	{id: 'L5', text: 'and the S&P 500 fell over 4%.'},
	{id: 'L6', text: 'Why?'},
	{id: 'L7', text: 'Because SoFi just reported record quarterly revenue of $1.4 billion'},
	{id: 'L8', text: 'and reached over 17 million members.'},
	{id: 'L9', text: "Now, I'm only 22, and I'm still learning about investing."},
	{id: 'L10', text: "I know just because a stock drops doesn't mean it's a good deal."},
	{id: 'L11', text: 'It could fall even further.'},
	{id: 'L12', text: "But I believe in SoFi's long-term potential,"},
	{id: 'L13', text: 'Would you buy this dip,'},
	{id: 'L14', text: 'or wait for an even bigger drop?'},
	{id: 'L15', text: "This isn't financial advice."},
	{id: 'L16', text: 'Always do your own research.'},
];

type Id = 'hook' | 'numbers' | 'why' | 'learn' | 'risk' | 'convict' | 'ask';
export const SCENES: SceneDef<Id>[] = [
	{id: 'hook', firstLine: 'L1'}, // chart → freeze + BUY → real order by ~2.3 s
	{id: 'numbers', firstLine: 'L4', transitionFrames: 10}, // slide up into the data
	{id: 'why', firstLine: 'L6', transitionFrames: 10}, // wipe
	{id: 'learn', firstLine: 'L9', transitionFrames: 10}, // cream panel sweep — personal chapter
	{id: 'risk', firstLine: 'L10', transitionFrames: 8}, // quick slide from the laptop
	{id: 'convict', firstLine: 'L12', transitionFrames: 10}, // slide back to the order
	{id: 'ask', firstLine: 'L13', transitionFrames: 10}, // wipe to split screen
];

/** Seconds held after the last word (just enough to read the question + disclaimer). */
export const TAIL_SEC = 0.8;
