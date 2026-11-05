import React from 'react';
import {AbsoluteFill} from 'remotion';
import {slide} from '@remotion/transitions/slide';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {HookScene} from './scenes/HookScene';
import {SignsScene} from './scenes/SignsScene';
import {InvestScene} from './scenes/InvestScene';
import {DebtScene} from './scenes/DebtScene';
import {FundScene} from './scenes/FundScene';
import {BonusScene} from './scenes/BonusScene';
import {StoryScene} from './scenes/StoryScene';
import {EndScene} from './scenes/EndScene';
import {Watermark} from './ui';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, signs: SignsScene, invest: InvestScene, debt: DebtScene, fund: FundScene, bonus: BonusScene, story: StoryScene, end: EndScene},
	looks: {hook: cinematic, signs: cinematic, invest: cinematic, debt: cinematic, fund: cinematic, bonus: cinematic, story: cinematic, end: cinematic},
	transitions: {
		signs: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		invest: {presentation: panelSweep({color: cinematic.accent, direction: 'up'}), timing: 'spring'},
		debt: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		fund: {presentation: panelSweep({color: cinematic.accent, direction: 'left'}), timing: 'spring'},
		bonus: {presentation: iris({x: 830, y: 1200})},
		story: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		end: {presentation: matchCut()},
	},
};

export const SignsDoingBetterSchema = narratedSchema;
export const calculateSignsDoingBetterMetadata = makeCalculateMetadata(DEF);

/** 3 Signs You're Doing Better Financially Than You Think */
export const SignsDoingBetter: React.FC<NarratedProps> = (props) => (
	<AbsoluteFill>
		<NarratedVideo def={DEF} props={props} />
		<Watermark />
	</AbsoluteFill>
);
