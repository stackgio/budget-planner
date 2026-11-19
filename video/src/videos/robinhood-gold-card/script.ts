import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'RobinhoodGoldCard',
	slug: 'robinhood-gold-card',
	title: 'This credit card pays me to invest',
	mode: 'personal-journey',
	looks: ['cinematic', 'cinematic', 'cinematic', 'cinematic', 'cinematic', 'cinematic'],
	hookStyle: 'bold-claim',
	signatureMoves: [
		'screenshot-first open: real Gold Card pull-back reveals the heading (balance cropped out)',
		'vertical rewards-math stack, each figure lands on its spoken word',
		'labelled EXAMPLE $10 chip arcs across the real Cash back screen',
		'Marcus match-cut from the pay-in-full beat into the ending question',
	],
};

/** Exactly as spoken in the ElevenLabs voiceover (voice.py transcribe, Scribe word timestamps). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'This credit card pays me to invest, and I finally got approved for it.'},
	{id: 'L2', text: "It's the Robinhood Gold Card."},
	{id: 'L3', text: "And let me tell you, as someone who's addicted to investing, this is the best credit card I could have."},
	{id: 'L4', text: 'I spend around two thousand five hundred dollars a month on bills and everyday stuff.'},
	{id: 'L5', text: "At three percent cashback on that spending, I'm looking at about seventy-five dollars a month."},
	{id: 'L6', text: "That's around nine hundred dollars a year before the Gold Membership cost."},
	{id: 'L7', text: "Now, here's how I actually get that money into my portfolio."},
	{id: 'L8', text: 'When I use the card, I earn points.'},
	{id: 'L9', text: 'I can go into the Rewards tab, turn those points into cash, and send it to my Robinhood investing account.'},
	{id: 'L10', text: 'From there, I can use that cash to buy stocks or ETFs.'},
	{id: 'L11', text: 'Me?'},
	{id: 'L12', text: "I'm putting mine straight into more ETFs."},
	{id: 'L13', text: "I'm sticking to my regular spending and paying the card off in full every month."},
	{id: 'L14', text: "Once my first statement comes in, I'll show you how much I actually earned."},
	{id: 'L15', text: 'If you have the Gold Card, are you spending your points or investing them?'},
];

type Id = 'hook' | 'math' | 'bridge' | 'redeem' | 'plan' | 'end';
export const SCENES: SceneDef<Id>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'math', firstLine: 'L4', transitionFrames: 18},
	{id: 'bridge', firstLine: 'L7', transitionFrames: 16},
	{id: 'redeem', firstLine: 'L9', transitionFrames: 0}, // hard cut on "I can go into the Rewards tab"
	{id: 'plan', firstLine: 'L13', transitionFrames: 14},
	{id: 'end', firstLine: 'L14', transitionFrames: 8},
];

export const TAIL_SEC = 1.4;
