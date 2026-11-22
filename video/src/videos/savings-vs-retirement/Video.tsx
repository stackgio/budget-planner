import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {matchCut} from '../../story/components/Transitions';
import {desk} from '../../story/components/Desk';
import {makeCalculateMetadata, NarratedVideo, narratedSchema, type VideoDef} from '../../story/lib/NarratedVideo';
import {editorial, type Palette} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {SavingsScene} from './scenes/SavingsScene';
import {RetireScene} from './scenes/RetireScene';

type Id = (typeof SCENES)[number]['id'];

/** Light stone desk palette (captions follow it: matte black, green on the spoken word). */
const stone: Palette = {...editorial, bg: desk.stone, ink: desk.ink, accent: desk.green, accentDeep: desk.greenDeep};

const DEF: VideoDef<Id> = {
	script: SCRIPT,
	scenes: SCENES,
	tailSec: TAIL_SEC,
	components: {savings: SavingsScene, retire: RetireScene},
	looks: {savings: stone, retire: stone},
	transitions: {
		retire: {presentation: matchCut()},
	},
};

export const SavingsVsRetirementSchema = narratedSchema.extend({
	/** quiet original music bed under the narration (public/music/desk-bed.wav) */
	music: z.boolean().default(false),
	musicVolume: z.number().min(0).max(1).default(0.07),
});
type Props = z.infer<typeof SavingsVsRetirementSchema>;
export const calculateSavingsVsRetirementMetadata = makeCalculateMetadata(DEF);

const MusicBed: React.FC<{volume: number}> = ({volume}) => {
	const {durationInFrames, fps} = useVideoConfig();
	return (
		<Html5Audio
			src={staticFile('music/desk-bed.wav')}
			volume={(f) => {
				const fadeIn = Math.min(1, f / (fps * 1.0));
				const fadeOut = Math.min(1, Math.max(0, (durationInFrames - f) / (fps * 1.2)));
				return volume * fadeIn * fadeOut;
			}}
		/>
	);
};

/** Regular vs High-Yield Savings, Roth IRA vs 401(k) */
export const SavingsVsRetirement: React.FC<Props> = (props) => (
	<AbsoluteFill>
		<NarratedVideo def={DEF} props={props} />
		{props.music && <MusicBed volume={props.musicVolume} />}
	</AbsoluteFill>
);
