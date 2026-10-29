import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {z} from 'zod';
import '../fonts';
import {Backdrop, Vignette, Watermark} from '../debt-story/Stage';
import {C, FONT} from '../debt-story/theme';
import {S1Hook} from './scenes/S1Hook';
import {S2Fund} from './scenes/S2Fund';
import {S3Tire} from './scenes/S3Tire';
import {S4Split} from './scenes/S4Split';
import {S5Income} from './scenes/S5Income';
import {S6Weeks} from './scenes/S6Weeks';
import {S7Card} from './scenes/S7Card';
import {S8Ending} from './scenes/S8Ending';
import {S9Cta} from './scenes/S9Cta';
import {at} from './timing';
import {Tracker} from './Tracker';
import {CaptionTrack, StepHeader} from './ui';

export const dp3Schema = z.object({
	/** path inside public/, e.g. "debt-payoff-3/narration.mp3". Null until the recording exists. */
	voiceover: z.string().nullable(),
	/** burns a "TEMP TIMING" badge into preview renders */
	draft: z.boolean(),
});
export type DP3Props = z.infer<typeof dp3Schema>;

/** Sparse SFX: step slams, the tyre, the two outcomes, the card balance and the ending. [frame, name, volume] */
const SFX: [number, string, number][] = [
	[22, 'thud', 0.3],
	[at('three', 1), 'pop', 0.16],
	[at('n1') - 14, 'whoosh', 0.16],
	[at('n1'), 'thud', 0.3],
	[at('amounts', 1) - 2, 'paper', 0.3],
	[at('amounts', 1) + 20, 'confirm', 0.22],
	[at('tire'), 'hiss', 0.3],
	[at('forcing') + 10, 'alert', 0.2],
	[at('intoDebt') + 6, 'confirm', 0.26],
	[at('n2'), 'thud', 0.3],
	[at('overtime', 1) - 3, 'ping', 0.14],
	[at('fifty', 3) + 35, 'chime', 0.22],
	[at('n3'), 'thud', 0.3],
	[at('paying300', 2) + 6, 'confirm', 0.22],
	[at('charging', 2) + 8, 'alert', 0.24],
	[at('habits'), 'chime', 0.22],
	[at('whats') - 4, 'pop', 0.18],
];

const DraftBadge: React.FC = () => (
	<div
		style={{
			position: 'absolute',
			left: 40,
			top: 60,
			padding: '8px 16px',
			borderRadius: 10,
			border: '2px solid #FF9A3D',
			color: '#FF9A3D',
			fontFamily: FONT,
			fontWeight: 800,
			fontSize: 22,
			letterSpacing: 1.5,
			background: 'rgba(0,0,0,0.6)',
		}}
	>
		PREVIEW · TEMP TIMING · NO VOICEOVER
	</div>
);

export const DebtPayoff3Things: React.FC<DP3Props> = ({voiceover, draft}) => (
	<AbsoluteFill style={{background: C.bg}}>
		<Backdrop />
		<S1Hook />
		<S2Fund />
		<S3Tire />
		<S4Split />
		<S5Income />
		<S6Weeks />
		<S7Card />
		<S8Ending />
		<S9Cta />
		<Vignette amt={0.5} />
		<StepHeader step={0} start={at('n1')} end={at('n2')} />
		<StepHeader step={1} start={at('n2')} end={at('n3')} />
		<StepHeader step={2} start={at('n3')} end={at('working')} />
		<Tracker />
		<CaptionTrack />
		<Watermark />
		{draft ? <DraftBadge /> : null}
		{voiceover ? <Audio src={staticFile(voiceover)} /> : null}
		{SFX.map(([f, name, vol], i) => (
			<Sequence key={i} from={f} durationInFrames={36} name={`sfx ${name}`}>
				<Audio src={staticFile(`debt-story/sfx/${name}.wav`)} volume={vol} />
			</Sequence>
		))}
	</AbsoluteFill>
);
