import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'PaydayFiveThingsV2',
	slug: 'payday-five-things-v2',
	title: '5 Things to Do When You Get Paid (V2)',
	mode: 'education',
	looks: ['desk-topdown', 'matte-black-overlays', 'matte-black-checklist'],
	hookStyle: 'relatable-situation',
	signatureMoves: [
		'top-down desk: phone lands as the title is already on screen',
		'pen circle on RENT DUE, label carried into a SET ASIDE slot',
		'receipt categories carried into one THIS PAYCHECK row',
		'$20 EXAMPLE travels CHECKING → SAVINGS in one arc',
		'two-step card order: both MINIMUM PAID checks, then one EXTRA PAYMENT marker',
		'one bracket = $80 TOTAL across two inserts',
	],
};

/**
 * Narration = the approved ElevenLabs Stack voiceover, exactly as spoken
 * (from public/voice/payday-five-things-v2/script-lines.json). Transcript
 * line L2 is split at the clause boundary into L2 / L2b so the cut into the
 * calendar lands on "before".
 */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Just got paid?'},
	{id: 'L2', text: 'Do these five things'},
	{id: 'L2b', text: 'before that money starts disappearing.'},
	{id: 'L3', text: 'One, check which bills are due before your next paycheck.'},
	{id: 'L4', text: "If rent's due before you get paid again, set that money aside now, so it's there when you need it."},
	{id: 'L5', text: "Two, figure out how much you'll need for gas and groceries till next payday."},
	{id: 'L6', text: 'Look at what you spent last time.'},
	{id: 'L7', text: 'That gives you a number to start with.'},
	{id: 'L8', text: 'Three, move some money into savings on payday.'},
	{id: 'L9', text: "Even if it's 20 bucks, transfer it now."},
	{id: 'L10', text: "It's easy to spend it when it's still sitting in your checking account."},
	{id: 'L11', text: "Four, if you've got credit card debt, cover the minimum on every card."},
	{id: 'L12', text: 'Then put any extra toward the card with the highest interest rate.'},
	{id: 'L13', text: "That's the one charging you the most for every dollar you owe."},
	{id: 'L14', text: 'Five, give yourself a limit for fun money.'},
	{id: 'L15', text: "If you set aside 80 bucks, that's 80 total for eating out, hanging out, whatever, until your next check."},
	{id: 'L16', text: 'Save this and pull it up next payday.'},
];

type Id = 'hook' | 'bills' | 'groceries' | 'savings' | 'cards' | 'fun' | 'end';

/** Clean cuts throughout (transitionFrames 0) — the desk shots read like edited footage. */
export const SCENES: SceneDef<Id>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'bills', firstLine: 'L2b'},
	{id: 'groceries', firstLine: 'L5'},
	{id: 'savings', firstLine: 'L8'},
	{id: 'cards', firstLine: 'L11'},
	{id: 'fun', firstLine: 'L14'},
	{id: 'end', firstLine: 'L16'},
];

/** Hold the finished checklist ~1 s after the voice ends (voice ends 50.99 s). */
export const TAIL_SEC = 1.25;
