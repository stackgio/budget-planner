import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {depthPush, iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {C, VAULT} from './ui';
import {HookScene} from './scenes/HookScene';
import {PromiseScene} from './scenes/PromiseScene';
import {AffordScene} from './scenes/AffordScene';
import {HabitScene} from './scenes/HabitScene';
import {HysaScene} from './scenes/HysaScene';
import {ReviewScene} from './scenes/ReviewScene';
import {ExtraScene} from './scenes/ExtraScene';
import {PayoffScene} from './scenes/PayoffScene';
import {CtaScene} from './scenes/CtaScene';
import {EXTRA_BAR_Y} from './scenes/ExtraScene';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {
		hook: HookScene,
		promise: PromiseScene,
		afford: AffordScene,
		habit: HabitScene,
		hysa: HysaScene,
		review: ReviewScene,
		extra: ExtraScene,
		payoff: PayoffScene,
		cta: CtaScene,
	},
	looks: {hook: VAULT, promise: VAULT, afford: VAULT, habit: VAULT, hysa: VAULT, review: VAULT, extra: VAULT, payoff: VAULT, cta: VAULT},
	transitions: {
		promise: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		afford: {presentation: depthPush()},
		habit: {presentation: matchCut()},
		hysa: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		// green sweep: a bright break between the two dashboard chapters
		review: {presentation: panelSweep({color: C.green, direction: 'up'})},
		extra: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		// light opens from the goal bar (where the extra $100 just landed) into the payoff
		payoff: {presentation: iris({x: 72 + 888 * 0.25, y: EXTRA_BAR_Y + 15})},
		cta: {presentation: matchCut()},
	},
};

export const SaveFirst10kSchema = narratedSchema;
export const calculateSaveFirst10kMetadata = makeCalculateMetadata(DEF);

/** Save Your First $10,000 */
export const SaveFirst10k: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
