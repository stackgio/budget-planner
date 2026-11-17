import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'FiveEtfsForBeginners',
	slug: 'etfs-for-beginners',
	title: '5 ETFs for Beginners',
	mode: 'education',
	looks: ['cinematic'],
	hookStyle: 'question + title card (big green 5, five tickers on frame 0)',
	signatureMoves: [
		'one fund-card system carries the whole video (basket → VOO → VTI → mini cards)',
		'VOO card expands into VTI around Apple/Microsoft tiles that never move',
		'dot-matrix world map: zoom out from the U.S. for VT, U.S. dims for VXUS',
		'payoff: Apple + Microsoft light up inside VOO, VTI and VT at once',
	],
};

/** Narration exactly as spoken in the ElevenLabs voiceover (voice.py transcribe). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'New to investing?'},
	{id: 'L2', text: "Here are five ETFs to know and what you're actually buying with each one."},
	{id: 'L3', text: 'Think of an ETF like a basket.'},
	{id: 'L4', text: 'You buy one fund, and that fund holds a bunch of stocks.'},
	{id: 'L5', text: "Here's what's inside each one."},
	{id: 'L6', text: 'First, VOO.'},
	{id: 'L7', text: 'This is one I own.'},
	{id: 'L8', text: 'It holds about five hundred big US companies.'},
	{id: 'L9', text: 'So you get a piece of companies like Apple and Microsoft in one purchase.'},
	{id: 'L10', text: "Then there's VTI."},
	{id: 'L11', text: 'You still get Apple and Microsoft, plus a bunch of smaller companies.'},
	{id: 'L12', text: 'It covers almost the entire US stock market.'},
	{id: 'L13', text: 'VT takes it worldwide.'},
	{id: 'L14', text: 'It has US companies and companies from other countries all in one fund.'},
	{id: 'L15', text: 'VXUS is the overseas part.'},
	{id: 'L16', text: "If you already own VOO and want to add companies outside the US, that's what VXUS can do."},
	{id: 'L17', text: 'And SCHD focuses on US companies that pay dividends.'},
	{id: 'L18', text: 'A dividend is a cash payment you can receive for owning shares.'},
	{id: 'L19', text: 'The amount can change.'},
	{id: 'L20', text: 'So do you need all five?'},
	{id: 'L21', text: 'VOO, VTI, and VT already hold a lot of the same big US companies.'},
	{id: 'L22', text: "If I wanted one fund for US and international stocks, I'd look at VT first."},
	{id: 'L23', text: "This is for education only and isn't financial advice."},
	{id: 'L24', text: "Save this for when you're comparing your first ETF."},
];

export type SceneId = 'hook' | 'basket' | 'us' | 'world' | 'schd' | 'payoff' | 'end';

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'basket', firstLine: 'L3', transitionFrames: 12}, // slide up: new idea (the basket)
	{id: 'us', firstLine: 'L6', transitionFrames: 6}, // match cut: same card, ETF → VOO
	{id: 'world', firstLine: 'L13', transitionFrames: 16}, // iris opens on the U.S.
	{id: 'schd', firstLine: 'L17', transitionFrames: 14}, // slide: new fund
	{id: 'payoff', firstLine: 'L20', transitionFrames: 8}, // short dissolve to the comparison
	{id: 'end', firstLine: 'L23', transitionFrames: 12}, // slide up to the end card
];

/** Seconds held after the last word so the five-fund recap can be read. */
export const TAIL_SEC = 4.6;
