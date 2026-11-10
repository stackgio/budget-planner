import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'RentVsBuy',
	slug: 'rent-vs-buy',
	title: "Why I'd Rather Rent Right Now",
	mode: 'education',
	looks: ['cinematic', 'editorial', 'cinematic-amber', 'white', 'editorial', 'dot-grid'],
	hookStyle: 'surprising number on frame 0 ($5,000 AC BILL) → relatable situation',
	signatureMoves: [
		'$5,000 AC BILL readable on frame 0; thermostat dies on "boom"; punch-in on the amount',
		'key turn match-cuts to the thermostat dial; cool → amber July grade',
		'$5,000 estimate card travels hook → owner line → closing question → center ending card',
		'three tilted cards fan out on a dotted grid for the final choice',
	],
};

/** No pre-roll: the video opens on the narration's first word ("Imagine", 0.08 s). */
export const INTRO_FRAMES = 0;

/** Exactly as spoken in public/voice/rent-vs-buy (ElevenLabs Scribe word timestamps). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Imagine buying your first house and six months later, boom, five thousand dollars for a new AC.'},
	{id: 'L2', text: 'The first thing our parents be telling us as soon as we graduate and start working is,'},
	{id: 'L3', text: '"You need to stop throwing your money away on rent and start saving to buy a house."'},
	{id: 'L4', text: "That's the first thing they be telling us."},
	{id: 'L5', text: 'They don\'t tell us, "Hey, open a Roth IRA and start investing."'},
	{id: 'L6', text: "They don't teach us about credit or how to manage our money, but they gon' tell you,"},
	{id: 'L7', text: '"You need to stop renting and buy that house."'},
	{id: 'L8', text: "Can I learn how to budget my first paycheck before y'all put me on a thirty-year payment plan?"},
	{id: 'L9', text: 'So boom, you get your credit right, the bank approves you, and you finally get the keys.'},
	{id: 'L10', text: 'Six months later, in the middle of July, your AC goes out.'},
	{id: 'L11', text: "If you're renting and that repair is on your landlord, you call them to get it fixed."},
	{id: 'L12', text: 'If you own the house, you call the AC company, and that five thousand dollar bill has your name on it.'},
	{id: 'L13', text: "And if buying the house wiped out your savings, man, you're cooked, in Florida with no AC."},
	{id: 'L14', text: 'Then somebody says, "But you\'re building equity."'},
	{id: 'L15', text: "And they're right."},
	{id: 'L16', text: 'Equity is what your house is worth minus what you still owe.'},
	{id: 'L17', text: 'But early on, a lot of your mortgage payment can go to interest.'},
	{id: 'L18', text: 'So if you buy for three hundred grand and sell for four hundred, you still gotta count the interest,'},
	{id: 'L19', text: 'repairs, and fees before you call that whole hundred grand profit.'},
	{id: 'L20', text: 'And even after you pay off the mortgage, the property tax bill still comes.'},
	{id: 'L21', text: 'In Florida, leave those taxes unpaid long enough, and your house can actually be auctioned off.'},
	{id: 'L22', text: "Me personally, I'd rather rent right now, stack my money, invest some of it, and give myself room to move."},
	{id: 'L23', text: 'If buying is your goal, do the math.'},
	{id: 'L24', text: 'Do you actually want to stay in that neighborhood?'},
	{id: 'L25', text: 'And after you get the keys, can you still afford what breaks?'},
	{id: 'L26', text: 'Be real.'},
	{id: 'L27', text: 'If you had the down payment today, are you buying or stacking that money a little longer?'},
];

export type SceneId = 'hook' | 'parents' | 'paycheck' | 'keys' | 'july' | 'outcomes' | 'cooked' | 'equity' | 'gain' | 'tax' | 'decision' | 'end';

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene (0 = hard cut). */
export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'parents', firstLine: 'L2', transitionFrames: 18},
	{id: 'paycheck', firstLine: 'L8', transitionFrames: 12},
	{id: 'keys', firstLine: 'L9', transitionFrames: 10},
	{id: 'july', firstLine: 'L10', transitionFrames: 8},
	{id: 'outcomes', firstLine: 'L11', transitionFrames: 12},
	{id: 'cooked', firstLine: 'L13', transitionFrames: 0},
	{id: 'equity', firstLine: 'L14', transitionFrames: 18},
	{id: 'gain', firstLine: 'L18', transitionFrames: 12},
	{id: 'tax', firstLine: 'L20', transitionFrames: 14},
	{id: 'decision', firstLine: 'L22', transitionFrames: 18},
	{id: 'end', firstLine: 'L26', transitionFrames: 8},
];

/** Seconds held after the last word ("longer?"): settle + ~1 s hold, then a clean cut. */
export const TAIL_SEC = 1.05;
