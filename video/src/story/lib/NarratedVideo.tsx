import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useVideoConfig, type CalculateMetadataFunction} from 'remotion';
import {linearTiming, springTiming, TransitionSeries, type TransitionPresentation} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {z} from 'zod';
import '../../fonts';
import {Captions} from '../components/Captions';
import {SfxContext} from '../components/Chrome';
import {CueProvider} from './cues';
import {estimateNarration, narrationFromWords, narrationSchema, scaleNarration, wordsFromAlignmentJson, type Narration, type ScriptLine} from './narration';
import {buildSceneWindows, type SceneDef} from './sceneTimeline';
import {editorial, story, type Palette} from '../theme';

/**
 * Generic shell for every /motion video (Stack With Gio — Editorial Motion).
 *
 * A video is: script lines → scenes (each starting on a line) → one React
 * component per scene. Timing always comes from the narration:
 *   aligned word timestamps > audio-scaled estimate > temp estimate.
 * Dropping in a real voiceover re-times every scene and every cue.
 *
 * The voice file is played untouched (no speed change, no trimming).
 */

export const narratedSchema = z.object({
	/** narration audio inside public/, e.g. "voice/<slug>/voice.mp3" (ElevenLabs MP3 or WAV) */
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
export type NarratedProps = z.infer<typeof narratedSchema>;

export type SceneTransition =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	{presentation: TransitionPresentation<any>; timing?: 'linear' | 'spring'};

export type VideoDef<Id extends string> = {
	script: ScriptLine[];
	scenes: SceneDef<Id>[];
	/** seconds held after the last spoken word */
	tailSec: number;
	components: Record<Id, React.FC>;
	/** palette per scene — drives captions and the base background */
	looks: Record<Id, Palette>;
	/** transition INTO each scene (default: slide from bottom). Duration comes from SceneDef.transitionFrames. */
	transitions?: Partial<Record<Id, SceneTransition>>;
	/** optional: caption words never split from the word before them */
	captionKeepWithPrevious?: string[];
	/** optional: caption words to emphasise in green (others stay ink) */
	captionEmphasis?: string[];
	/** lead before a scene's first line (sec), default 0.12 */
	leadSec?: number;
};

export const resolveNarration = async (script: ScriptLine[], props: NarratedProps): Promise<Narration> => {
	const audioSec = props.voiceAudio ? await getAudioDurationInSeconds(staticFile(props.voiceAudio)) : undefined;
	if (props.alignment) {
		const json = await fetch(staticFile(props.alignment)).then((r) => r.json());
		return narrationFromWords(script, wordsFromAlignmentJson(json), audioSec);
	}
	const est = estimateNarration(script, {rate: props.tempRate});
	return audioSec ? scaleNarration(est, audioSec) : est;
};

export const makeCalculateMetadata =
	<Id extends string>(def: VideoDef<Id>): CalculateMetadataFunction<NarratedProps> =>
	async ({props}) => {
		const narration = await resolveNarration(def.script, props);
		const {durationInFrames} = buildSceneWindows(def.scenes, narration, story.fps, {tailSec: def.tailSec, leadSec: def.leadSec});
		// never cut the voiceover short: the video is at least as long as the audio
		const minFrames = Math.ceil(narration.durationSec * story.fps);
		return {durationInFrames: Math.max(durationInFrames, minFrames), props: {...props, narration}};
	};

export function NarratedVideo<Id extends string>({def, props}: {def: VideoDef<Id>; props: NarratedProps}) {
	const {fps, durationInFrames} = useVideoConfig();
	const narration = props.narration ?? estimateNarration(def.script, {rate: props.tempRate});
	const {windows} = React.useMemo(
		() => buildSceneWindows(def.scenes, narration, fps, {tailSec: def.tailSec, leadSec: def.leadSec}),
		[def, narration, fps],
	);
	// the last scene absorbs any extra frames (e.g. audio longer than the last word + tail)
	const last = windows[windows.length - 1];
	const lastExtra = Math.max(0, durationInFrames - last.end);
	const paletteAt = (f: number) => {
		let look = def.looks[windows[0].id];
		for (const w of windows) if (f >= w.boundary) look = def.looks[w.id];
		return look;
	};
	return (
		<AbsoluteFill style={{background: def.looks[windows[0].id]?.bg ?? editorial.bg}}>
			<SfxContext.Provider value={{enabled: props.sfx, master: props.sfxVolume}}>
				<TransitionSeries>
					{windows.map((w) => {
						const C: React.FC = def.components[w.id];
						const tr = def.transitions?.[w.id] ?? {presentation: slide({direction: 'from-bottom'}), timing: 'linear'};
						return (
							<React.Fragment key={w.id}>
								{w.transitionIn > 0 && (
									<TransitionSeries.Transition
										presentation={tr.presentation}
										timing={
											tr.timing === 'spring'
												? springTiming({config: {damping: 200}, durationInFrames: w.transitionIn})
												: linearTiming({durationInFrames: w.transitionIn})
										}
									/>
								)}
								<TransitionSeries.Sequence durationInFrames={w.durationInFrames + (w === last ? lastExtra : 0)} name={w.id}>
									<CueProvider narration={narration} sceneStartFrame={w.start}>
										<C />
									</CueProvider>
								</TransitionSeries.Sequence>
							</React.Fragment>
						);
					})}
				</TransitionSeries>
			</SfxContext.Provider>
			{props.captions && <Captions narration={narration} paletteAt={paletteAt} emphasis={def.captionEmphasis} keepWithPrevious={def.captionKeepWithPrevious} />}
			{props.voiceAudio && <Html5Audio src={staticFile(props.voiceAudio)} volume={props.voiceVolume} />}
		</AbsoluteFill>
	);
}
