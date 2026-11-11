import React from 'react';
import {Sequence, type CalculateMetadataFunction} from 'remotion';
import {z} from 'zod';
import {NarratedVideo, narratedSchema, resolveNarration, type VideoDef} from '../../story/lib/NarratedVideo';
import {cueSec, type Narration} from '../../story/lib/narration';
import {story} from '../../story/theme';
import {ClipContext, type ClipId} from './clipContext';
import {SCENES, SCRIPT, type SceneId} from './script';
import {DEF} from './Video';

/**
 * Standalone excerpts of RentVsBuy, rendered from the same timeline (same
 * voice file, animations, captions) — no re-encode of the finished MP4.
 *
 * Each clip opens on a scene boundary with a HARD cut (the transition into
 * that scene is removed so frame 0 is a settled scene) and ends in the
 * silence after its last sentence, before the next scene's transition
 * (also removed). Captions only show pages that start inside the window.
 */
type ClipSpec = {
	/** first scene: the clip starts on its boundary */
	firstScene: SceneId;
	/** line whose end closes the clip */
	lastLine: string;
	/** scene after the clip (its incoming transition is removed so no half-transition shows) */
	nextScene: SceneId | null;
	/** seconds held after the last word */
	holdSec: number;
	file: string;
};

export const CLIP_SPECS: Record<ClipId, ClipSpec> = {
	parents: {firstScene: 'parents', lastLine: 'L8', nextScene: 'keys', holdSec: 0.45, file: 'stackwithgio_clip01_parents.mp4'},
	repair: {firstScene: 'keys', lastLine: 'L13', nextScene: 'equity', holdSec: 0.45, file: 'stackwithgio_clip02_repair_bill.mp4'},
	afford: {firstScene: 'decision', lastLine: 'L27', nextScene: null, holdSec: 0.5, file: 'stackwithgio_clip03_ready_to_buy.mp4'},
};

const LEAD = 0.12; // NarratedVideo default: a scene starts this long before its first line

export const clipWindow = (narration: Narration, id: ClipId) => {
	const c = CLIP_SPECS[id];
	const fps = story.fps;
	const first = SCENES.find((s) => s.id === c.firstScene)!;
	const inFrame = Math.round((cueSec(narration, first.firstLine) - LEAD) * fps);
	let outFrame = Math.round((cueSec(narration, c.lastLine, undefined, 'end') + c.holdSec) * fps);
	if (c.nextScene) {
		const next = SCENES.find((s) => s.id === c.nextScene)!;
		outFrame = Math.min(outFrame, Math.round((cueSec(narration, next.firstLine) - LEAD) * fps) - 1);
	}
	return {inFrame, outFrame, firstLine: first.firstLine};
};

const defFor = (id: ClipId): VideoDef<SceneId> => {
	const c = CLIP_SPECS[id];
	const hard = new Set<SceneId>([c.firstScene, ...(c.nextScene ? [c.nextScene] : [])]);
	return {...DEF, scenes: SCENES.map((s) => (hard.has(s.id) ? {...s, transitionFrames: 0} : s))};
};

export const RentVsBuyClipSchema = narratedSchema.extend({clip: z.enum(['parents', 'repair', 'afford']).default('parents')});
type Props = z.infer<typeof RentVsBuyClipSchema>;

export const calculateRentVsBuyClipMetadata: CalculateMetadataFunction<Props> = async ({props}) => {
	const narration = await resolveNarration(SCRIPT, props);
	const {inFrame, outFrame, firstLine} = clipWindow(narration, props.clip);
	const lastWordSec = cueSec(narration, CLIP_SPECS[props.clip].lastLine, undefined, 'end');
	return {
		durationInFrames: outFrame - inFrame,
		props: {...props, narration, captionFromSec: cueSec(narration, firstLine) - 0.05, captionToSec: lastWordSec + 0.01},
	};
};

export const RentVsBuyClip: React.FC<Props> = (props) => {
	const def = React.useMemo(() => defFor(props.clip), [props.clip]);
	const narration = props.narration;
	if (!narration) return null;
	const {inFrame} = clipWindow(narration, props.clip);
	return (
		<ClipContext.Provider value={props.clip}>
			<Sequence from={-inFrame} name={`full timeline @${inFrame}`}>
				<NarratedVideo def={def} props={props} />
			</Sequence>
		</ClipContext.Provider>
	);
};
