import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'SignsDoingBetter',
	slug: 'signs-doing-better',
	title: "3 Signs You're Doing Better Financially Than You Think",
	mode: 'education',
	looks: ['cinematic'],
	hookStyle: 'question',
	signatureMoves: [
		'all matte-black cinematic (creator brief): variety from composition, not palette',
		'hidden progress: the hook bar reveals more progress than Marcus thought',
		'interest drags the payoff bar backwards; the jar intercepts the repair bill',
		'one progress path carries the story scene into the ending (match cut)',
	],
};

/** Exactly the approved script = the spoken ElevenLabs narration (local forced alignment). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Think you’re behind financially?'},
	{id: 'L2', text: 'You might actually be doing better than you think.'},
	{id: 'L3', text: "Here are 3 signs you're doing better financially than you realize."},
	{id: 'L4', text: 'First, you’re investing, even if it’s just five dollars at a time.'},
	{id: 'L5', text: 'You’re building a habit for your future.'},
	{id: 'L6', text: 'Second, you’re avoiding high-interest debt, or actively paying it off.'},
	{id: 'L7', text: 'Credit card interest can seriously slow you down.'},
	{id: 'L8', text: 'Third, you’re building an emergency fund, even if you haven’t reached a thousand dollars yet.'},
	{id: 'L9', text: 'That money could keep an unexpected bill from becoming debt.'},
	{id: 'L10', text: 'And bonus, you’re not spending money just to look rich.'},
	{id: 'L11', text: 'I didn’t start taking my finances seriously until I was 21.'},
	{id: 'L12', text: 'So if you’re not doing these things yet, don’t feel behind.'},
	{id: 'L13', text: 'You can start working on them today.'},
];

type Id = 'hook' | 'signs' | 'invest' | 'debt' | 'fund' | 'bonus' | 'story' | 'end';
export const SCENES: SceneDef<Id>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'signs', firstLine: 'L3', transitionFrames: 14}, // slide up: new topic
	{id: 'invest', firstLine: 'L4', transitionFrames: 18}, // card 01 → chapter (green sweep)
	{id: 'debt', firstLine: 'L6', transitionFrames: 16}, // slide: next chapter
	{id: 'fund', firstLine: 'L8', transitionFrames: 18}, // green sweep up
	{id: 'bonus', firstLine: 'L10', transitionFrames: 18}, // iris from the jar
	{id: 'story', firstLine: 'L11', transitionFrames: 16}, // slide
	{id: 'end', firstLine: 'L12', transitionFrames: 10}, // match cut on the path
];

export const TAIL_SEC = 1.8;
