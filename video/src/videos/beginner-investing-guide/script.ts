import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'BeginnerInvestingGuide',
	slug: 'beginner-investing-guide',
	title: 'The Complete Beginner Investing Guide',
	mode: 'education',
	looks: ['brand-dark (#080B09 / #39FF14)', 'screenshot-first'],
	hookStyle: 'screenshot-first bold claim ("start investing from $10" over the real order screen)',
	signatureMoves: [
		'real Robinhood recording re-timed to the narration (holds / fast-forward) with privacy masks',
		'numbered step rail 01–07 that every chapter re-uses',
		'ticker tiles fly from "what do I buy?" into the ETF basket (continuity)',
		'real dividend screenshot → reinvestment flow chain with the exact figures',
	],
};

/**
 * Narration, as SPOKEN in the ElevenLabs voiceover (from voice.py transcribe).
 * Two transcription spellings are corrected for captions only (alignment.captions.json):
 * "Geo" → "Gio", "twenty-two" → "22". The audio itself is untouched.
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: "If I had to start investing from zero today, here's exactly how I'd do it."},
	{id: 'L2', text: "Now, I'm not a financial advisor."},
	{id: 'L3', text: "I'm just sharing what I've learned from my own investing journey."},
	{id: 'L4', text: 'First, you need an investing app.'},
	{id: 'L5', text: 'Some popular options are Fidelity, Charles Schwab, and Robinhood.'},
	{id: 'L6', text: "I personally use Robinhood, so that's what I'll show you."},
	{id: 'L7', text: 'Next, you need to choose your account.'},
	{id: 'L8', text: 'A regular brokerage account gives you more flexibility to access your money, although taxes may apply when you sell investments for a profit.'},
	{id: 'L9', text: 'A Roth IRA is designed for retirement.'},
	{id: 'L10', text: 'Your investments can grow tax-free, and qualified withdrawals are tax-free too.'},
	{id: 'L11', text: 'But there are contribution and withdrawal rules.'},
	{id: 'L12', text: "Once you've chosen your account, connect your bank and deposit some money."},
	{id: 'L13', text: "Now, here's where most beginners get stuck."},
	{id: 'L14', text: 'What should you actually buy?'},
	{id: 'L15', text: 'Instead of trying to pick the next Apple or NVIDIA, you can start by researching ETFs.'},
	{id: 'L16', text: 'Think of an ETF like a basket holding a bunch of different investments.'},
	{id: 'L17', text: 'For example, I personally own VOO.'},
	{id: 'L18', text: 'It tracks the S&P 500, giving me exposure to around 500 major American companies.'},
	{id: 'L19', text: "And here's the cool part: You don't need hundreds of dollars to get started."},
	{id: 'L20', text: 'On Robinhood, you can search VOO, tap Trade, select Buy, and enter just ten dollars.'},
	{id: 'L21', text: 'Review your order, submit it, and now you own a small fraction of that ETF.'},
	{id: 'L22', text: 'But buying your first investment is only the beginning.'},
	{id: 'L23', text: 'You can also turn on dividend reinvestment, so eligible dividends automatically buy more shares.'},
	{id: 'L24', text: 'And from there, focus on consistency.'},
	{id: 'L25', text: "Whether it's five, ten, or twenty dollars each paycheck, the goal is to build a habit you can maintain."},
	{id: 'L26', text: 'Just remember, investing involves risk, and your investments can lose value.'},
	{id: 'L27', text: 'Make sure your bills and emergency savings are taken care of first.'},
	{id: 'L28', text: "I'm only 22, and I'm still learning about investing myself."},
	{id: 'L29', text: "Follow Stack with Gio, and let's learn how to build wealth together"},
];

export type SceneId = 'hook' | 'intro' | 'apps' | 'account' | 'bank' | 'stuck' | 'etf' | 'voo' | 'fraction' | 'buy' | 'dividend' | 'habit' | 'risk' | 'end';

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'intro', firstLine: 'L2', transitionFrames: 12},
	{id: 'apps', firstLine: 'L4', transitionFrames: 16},
	{id: 'account', firstLine: 'L7', transitionFrames: 14},
	{id: 'bank', firstLine: 'L12', transitionFrames: 16},
	{id: 'stuck', firstLine: 'L13', transitionFrames: 12},
	{id: 'etf', firstLine: 'L16', transitionFrames: 8},
	{id: 'voo', firstLine: 'L17', transitionFrames: 16},
	{id: 'fraction', firstLine: 'L19', transitionFrames: 14},
	{id: 'buy', firstLine: 'L20', transitionFrames: 10},
	{id: 'dividend', firstLine: 'L22', transitionFrames: 18},
	{id: 'habit', firstLine: 'L24', transitionFrames: 14},
	{id: 'risk', firstLine: 'L26', transitionFrames: 12},
	{id: 'end', firstLine: 'L28', transitionFrames: 18},
];

/** Seconds held after the last word. */
export const TAIL_SEC = 1.8;
