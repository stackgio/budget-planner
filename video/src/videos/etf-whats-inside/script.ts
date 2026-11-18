import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'EtfWhatsInside',
	slug: 'etf-whats-inside',
	title: "4 ETFs: What's the Difference?",
	mode: 'education',
	looks: ['cinematic'],
	hookStyle: 'creator-point (this is X, this is Y, what is the difference?)',
	signatureMoves: [
		'two equal ETF cards that light green only when named (point left / point right)',
		'cards open into baskets that persist and refill for every fund',
		'cards flip in place VOO→QQQM, SCHD→VGT',
		'COSTCO tile pops between the baskets, then snaps into QQQM',
		'2x2 takeaway grid of all four baskets',
	],
};

/** Spoken words from the creator's ElevenLabs voiceover (Scribe transcript — exact). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'This is VOO.'},
	{id: 'L2', text: 'This is SCHD.'},
	{id: 'L3', text: "What's the difference?"},
	{id: 'L4', text: 'Think of an ETF like a basket of stocks.'},
	{id: 'L5', text: 'The difference is what goes in the basket.'},
	{id: 'L6', text: 'VOO gives you a little piece of about five hundred big US companies across industries like tech,'},
	{id: 'L7', text: 'banking, and healthcare.'},
	{id: 'L8', text: 'SCHD focuses on companies with a history of paying dividends.'},
	{id: 'L9', text: "That's cash a company can pay you for owning its stock."},
	{id: 'L10', text: 'Now, this is QQQM.'},
	{id: 'L11', text: 'This is VGT.'},
	{id: 'L12', text: 'Both lean into tech.'},
	{id: 'L13', text: 'So why is Costco in this one?'},
	{id: 'L14', text: 'QQQM follows a list of big companies on the Nasdaq stock exchange.'},
	{id: 'L15', text: 'That list includes tech companies and retailers like Costco.'},
	{id: 'L16', text: 'VGT focuses on information technology.'},
	{id: 'L17', text: 'Think software and computer chips.'},
	{id: 'L18', text: "Costco sells groceries, so it's out."},
	{id: 'L19', text: 'Two ETFs can sound similar.'},
	{id: 'L20', text: "The difference is what's inside."},
];

/** One continuous, transforming scene: the two baskets persist from the hook to the takeaway. */
export const SCENES: SceneDef<'main'>[] = [{id: 'main', firstLine: 'L1'}];

/** Seconds held after the last word — enough to read the 4-card takeaway. */
export const TAIL_SEC = 2.2;
