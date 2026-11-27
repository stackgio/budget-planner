import React from 'react';
import {slide} from '@remotion/transitions/slide';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {LADDER, VAULT_HANDLE} from './layout';
import {HookScene} from './scenes/HookScene';
import {BankScene} from './scenes/BankScene';
import {HysaScene} from './scenes/HysaScene';
import {WhyScene} from './scenes/WhyScene';
import {SafeScene} from './scenes/SafeScene';
import {EndScene} from './scenes/EndScene';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, bank: BankScene, hysa: HysaScene, why: WhyScene, safe: SafeScene, end: EndScene},
	looks: {hook: editorial, bank: editorial, hysa: cinematic, why: editorial, safe: editorial, end: cinematic},
	transitions: {
		bank: {presentation: matchCut()}, // bank + Marcus keep their place
		hysa: {presentation: iris({x: LADDER.x + LADDER.w / 2, y: LADDER.y + 150})}, // light opens from the stacks
		why: {presentation: panelSweep({color: editorial.accent, direction: 'up'})},
		safe: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		end: {presentation: iris(VAULT_HANDLE)}, // out of the vault handle
	},
};

export const HysaVsSavingsSchema = narratedSchema;
export const calculateHysaVsSavingsMetadata = makeCalculateMetadata(DEF);

/** HYSA vs Regular Savings */
export const HysaVsSavings: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
