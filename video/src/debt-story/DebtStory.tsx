import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
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
import {SCENES, VO} from './timing';
import {tw} from './anim';
import {STAGE_SHIFT} from './layout';
import {Subtitles} from './Subtitles';

const seq = (k: keyof typeof SCENES) => ({from: SCENES[k][0], durationInFrames: SCENES[k][1] - SCENES[k][0]});
const end = (k: keyof typeof SCENES, pad = 2) => SCENES[k][1] - pad;

/** Headline titles (screen space, top band). Narration itself is in the bottom subtitles. */
const TITLES: CaptionCue[] = [
	{from: -22, to: SCENES.hook[1] - 6, lines: [cue('WHY DOES *EVERYTHING*'), cue('BREAK?!')], y: 190, size: 92},
	{from: VO.emergencyFund - 2, to: end('plan', 4), lines: [cue('*EMERGENCY FUND*')], y: 200, size: 88},
	{from: VO.emergencyFund + 8, to: end('plan', 4), lines: [cue('YOUR FINANCIAL BUFFER')], y: 300, size: 50, letterSpacing: 1},
];

/** Subtle effects, kept well under the narration. */
const SFX: [number, string, number][] = [
	[0, 'hiss', 0.22],
	[9, 'paper', 0.5],
	[9, 'thud', 0.25],
	[26, 'whoosh', 0.3],
	...[42, 56, 70].map((f) => [f, 'thud', 0.28] as [number, string, number]),
	[VO.everything, 'alert', 0.35],
	...[VO.everything + 6, VO.everything + 11, VO.everything + 16].map((f) => [f, 'paper', 0.4] as [number, string, number]),
	[128, 'whoosh', 0.22],
	[141, 'hiss', 0.22],
	[152, 'pop', 0.22],
	[170, 'whoosh', 0.18],
	[206, 'whoosh', 0.28],
	...[222, 234, 247, 253, 263, 269].map((f) => [f, 'paper', 0.45] as [number, string, number]),
	[233, 'ping', 0.22],
	[250, 'ping', 0.2],
	[268, 'whoosh', 0.28],
	[287, 'thud', 0.55],
	[361, 'paper', 0.4],
	[369, 'paper', 0.4],
	[475, 'whoosh', 0.22],
	[482, 'thud', 0.25],
	[558, 'thud', 0.45],
	[632, 'pop', 0.18],
	[VO.handle, 'paper', 0.35],
	[868, 'whoosh', 0.2],
	[888, 'confirm', 0.3],
	[VO.creditCard + 2, 'alert', 0.16],
	[1016, 'whoosh', 0.28],
	[1037, 'paper', 0.35],
	[1048, 'confirm', 0.22],
	[VO.realGoal, 'chime', 0.3],
	...[1106, 1112, 1118].map((f) => [f, 'pop', 0.12] as [number, string, number]),
];

/** Faint red edge pulse through the unexpected-expense run. */
const StressPulse: React.FC = () => {
	const f = useCurrentFrame();
	const env = tw(f, SCENES.tire[0], SCENES.tire[0] + 10) * tw(f, SCENES.blocked[0] - 6, SCENES.blocked[0] + 4, 1, 0);
	if (env <= 0) return null;
	return <AbsoluteFill style={{pointerEvents: 'none', opacity: env * (0.18 + 0.14 * Math.sin(f / 2.4)), background: 'radial-gradient(ellipse 640px 1050px at 540px 900px, transparent 50%, rgba(255,50,50,0.7) 100%)'}} />;
};

export const DebtStory: React.FC = () => (
	<AbsoluteFill style={{background: C.bg}}>
		<Backdrop />
		{/* scenes are authored in stage space and lifted clear of the subtitle band */}
		<div style={{position: 'absolute', left: 0, width: 1080, top: -STAGE_SHIFT, height: 1920 + STAGE_SHIFT}}>
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
		</div>
		<StressPulse />
		<Vignette amt={0.55} />
		<Captions cues={TITLES} />
		<Subtitles />
		<Watermark />
		<Audio src={staticFile('debt-story/narration.mp3')} />
		{SFX.map(([f, name, vol], i) => (
			<Sequence key={i} from={f} durationInFrames={36} name={`sfx ${name}`}>
				<Audio src={staticFile(`debt-story/sfx/${name}.wav`)} volume={vol} />
			</Sequence>
		))}
	</AbsoluteFill>
);
