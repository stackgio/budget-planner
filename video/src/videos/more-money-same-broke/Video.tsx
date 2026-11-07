import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HookScene} from './scenes/HookScene';
import {OldPaycheckScene} from './scenes/OldPaycheckScene';
import {RaiseScene} from './scenes/RaiseScene';
import {SpendScene, ZERO_AT} from './scenes/SpendScene';
import {RealizeScene} from './scenes/RealizeScene';
import {InflationScene} from './scenes/InflationScene';
import {SolutionScene} from './scenes/SolutionScene';
import {TakeawayScene} from './scenes/TakeawayScene';
import {EndScene} from './scenes/EndScene';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {
		hook: HookScene,
		old: OldPaycheckScene,
		raise: RaiseScene,
		spend: SpendScene,
		realize: RealizeScene,
		inflation: InflationScene,
		solution: SolutionScene,
		takeaway: TakeawayScene,
		end: EndScene,
	},
	looks: {
		hook: editorial,
		old: editorial,
		raise: editorial,
		spend: editorial,
		realize: cinematic,
		inflation: cinematic,
		solution: editorial,
		takeaway: editorial,
		end: editorial,
	},
	transitions: {
		old: {presentation: slide({direction: 'from-left'}), timing: 'spring'},
		raise: {presentation: panelSweep({color: editorial.accent, direction: 'up'})},
		spend: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		realize: {presentation: iris({x: ZERO_AT.x, y: ZERO_AT.y + 120})},
		inflation: {presentation: matchCut()},
		solution: {presentation: panelSweep({color: editorial.bg, direction: 'up'})},
		takeaway: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		end: {presentation: wipe({direction: 'from-left'})},
	},
	// only meaningful words / numbers go green in the captions
	captionKeywords: ['money', 'broke', '$3,000', 'gone', 'raise', 'five', 'thousand', '$2,000', 'paycheck', 'lifestyle', 'inflation', 'hundred', 'dollars', 'six', 'save', 'invest', 'debt', 'keeping', 'saving', 'upgrading'],
};

export const MoreMoneySameBrokeSchema = narratedSchema;
export const calculateMoreMoneySameBrokeMetadata = makeCalculateMetadata(DEF);

/** More Money, Same Broke Life */
export const MoreMoneySameBroke: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
