import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HookScene} from './scenes/HookScene';
import {FundScene} from './scenes/FundScene';
import {Sp500Scene} from './scenes/Sp500Scene';
import {OrderScene} from './scenes/OrderScene';
import {RecurringScene} from './scenes/RecurringScene';
import {EndScene} from './scenes/EndScene';
import {white} from './ui';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, fund: FundScene, sp500: Sp500Scene, order: OrderScene, recurring: RecurringScene, end: EndScene},
	looks: {hook: cinematic, fund: cinematic, sp500: white, order: cinematic, recurring: cinematic, end: cinematic},
	transitions: {
		// back to the home screen to start the walkthrough
		fund: {presentation: slide({direction: 'from-right'})},
		// chapter change: from the app to the idea of the index
		sp500: {presentation: panelSweep({color: white.accent, direction: 'up'}), timing: 'spring'},
		// light opens from the VOO chip back into the app
		order: {presentation: iris({x: 170, y: 356})},
		recurring: {presentation: slide({direction: 'from-bottom'})},
		end: {presentation: matchCut()},
	},
};

export const BuyFirstEtfSchema = narratedSchema;
export const calculateBuyFirstEtfMetadata = makeCalculateMetadata(DEF);

/** How to Buy Your First ETF — Step by Step */
export const BuyFirstEtf: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
