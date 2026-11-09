import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type NarratedProps, type VideoDef} from '../../story/lib/NarratedVideo';
import {matchCut} from '../../story/components/Transitions';
import {estimateNarration} from '../../story/lib/narration';
import {buildSceneWindows} from '../../story/lib/sceneTimeline';
import {Watermark} from '../car-payment-750/look';
import {DARK, PhraseCaptions, WHITE} from './look';
import {SCENES, SCRIPT, TAIL_SEC, type SceneId} from './script';
import {HookScene} from './scenes/HookScene';
import {ReceiptScene} from './scenes/ReceiptScene';
import {UsedScene} from './scenes/UsedScene';
import {AskScene} from './scenes/AskScene';

const DEF: VideoDef<SceneId> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {hook: HookScene, receipt: ReceiptScene, used: UsedScene, ask: AskScene},
	looks: {hook: DARK, receipt: DARK, used: WHITE, ask: DARK},
	// receipt and used are straight cuts (transitionFrames 0); the close dissolves into the two-car split
	transitions: {ask: {presentation: matchCut()}},
};

export const CarPayment750RecutSchema = narratedSchema;
export const calculateCarPayment750RecutMetadata = makeCalculateMetadata(DEF);

const Overlay: React.FC<{props: NarratedProps}> = ({props}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const narration = props.narration ?? estimateNarration(DEF.script, {rate: props.tempRate});
	const {windows} = React.useMemo(() => buildSceneWindows(DEF.scenes, narration, fps, {tailSec: DEF.tailSec}), [narration, fps]);
	let id: SceneId = windows[0].id;
	for (const w of windows) if (frame >= w.boundary) id = w.id;
	return (
		<>
			{/* the closing question is on screen word-for-word, so the caption pill steps aside */}
			{props.captions && id !== 'ask' && <PhraseCaptions narration={narration} />}
			<Watermark onLight={id === 'used'} />
		</>
	);
};

/** Stack With Gio — The $750 Car Payment (25–30 s recut) */
export const CarPayment750Recut: React.FC<NarratedProps> = (props) => (
	<AbsoluteFill>
		<NarratedVideo def={DEF} props={{...props, captions: false, sfx: false}} />
		<Overlay props={props} />
	</AbsoluteFill>
);
