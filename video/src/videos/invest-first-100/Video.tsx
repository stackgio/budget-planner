import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {dark, white, VTI_STRIP_CENTER} from './look';
import {HookScene} from './scenes/HookScene';
import {VtiScene} from './scenes/VtiScene';
import {MarketScene} from './scenes/MarketScene';
import {SchdScene} from './scenes/SchdScene';
import {VxusScene} from './scenes/VxusScene';
import {FinalScene} from './scenes/FinalScene';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	captionsBoxed: true,
	components: {hook: HookScene, vti: VtiScene, market: MarketScene, schd: SchdScene, vxus: VxusScene, final: FinalScene},
	looks: {hook: dark, vti: white, market: white, schd: dark, vxus: white, final: dark},
	transitions: {
		vti: {presentation: iris({x: VTI_STRIP_CENTER.x, y: VTI_STRIP_CENTER.y})}, // the $70 strip opens into VTI
		market: {presentation: matchCut()}, // same framing: logo tiles continue into the dot field
		schd: {presentation: panelSweep({color: dark.accent, direction: 'up'}), timing: 'spring'}, // chapter 02
		vxus: {presentation: slide({direction: 'from-right'})}, // travelling abroad
		final: {presentation: iris({x: 540, y: 570})}, // everything gathers into the donut
	},
};

export const InvestFirst100Schema = narratedSchema;
export const calculateInvestFirst100Metadata = makeCalculateMetadata(DEF);

/** How I'd Invest My First $100 */
export const InvestFirst100: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
