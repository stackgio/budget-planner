import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import '../fonts';
import {Captions, cue, type CaptionCue} from './Caption';
import {S01Hook} from './scenes/S01Hook';
import {S02FlatTire} from './scenes/S02FlatTire';
import {S03RepairShop} from './scenes/S03RepairShop';
import {S04ExpenseStack} from './scenes/S04ExpenseStack';
import {S05Blocked} from './scenes/S05Blocked';
import {S06DebtGoalTimeline} from './scenes/S06DebtGoalTimeline';
import {S07PlanToFund} from './scenes/S07PlanToFund';
import {S09SavingsComparison} from './scenes/S09SavingsComparison';
import {S10DebtMilestone} from './scenes/S10DebtMilestone';
import {S11Comments} from './scenes/S11Comments';
import {Backdrop, Vignette, Watermark} from './Stage';
import {C} from './theme';
import {SCENES, VO, s} from './timing';

const seq = (k: keyof typeof SCENES) => ({from: SCENES[k][0], durationInFrames: SCENES[k][1] - SCENES[k][0]});
const end = (k: keyof typeof SCENES, pad = 2) => SCENES[k][1] - pad;

/** On-screen text, timed to the spoken words. */
const CUES: CaptionCue[] = [
	{from: -14, to: VO.everything, lines: [cue('PAYING OFF DEBT…')]},
	{from: VO.everything, to: end('hook', 6), lines: [cue('*EVERYTHING*', C.red), cue('BREAKS.')], style: 'slam', size: 104},
	{from: VO.tire, to: end('tire'), lines: [cue('FLAT TIRE')]},
	{from: VO.car, to: end('shop'), lines: [cue('CAR REPAIRS')]},
	{from: VO.billRandom - 4, to: SCENES.blocked[0], lines: [cue('ANOTHER *BILL?!*', C.red)], size: 90},
	{from: s(10.12), to: VO.notCollect - 2, lines: [cue("I'M TRYING TO"), cue('GET *OUT!*')], size: 86},
	{from: VO.notCollect, to: end('blocked', 8), lines: [cue('NOT ADD *MORE!*', C.red)], size: 92},
	{from: VO.age, to: end('goal', 4), lines: [cue('22 YEARS OLD')], y: 270, size: 60, color: C.gray, letterSpacing: 1},
	{from: VO.goal, to: end('goal', 4), lines: [cue('GOAL: DEBT FREE'), cue('BY *2027*')], y: 350, size: 80},
	{from: VO.lifeDoesnt, to: VO.thatsWhy - 6, lines: [cue("LIFE DOESN'T CARE"), cue('ABOUT YOUR *PLAN.*', C.red)], size: 76},
	{from: VO.emergencyFund - 2, to: end('plan', 4), lines: [cue('*EMERGENCY FUND*')], size: 90},
	{from: VO.emergencyFund + 8, to: end('plan', 4), lines: [cue('YOUR FINANCIAL BUFFER')], y: 410, size: 50, letterSpacing: 1},
	{from: VO.saved, to: end('savings', 6), lines: [cue('*$500–$1,000* SAVED')], size: 82},
	{from: VO.without, to: end('savings', 6), lines: [cue('LESS NEED TO *BORROW*')], y: 400, size: 60},
	{from: VO.because, to: VO.staying - 3, lines: [cue('PAYING OFF DEBT')], size: 84},
	{from: VO.staying, to: end('milestone', 4), lines: [cue('*STAYING* DEBT FREE')], size: 84, style: 'slam'},
	{from: VO.realGoal, to: end('milestone', 4), lines: [cue("THAT'S THE REAL GOAL.")], y: 400, size: 62},
	{from: VO.whats, to: SCENES.cta[1] + 10, lines: [cue('WHAT ALWAYS *BREAKS*', C.red), cue('YOUR BUDGET?')], size: 72},
];

/** Subtle effects, kept well under the narration. */
const SFX: [number, string, number][] = [
	[VO.everything, 'alert', 0.35],
	[128, 'whoosh', 0.22],
	[141, 'hiss', 0.22],
	[155, 'pop', 0.25],
	[170, 'whoosh', 0.18],
	[188, 'pop', 0.25],
	[206, 'whoosh', 0.28],
	...[222, 234, 247, 253, 263, 269].map((f) => [f, 'paper', 0.45] as [number, string, number]),
	[233, 'ping', 0.22],
	[250, 'ping', 0.2],
	[268, 'whoosh', 0.28],
	[287, 'thud', 0.55],
	[361, 'paper', 0.4],
	[369, 'paper', 0.4],
	[558, 'thud', 0.45],
	[632, 'pop', 0.18],
	[VO.handle, 'pop', 0.22],
	[888, 'confirm', 0.3],
	[VO.creditCard + 2, 'pop', 0.16],
	[VO.realGoal, 'chime', 0.3],
	...[1106, 1112, 1118].map((f) => [f, 'pop', 0.12] as [number, string, number]),
];

export const DebtStory: React.FC = () => (
	<AbsoluteFill style={{background: C.bg}}>
		<Backdrop />
		<Sequence {...seq('hook')} name="1 Hook">
			<S01Hook />
		</Sequence>
		<Sequence {...seq('tire')} name="2 Flat tire">
			<S02FlatTire />
		</Sequence>
		<Sequence {...seq('shop')} name="3 Repair shop">
			<S03RepairShop />
		</Sequence>
		<Sequence {...seq('bills')} name="4 Another bill">
			<S04ExpenseStack />
		</Sequence>
		<Sequence {...seq('blocked')} name="5 Frustration">
			<S05Blocked />
		</Sequence>
		<Sequence {...seq('goal')} name="6 Goal 2027">
			<S06DebtGoalTimeline />
		</Sequence>
		<Sequence {...seq('plan')} name="7-8 Plan → emergency fund">
			<S07PlanToFund />
		</Sequence>
		<Sequence {...seq('savings')} name="9 $500 / $1,000">
			<S09SavingsComparison />
		</Sequence>
		<Sequence {...seq('milestone')} name="10 Stay out of debt">
			<S10DebtMilestone />
		</Sequence>
		<Sequence {...seq('cta')} name="11 Comments">
			<S11Comments />
		</Sequence>
		<Vignette amt={0.55} />
		<Captions cues={CUES} />
		<Watermark />
		<Audio src={staticFile('debt-story/narration.mp3')} />
		{SFX.map(([f, name, vol], i) => (
			<Sequence key={i} from={f} durationInFrames={36} name={`sfx ${name}`}>
				<Audio src={staticFile(`debt-story/sfx/${name}.wav`)} volume={vol} />
			</Sequence>
		))}
	</AbsoluteFill>
);
