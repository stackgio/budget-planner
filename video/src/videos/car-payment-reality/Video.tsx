import React from 'react';
import {AbsoluteFill} from 'remotion';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {matte, PhraseCaptions} from './parts';
import {BillScene} from './scenes/BillScene';
import {ChoiceScene} from './scenes/ChoiceScene';
import {AskScene} from './scenes/AskScene';

type Id = (typeof SCENES)[number]['id'];

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {bill: BillScene, choice: ChoiceScene, ask: AskScene},
	looks: {bill: matte, choice: matte, ask: matte},
	transitions: {
		choice: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		ask: {presentation: wipe({direction: 'from-bottom'}), timing: 'linear'},
	},
};

export const CarPaymentRealitySchema = narratedSchema;
export const calculateCarPaymentRealityMetadata = makeCalculateMetadata(DEF);

/** The Real Cost of a $750 Car Payment — Stack With Gio. No music (added at publishing). */
export const CarPaymentReality: React.FC<NarratedProps> = (props) => (
	<AbsoluteFill>
		{/* the shell's word captions are replaced by this video's phrase captions */}
		<NarratedVideo def={DEF} props={{...props, captions: false}} />
		{props.captions && props.narration && <PhraseCaptions narration={props.narration} />}
	</AbsoluteFill>
);
