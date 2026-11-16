import type {VideoMeta} from '../../story/lib/meta';
import type {ScriptLine} from '../../story/lib/narration';
import type {SceneDef} from '../../story/lib/sceneTimeline';

export const META: VideoMeta = {
	compositionId: 'SaveFirst10k',
	slug: 'save-first-10k',
	title: 'Save Your First $10,000',
	mode: 'education',
	looks: ['vault (matte black #0B0F0D + #39FF88, creator brief)'],
	hookStyle: 'surprising-number (full-bleed $10,000 → $1,000 reframe)',
	signatureMoves: [
		'one $10,000 goal bar carries the story: hook → extra income → payoff → CTA',
		'100-cell week grid: each cell = one $100 deposit, 52 cells = $5,200, 100 cells = $10,000',
		'premium fintech panels (paycheck slider, auto-transfer sheet, spending bars) instead of Marcus',
		'depth-push / match-cut / iris transitions, no fades',
	],
};

/** Spoken words (ElevenLabs Scribe transcript of the creator's "stack voice" file). */
export const SCRIPT: ScriptLine[] = [
	{id: 'L1', text: 'Trying to save your first $10,000?'},
	{id: 'L2', text: 'Stop worrying about $10,000.'},
	{id: 'L3', text: 'Focus on your first $1,000.'},
	{id: 'L4', text: "Here are four things I'd do, starting with my next paycheck."},
	{id: 'L5', text: 'Number one: Pick an amount you can actually afford to save.'},
	{id: 'L6', text: "If you save $100 a week, that's $5,200 in one year."},
	{id: 'L7', text: "Keep that up, and you'll reach $10,000 in less than two years."},
	{id: 'L8', text: "Can't afford $100?"},
	{id: 'L9', text: 'Start with $25.'},
	{id: 'L10', text: 'The important thing is building the habit.'},
	{id: 'L11', text: 'Number two: Open a high-yield savings account.'},
	{id: 'L12', text: 'Keep your savings separate from your spending money, and set up automatic transfers every payday.'},
	{id: 'L13', text: 'Number three: Look at your last 30 days of spending.'},
	{id: 'L14', text: 'Find two or three things you can cut back on.'},
	{id: 'L15', text: "You don't have to stop enjoying life just to save money."},
	{id: 'L16', text: 'Number four: Give your extra income a purpose.'},
	{id: 'L17', text: 'Overtime, side hustles, bonuses,'},
	{id: 'L18', text: 'before you spend it all, put some toward your $10,000 goal.'},
	{id: 'L19', text: "And remember, your first $10,000 isn't built in one paycheck."},
	{id: 'L20', text: "It's built by what you consistently do with every paycheck."},
	{id: 'L21', text: 'Save this video and start working toward your first $1,000.'},
];

export type SceneId = 'hook' | 'promise' | 'afford' | 'habit' | 'hysa' | 'review' | 'extra' | 'payoff' | 'cta';

/** Scenes start on these lines; `transitionFrames` is the transition INTO the scene. */
export const SCENES: SceneDef<SceneId>[] = [
	{id: 'hook', firstLine: 'L1'},
	{id: 'promise', firstLine: 'L4', transitionFrames: 16}, // slide up: the goal bar hands off to the plan
	{id: 'afford', firstLine: 'L5', transitionFrames: 14}, // depth push into card 01
	{id: 'habit', firstLine: 'L8', transitionFrames: 8}, // match cut: same chip, same grid
	{id: 'hysa', firstLine: 'L11', transitionFrames: 16}, // slide left: new step
	{id: 'review', firstLine: 'L13', transitionFrames: 14}, // depth push
	{id: 'extra', firstLine: 'L16', transitionFrames: 16}, // slide left: new step
	{id: 'payoff', firstLine: 'L19', transitionFrames: 20}, // iris from the goal bar
	{id: 'cta', firstLine: 'L21', transitionFrames: 8}, // match cut: same counter + bar
];

/** Seconds held after the last word: enough for the brand frame to settle, no long outro. */
export const TAIL_SEC = 1.3;
