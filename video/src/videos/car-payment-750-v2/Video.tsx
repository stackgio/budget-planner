import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {estimateNarration} from '../../story/lib/narration';
import {buildSceneWindows} from '../../story/lib/sceneTimeline';
import {PhraseCaptions} from '../car-payment-750-recut/look';
import {C, DARK, LIGHT, Watermark} from './look';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HookScene} from './scenes/HookScene';
import {HiddenScene} from './scenes/HiddenScene';
import {ReceiptScene} from './scenes/ReceiptScene';
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
	components: {hook: HookScene, hidden: HiddenScene, receipt: ReceiptScene, half: HalfScene, montage: MontageScene, afford: AffordScene, used: UsedScene, worth: WorthScene, ask: AskScene},
	looks: {hook: DARK, hidden: DARK, receipt: DARK, half: LIGHT, montage: LIGHT, afford: DARK, used: LIGHT, worth: DARK, ask: DARK},
	transitions: {
		hidden: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		receipt: {presentation: wipe({direction: 'from-bottom'})},
		half: {presentation: panelSweep({color: '#FFFFFF', direction: 'up'}), timing: 'spring'},
		montage: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		afford: {presentation: iris({x: 540, y: 1000})},
		used: {presentation: slide({direction: 'from-right'}), timing: 'spring'},
		worth: {presentation: panelSweep({color: C.black, direction: 'left'}), timing: 'spring'},
		ask: {presentation: matchCut()},
	},
};

export const CarPayment750V2Schema = narratedSchema;
export const calculateCarPayment750V2Metadata = makeCalculateMetadata(DEF);

const LIGHT_SCENES: SceneId[] = ['half', 'montage', 'used'];

const Overlay: React.FC<{props: NarratedProps}> = ({props}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const narration = props.narration ?? estimateNarration(DEF.script, {rate: props.tempRate});
	const {windows} = React.useMemo(() => buildSceneWindows(DEF.scenes, narration, fps, {tailSec: DEF.tailSec}), [narration, fps]);
	let id: SceneId = windows[0].id;
	for (const w of windows) if (frame >= w.boundary) id = w.id;
	return (
		<>
			{/* the closing question is on screen word for word, so the caption pill steps aside */}
			{props.captions && id !== 'ask' && <PhraseCaptions narration={narration} />}
			<Watermark onLight={LIGHT_SCENES.includes(id)} />
		</>
	);
};

/** Stack With Gio — The $750 Car Payment (v2: visuals + captions revised, original voiceover) */
export const CarPayment750V2: React.FC<NarratedProps> = (props) => (
	<AbsoluteFill>
		<NarratedVideo def={DEF} props={{...props, captions: false, sfx: false}} />
		<Overlay props={props} />
	</AbsoluteFill>
);
