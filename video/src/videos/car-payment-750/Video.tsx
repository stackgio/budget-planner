import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {estimateNarration} from '../../story/lib/narration';
import {buildSceneWindows} from '../../story/lib/sceneTimeline';
import {DARK, LIGHT, SoftCaptions, WARM, Watermark, C} from './look';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HookScene} from './scenes/HookScene';
import {PaymentScene} from './scenes/PaymentScene';
import {HiddenScene} from './scenes/HiddenScene';
import {CalcScene} from './scenes/CalcScene';
import {RevealScene} from './scenes/RevealScene';
import {AnnualScene} from './scenes/AnnualScene';
import {HalfScene} from './scenes/HalfScene';
import {MontageScene} from './scenes/MontageScene';
import {AffordScene} from './scenes/AffordScene';
import {UsedScene} from './scenes/UsedScene';
import {WorthScene} from './scenes/WorthScene';
import {AskScene} from './scenes/AskScene';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {
		hook: HookScene,
		payment: PaymentScene,
		hidden: HiddenScene,
		calc: CalcScene,
		reveal: RevealScene,
		annual: AnnualScene,
		half: HalfScene,
		montage: MontageScene,
		afford: AffordScene,
		used: UsedScene,
		worth: WorthScene,
		ask: AskScene,
	},
	looks: {
		hook: DARK,
		payment: DARK,
		hidden: DARK,
		calc: LIGHT,
		reveal: DARK,
		annual: DARK,
		half: WARM,
		montage: WARM,
		afford: DARK,
		used: WARM,
		worth: DARK,
		ask: DARK,
	},
	transitions: {
		payment: {presentation: matchCut()}, // $750 holds its framing while the car drops away
		hidden: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		calc: {presentation: wipe({direction: 'from-bottom'})},
		reveal: {presentation: matchCut()}, // the total continues into the hero number
		annual: {presentation: slide({direction: 'from-bottom'}), timing: 'spring'},
		half: {presentation: panelSweep({color: '#FFE7C2', direction: 'up'}), timing: 'spring'},
		montage: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		afford: {presentation: iris({x: 540, y: 1200})},
		used: {presentation: slide({direction: 'from-right'}), timing: 'spring'}, // camera pans from one lifestyle to the other
		worth: {presentation: panelSweep({color: C.black, direction: 'left'}), timing: 'spring'},
		ask: {presentation: wipe({direction: 'from-top'})},
	},
};

export const CarPayment750Schema = narratedSchema;
export const calculateCarPayment750Metadata = makeCalculateMetadata(DEF);

const Overlay: React.FC<{props: NarratedProps}> = ({props}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const narration = props.narration ?? estimateNarration(DEF.script, {rate: props.tempRate});
	const {windows} = React.useMemo(() => buildSceneWindows(DEF.scenes, narration, fps, {tailSec: DEF.tailSec}), [narration, fps]);
	let id: SceneId = windows[0].id;
	for (const w of windows) if (frame >= w.boundary) id = w.id;
	const onLight = DEF.looks[id].name === 'editorial' && id !== 'used';
	return (
		<>
			{props.captions && <SoftCaptions narration={narration} />}
			<Watermark onLight={onLight || id === 'used'} />
		</>
	);
};

/** Stack With Gio — The $750 Car Payment */
export const CarPayment750: React.FC<NarratedProps> = (props) => (
	<AbsoluteFill>
		<NarratedVideo def={DEF} props={{...props, captions: false, sfx: false}} />
		<Overlay props={props} />
	</AbsoluteFill>
);
