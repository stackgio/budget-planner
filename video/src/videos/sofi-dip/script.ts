import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'SofiDip',
	slug: 'sofi-dip',
	title: 'Everyone Was Panicking. I Bought More.',
	mode: 'personal-journey',
	looks: ['cinematic', 'cinematic', 'cinematic', 'cinematic', 'editorial', 'editorial', 'cinematic', 'cinematic'],
	hookStyle: 'personal claim + real proof by 2.3 s (red crash line freezes, real order rises)',
	signatureMoves: [
		'six-beat story: hook → yesterday → reason → risk → decision → question',
		'real Nasdaq closes freeze under a green BUY; the order confirmation is shown once, in the hook',
		'ticker reveal docks into "WHY SOFI?"; revenue + members (both Q3 2026) in one graphic with real bars',
		'EXAMPLE chart sets up BUY THE DIP? vs WAIT FOR LOWER?; split screen asks it at the end',
	],
};

/**
 * Spoken words of the STORY voice track (public/voice/sofi-dip-story, built by
 * projects/sofi-dip/cut_voice_story.py from the untouched ElevenLabs file).
 * Only change vs. the recording: its first phrase ("The stock market took a
 * massive hit yesterday,") now opens the market-context section, and the
 * bridge "and while" is dropped. Everything else plays in recorded order.
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'some investors were panic-selling,'},
	{id: 'L2', text: 'I did the complete opposite.'},
	{id: 'L3', text: 'I bought more stock.'},
	{id: 'L4', text: 'The stock market took a massive hit yesterday,'},
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

type Id = 'hook' | 'context' | 'opp' | 'reason' | 'learn' | 'risk' | 'decide' | 'ask';
export const SCENES: SceneDef<Id>[] = [
	{id: 'hook', firstLine: 'L1'}, // 1 HOOK — panic line freezes, real order rises
	{id: 'context', firstLine: 'L4', transitionFrames: 12}, // 2 CONTEXT — yesterday's numbers
	{id: 'opp', firstLine: 'L7', transitionFrames: 12}, //   bridge: the red line dims, green lands on Nov 5
	{id: 'reason', firstLine: 'L8', transitionFrames: 14}, // 3 REASON — iris from the green point into the ticker
	{id: 'learn', firstLine: 'L12', transitionFrames: 12}, // 4 RISK (who I am)
	{id: 'risk', firstLine: 'L13', transitionFrames: 10}, //   RISK (the lesson)
	{id: 'decide', firstLine: 'L15', transitionFrames: 12}, // 5 PERSONAL DECISION
	{id: 'ask', firstLine: 'L17', transitionFrames: 12}, // 6 ENDING
];

/** Seconds held after the last word, so the question + disclaimer can be read. */
export const TAIL_SEC = 0.8;
