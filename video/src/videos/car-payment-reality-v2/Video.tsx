import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, type CalculateMetadataFunction} from 'remotion';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {z} from 'zod';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type VideoDef} from '../../story/lib/NarratedVideo';
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

/**
 * Same narrated shell as CarPaymentReality, plus a silence-only edit of the voice:
 *   voiceSource  the creator's untouched MP3 (never re-encoded, played at 1.0x)
 *   voiceEdit    edit.json from projects/car-payment-reality-v2/tighten_gaps.py —
 *                kept source-frame ranges; every cut sits in a silent gap between words
 *   alignment    the word timestamps re-timed onto the edited timeline (all cues follow it)
 */
export const CarPaymentRealityV2Schema = narratedSchema.extend({
	voiceSource: z.string().nullable().default(null),
	voiceEdit: z.string().nullable().default(null),
	/** resolved from voiceEdit by calculateMetadata — do not set by hand */
	voiceSegments: z.array(z.tuple([z.number(), z.number()])).optional(),
});
type Props = z.infer<typeof CarPaymentRealityV2Schema>;

const baseMeta = makeCalculateMetadata(DEF);
export const calculateCarPaymentRealityV2Metadata: CalculateMetadataFunction<Props> = async (args) => {
	// voiceAudio stays null so the shell doesn't stretch the video to the unedited file length
	const res = await baseMeta({...args, props: {...args.props, voiceAudio: null}});
	const voiceSegments = args.props.voiceEdit
		? ((await fetch(staticFile(args.props.voiceEdit)).then((r) => r.json())) as {segments: [number, number][]}).segments
		: undefined;
	return {...res, props: {...args.props, ...(res.props as object), voiceAudio: null, voiceSegments}};
};

/** The voice, segment by segment on the edited timeline. */
const EditedVoice: React.FC<{src: string; segments: [number, number][]; volume: number}> = ({src, segments, volume}) => {
	let at = 0;
	return (
		<>
			{segments.map(([a, b], i) => {
				const from = at;
				at += b - a;
				return (
					<Sequence key={i} from={from} durationInFrames={b - a} layout="none" name={`voice ${a}-${b}`}>
						<Html5Audio src={staticFile(src)} trimBefore={a} volume={volume} />
					</Sequence>
				);
			})}
		</>
	);
};

/** Hybrid recut of CarPaymentReality (v04 structure + V2 receipt, cars and paycheck bar). No music. */
export const CarPaymentRealityV2: React.FC<Props> = (props) => (
	<AbsoluteFill>
		<NarratedVideo def={DEF} props={{...props, voiceAudio: null, captions: false}} />
		{props.captions && props.narration && <PhraseCaptions narration={props.narration} />}
		{props.voiceSource && props.voiceSegments && <EditedVoice src={props.voiceSource} segments={props.voiceSegments} volume={props.voiceVolume} />}
		{props.voiceSource && !props.voiceSegments && <Html5Audio src={staticFile(props.voiceSource)} volume={props.voiceVolume} />}
	</AbsoluteFill>
);
