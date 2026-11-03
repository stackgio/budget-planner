import React from 'react';
import {iris, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {HookScene} from './scenes/HookScene';
import {BodyScene} from './scenes/BodyScene';
import {EndScene} from './scenes/EndScene';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, body: BodyScene, end: EndScene},
	looks: {hook: editorial, body: cinematic, end: editorial},
	transitions: {
		body: {presentation: iris({x: 540, y: 900})},
		end: {presentation: panelSweep({color: editorial.accent, direction: 'up'}), timing: 'spring'},
	},
};

export const __COMP__Schema = narratedSchema;
export const calculate__COMP__Metadata = makeCalculateMetadata(DEF);

/** __TITLE__ */
export const __COMP__: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
