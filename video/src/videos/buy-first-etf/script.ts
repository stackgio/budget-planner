import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'BuyFirstEtf',
	slug: 'buy-first-etf',
	title: 'How to Buy Your First ETF — Step by Step',
	mode: 'education',
	looks: ['cinematic', 'cinematic', 'white', 'cinematic', 'cinematic', 'cinematic'],
	hookStyle: 'screenshot-first (real $10.01 order preview)',
	signatureMoves: [
		'real Robinhood recording retimed to the voice — every tap lands on its word',
		'persistent STEP header so viewers can follow with their app open',
		'500-square S&P 500 grid with Apple + Microsoft called out',
		'one continuous phone take from Search to Order queued',
	],
};

/** Exactly as spoken in the final ElevenLabs voiceover (voice.py transcribe, Scribe). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: "Here's how to buy your first ETF step by step."}, // 0.08-2.92s
	{id: 'L2', text: "I'm gonna show you exactly what I tap to place my ten dollar order."}, // 3.30-6.46s
	{id: 'L3', text: 'First, pick a brokerage.'}, // 6.94-8.20s
	{id: 'L4', text: 'You can use Robinhood, Fidelity, or Vanguard.'}, // 8.62-11.14s
	{id: 'L5', text: "I use Robinhood, so that's what you're seeing on my screen."}, // 11.58-13.96s
	{id: 'L6', text: 'Once your account is open, go to the home screen and tap buying power.'}, // 14.40-17.96s
	{id: 'L7', text: 'Tap add money.'}, // 18.42-19.32s
	{id: 'L8', text: "Enter how much you wanna transfer, and link your bank if you haven't already."}, // 19.64-22.80s
	{id: 'L9', text: 'Then review the transfer and confirm it.'}, // 23.22-25.20s
	{id: 'L10', text: 'Once the money is available to invest, tap search.'}, // 25.58-28.30s
	{id: 'L11', text: 'VOO, SPY, IVV, and SPYM are four ETFs that track the S&P 500.'}, // 28.84-36.02s
	{id: 'L12', text: 'Think of the S&P 500 like a list of about 500 big US companies like Apple and Microsoft.'}, // 36.40-42.16s
	{id: 'L13', text: 'One ETF can give you exposure to those companies in a single purchase.'}, // 42.78-46.38s
	{id: 'L14', text: 'You can pick any one of those four to get exposure to the same index.'}, // 46.82-50.30s
	{id: 'L15', text: "I'm using VOO for this example."}, // 50.74-52.54s
	{id: 'L16', text: 'So boom.'}, // 53.04-53.92s
	{id: 'L17', text: 'I search VOO, open the Vanguard S&P 500 ETF, then tap trade and buy.'}, // 54.42-60.54s
	{id: 'L18', text: 'I entered a fraction of a share.'}, // 61.00-62.34s
	{id: 'L19', text: 'See that estimated cost right there?'}, // 62.78-64.14s
	{id: 'L20', text: 'Mine came out to ten dollars and one cent.'}, // 64.62-66.80s
	{id: 'L21', text: 'I double-checked the amount and the account, then swiped up to submit.'}, // 67.36-70.48s
	{id: 'L22', text: 'See where it says order queued?'}, // 70.98-72.40s
	{id: 'L23', text: 'Mine was waiting for the market to open.'}, // 72.86-74.44s
	{id: 'L24', text: "Once the order fills, that's when I own that fraction of a share."}, // 74.86-77.90s
	{id: 'L25', text: 'If you wanna keep investing, you can set up a recurring buy every week or every month for an amount that fits your budget.'}, // 78.34-84.06s
	{id: 'L26', text: "And real quick, I'm not a financial advisor."}, // 84.46-86.70s
	{id: 'L27', text: "I'm showing you what I did."}, // 87.06-88.30s
	{id: 'L28', text: 'Always do your own research before you buy anything.'}, // 88.78-91.48s
	{id: 'L29', text: "Save this for when you're ready to place your first order, and send it to that friend who keeps asking,"}, // 91.98-96.28s
	{id: 'L30', text: '"How do I start investing?"'}, // 96.56-97.68s
];

export type SceneId = 'hook' | 'fund' | 'sp500' | 'order' | 'recurring' | 'end';
/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'fund', firstLine: 'L3', transitionFrames: 12},
	{id: 'sp500', firstLine: 'L11', transitionFrames: 16},
	{id: 'order', firstLine: 'L16', transitionFrames: 18},
	{id: 'recurring', firstLine: 'L25', transitionFrames: 14},
	{id: 'end', firstLine: 'L26', transitionFrames: 12},
];

/** Seconds held after the last word. */
export const TAIL_SEC = 1.2;
