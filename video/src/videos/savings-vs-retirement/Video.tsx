import React from 'react';
import {matchCut} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {editorial} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {RetireScene} from './scenes/RetireScene';
import {SavingsScene} from './scenes/SavingsScene';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {savings: SavingsScene, retire: RetireScene},
	// both scenes are the warm off-white desk; captions use the editorial (ink + green) palette
	looks: {savings: editorial, retire: editorial},
	transitions: {
		// same two card slots on both sides of the cut: savings labels give way to Roth IRA / 401(k)
		retire: {presentation: matchCut()},
	},
};

export const SavingsVsRetirementSchema = narratedSchema;
export const calculateSavingsVsRetirementMetadata = makeCalculateMetadata(DEF);

/** Savings vs High-Yield, Roth IRA vs 401(k) */
export const SavingsVsRetirement: React.FC<NarratedProps> = (props) => <NarratedVideo def={DEF} props={props} />;
