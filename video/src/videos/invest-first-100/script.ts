import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'InvestFirst100',
	slug: 'invest-first-100',
	title: "How I'd Invest My First $100",
	mode: 'education',
	looks: ['cinematic', 'white', 'white', 'cinematic', 'white', 'cinematic'],
	hookStyle: 'object-metaphor ($100 note split into 70/20/10 on frame 0–4s)',
	signatureMoves: [
		'$100 note slices into proportional 70/20/10 strips that become the chapters',
		'official Vanguard screenshots with zoom + row highlight synced to the spoken word',
		'3,519-dot field: one stock vs. the whole market lights up in a wave',
		'world map lights Japan / Germany / Canada with fact-sheet weights; donut + monthly contributions ending',
	],
};

/** Narration — exactly the words spoken in the ElevenLabs voiceover (forced-aligned). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: "If I had to restart investing with just $100, here's exactly what I'd buy."},
	{id: 'L2', text: "First, I'd put $70 into VTI."},
	{id: 'L3', text: 'This ETF gives me exposure to thousands of U.S. companies, including Apple, Microsoft, and Amazon.'},
	{id: 'L4', text: "So instead of trying to pick the next winning stock, I'm investing in almost the entire U.S. stock market."},
	{id: 'L5', text: "Next, I'd put $20 into SCHD."},
	{id: 'L6', text: 'This ETF focuses on established U.S. companies with a history of paying dividends.'},
	{id: 'L7', text: 'I already get some of these companies through VTI, but I personally like having extra exposure to dividend-paying stocks.'},
	{id: 'L8', text: "And the last $10? I'd put that into VXUS."},
	{id: 'L9', text: "Because I don't want all my money invested in the United States."},
	{id: 'L10', text: 'VXUS gives me exposure to companies in other countries, like Japan, Germany, and Canada.'},
	{id: 'L11', text: "Now, $100 isn't going to make me rich overnight."},
	{id: 'L12', text: 'But starting small and investing consistently over the long term can make a difference.'},
];

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<'hook' | 'vti' | 'market' | 'schd' | 'vxus' | 'final'>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'vti', firstLine: 'L2', transitionFrames: 14}, // iris out of the $70 strip
	{id: 'market', firstLine: 'L4', transitionFrames: 8}, // match cut: logo tiles continue into the dot field
	{id: 'schd', firstLine: 'L5', transitionFrames: 18}, // green chapter sweep
	{id: 'vxus', firstLine: 'L8', transitionFrames: 14}, // slide — travelling abroad
	{id: 'final', firstLine: 'L11', transitionFrames: 14}, // iris from the donut centre
];

/** Seconds held after the last word (brand + final chart). */
export const TAIL_SEC = 3.4; // closing question needs ~3 s to read
