import React, {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, type CalculateMetadataFunction, staticFile, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {colors} from '../../brand/theme';
import {Captions} from '../../components/Captions';
import {EndCard} from '../../components/HookEnd';
import {KineticStory} from '../../components/KineticStory';
import {SafeZoneOverlay} from '../../components/SafeZoneOverlay';
import {Scene} from '../../components/Scene';
import {makeCues, type Narration} from '../../lib/timing';
import narrationJson from './narration.json';

// __VIDEO_ID__ — built from the template. Start from KineticStory, then replace
// lines with character, data or finance scenes using cues from the narration:
//   const c = makeCues(narration, fps); c.line('L2').from; c.word('dividend').from
const narration = narrationJson as Narration;
const END_CARD_FRAMES = 54;

export const __NAME__Schema = z.object({
	showCaptions: z.boolean(),
	showSafeZones: z.boolean(),
});
type Props = z.infer<typeof __NAME__Schema>;

export const calculate__NAME__Metadata: CalculateMetadataFunction<Props> = () => {
	const fps = 30;
	return {fps, durationInFrames: makeCues(narration, fps).end + 8 + END_CARD_FRAMES};
};

export const __NAME__: React.FC<Props> = ({showCaptions, showSafeZones}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const cues = useMemo(() => makeCues(narration, fps), [fps]);
	const endCard = cues.end + 8;
	return (
		<AbsoluteFill style={{backgroundColor: colors.black}}>
			<KineticStory narration={narration} endFrame={endCard} emphasize={[]} />
			{/* KineticStory already shows the words; enable captions once you replace lines with visuals. */}
			{showCaptions ? <Captions words={narration.words} /> : null}
			<Scene name="End card" from={endCard} to={durationInFrames}>
				<EndCard startFrame={endCard} />
			</Scene>
			<Audio name="Narration" src={staticFile(narration.audio)} />
			{showSafeZones ? <SafeZoneOverlay /> : null}
		</AbsoluteFill>
	);
};
