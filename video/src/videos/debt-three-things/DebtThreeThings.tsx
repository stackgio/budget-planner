import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useVideoConfig, type CalculateMetadataFunction} from 'remotion';
import {linearTiming, springTiming, TransitionSeries, type TransitionPresentation} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {z} from 'zod';
import '../../fonts';
import {Captions} from '../../story/components/Captions';
import {SfxContext} from '../../story/components/Chrome';
import {iris, matchCut, panelSweep} from '../../story/components/Transitions';
import {CueProvider} from '../../story/lib/cues';
import {estimateNarration, narrationFromWords, narrationSchema, scaleNarration, wordsFromAlignmentJson, type Narration} from '../../story/lib/narration';
import {buildSceneWindows} from '../../story/lib/sceneTimeline';
import {cinematic, editorial, story} from '../../story/theme';
import {SCENES, SCRIPT, TAIL_SEC} from './script';
import {HookScene} from './scenes/HookScene';
import {FundScene} from './scenes/FundScene';
import {ExtraScene} from './scenes/ExtraScene';
import {StayScene} from './scenes/StayScene';
import {EndScene} from './scenes/EndScene';

export const debtThreeThingsSchema = z.object({
	/** narration audio inside public/, e.g. "voice/debt-three-things/voice.mp3" (your recording or ElevenLabs) */
	voiceAudio: z.string().nullable().default(null),
	/** word timings inside public/: {words:[{text,start,end}]} or ElevenLabs alignment JSON */
	alignment: z.string().nullable().default(null),
	voiceVolume: z.number().min(0).max(2).default(1),
	captions: z.boolean().default(true),
	sfx: z.boolean().default(true),
	sfxVolume: z.number().min(0).max(2).default(1),
	/** pacing of the TEMPORARY timing used when no narration is supplied */
	tempRate: z.number().min(0.6).max(1.6).default(1.1),
	/** resolved by calculateMetadata — do not set by hand */
	narration: narrationSchema.optional(),
});
export type DebtThreeThingsProps = z.infer<typeof debtThreeThingsSchema>;

const IRIS_AT = {x: 905, y: 905}; // the desk lamp in ExtraScene

const COMPONENTS = {hook: HookScene, fund: FundScene, extra: ExtraScene, stay: StayScene, end: EndScene};
const LOOK = {hook: editorial, fund: editorial, extra: cinematic, stay: editorial, end: editorial};

export const resolveNarration = async (props: DebtThreeThingsProps): Promise<Narration> => {
	const audioSec = props.voiceAudio ? await getAudioDurationInSeconds(staticFile(props.voiceAudio)) : undefined;
	if (props.alignment) {
		const json = await fetch(staticFile(props.alignment)).then((r) => r.json());
		return narrationFromWords(SCRIPT, wordsFromAlignmentJson(json), audioSec);
	}
	const est = estimateNarration(SCRIPT, {rate: props.tempRate});
	return audioSec ? scaleNarration(est, audioSec) : est;
};

export const calculateDebtMetadata: CalculateMetadataFunction<DebtThreeThingsProps> = async ({props}) => {
	const narration = await resolveNarration(props);
	const {durationInFrames} = buildSceneWindows(SCENES, narration, story.fps, {tailSec: TAIL_SEC});
	return {durationInFrames, props: {...props, narration}};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentationFor = (id: string): TransitionPresentation<any> => {
	if (id === 'fund') return matchCut();
	if (id === 'extra') return iris(IRIS_AT);
	if (id === 'stay') return panelSweep({color: editorial.accent, direction: 'up'});
	return slide({direction: 'from-bottom'});
};

/**
 * "3 Things I Wish I Knew Before Paying Off Debt"
 * Scenes are timed from narration cues: drop in real audio + alignment and
 * every scene and animation re-times itself.
 */
export const DebtThreeThings: React.FC<DebtThreeThingsProps> = (props) => {
	const {fps} = useVideoConfig();
	const narration = props.narration ?? estimateNarration(SCRIPT, {rate: props.tempRate});
	const {windows} = React.useMemo(() => buildSceneWindows(SCENES, narration, fps, {tailSec: TAIL_SEC}), [narration, fps]);
	const paletteAt = (f: number) => {
		let look = LOOK.hook;
		for (const w of windows) if (f >= w.boundary) look = LOOK[w.id];
		return look;
	};
	return (
		<AbsoluteFill style={{background: editorial.bg}}>
			<SfxContext.Provider value={{enabled: props.sfx, master: props.sfxVolume}}>
				<TransitionSeries>
					{windows.map((w) => {
						const C = COMPONENTS[w.id];
						return (
							<React.Fragment key={w.id}>
								{w.transitionIn > 0 && (
									<TransitionSeries.Transition
										presentation={presentationFor(w.id)}
										timing={w.id === 'end' ? springTiming({config: {damping: 200}, durationInFrames: w.transitionIn}) : linearTiming({durationInFrames: w.transitionIn})}
									/>
								)}
								<TransitionSeries.Sequence durationInFrames={w.durationInFrames} name={w.id}>
									<CueProvider narration={narration} sceneStartFrame={w.start}>
										<C />
									</CueProvider>
								</TransitionSeries.Sequence>
							</React.Fragment>
						);
					})}
				</TransitionSeries>
			</SfxContext.Provider>
			{props.captions && <Captions narration={narration} paletteAt={paletteAt} />}
			{props.voiceAudio && <Html5Audio src={staticFile(props.voiceAudio)} volume={props.voiceVolume} />}
		</AbsoluteFill>
	);
};

