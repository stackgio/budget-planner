import React from 'react';
import {iris, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {cinematic, editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HOOK_CARD3, HookScene} from './scenes/HookScene';
import {ChaseScene} from './scenes/ChaseScene';
import {BoaScene} from './scenes/BoaScene';
import {WellsScene} from './scenes/WellsScene';
import {EndScene} from './scenes/EndScene';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, chase: ChaseScene, boa: BoaScene, wells: WellsScene, end: EndScene},
	looks: {hook: editorial, chase: editorial, boa: editorial, wells: cinematic, end: editorial},
	transitions: {
		// card #3 opens into Chase
		chase: {presentation: iris({x: HOOK_CARD3.x, y: HOOK_CARD3.y})},
		// chapter change
		boa: {presentation: panelSweep({color: editorial.ink, direction: 'left'}), timing: 'spring'},
		// lights down for #1
		wells: {presentation: iris({x: 540, y: 700})},
		end: {presentation: panelSweep({color: editorial.accent, direction: 'up'}), timing: 'spring'},
	},
};

export const BankEvidenceSchema = narratedSchema;
export const calculateBankEvidenceMetadata = makeCalculateMetadata(DEF);

/** 3 Banks I'd Think Twice About — with real evidence */
export const BankEvidence: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
