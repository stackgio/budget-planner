import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, shake, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS, SRC} from '../facts';
import {C, Kicker, NewsBg, Pct, ScaleBar, SourceTag} from '../ui';

/** Hook positions — DamageScene starts from exactly this framing (match cut). */
export const HOOK = {labelTop: 470, numTop: 560, numSize: 260, barTop: 870};

/**
 * HOOK — "The stock market just got absolutely crushed yesterday. / But what actually caused it?"
 * Frame 0: NASDAQ −5.5% fully readable. Viewer feels: shock → curiosity.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tCrushed = cue('L1', 'crushed');
	const tWhat = cue('L2', 'what');
	const tOut = cue('L3') - 10;
	const nas = Math.abs(FACTS.nasdaqPct.value);

	const bar = kf(frame, [2, 26], [0, nas], E.out);
	const hit = shake(frame, 1, 9, 14);
	const flash = kf(frame, [0, 18], [1.9, 1], E.out);
	const qIn = sp(frame, fps, tWhat - 2, 'snappy');
	const crushed = kf(frame, [tCrushed - 2, tCrushed + 6, tCrushed + 22], [0, 1, 0], E.out);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg tint="red" lightY={640} light={flash + crushed * 0.5} />
			<Camera
				keys={[
					{at: 0, zoom: 1.0, y: 760},
					{at: 22, zoom: 1.055, y: 760, ease: E.out},
					{at: tWhat - 4, zoom: 1.055, y: 760},
					{at: tWhat + 16, zoom: 1.0, y: 960},
				]}
				shakeX={hit.x}
				shakeY={hit.y}
			>
				<Kicker style={{left: story.safe.left, top: 300}}>NOV 5, 2026 · MARKET CLOSE</Kicker>
				<div style={{position: 'absolute', left: story.safe.left, top: HOOK.labelTop, fontSize: 64, fontWeight: 900, letterSpacing: 8, color: C.ink}}>NASDAQ</div>
				<div style={{position: 'absolute', left: story.safe.left - 10, top: HOOK.numTop, textShadow: `0 0 ${60 * (flash - 0.6)}px rgba(255,70,85,0.6)`}}>
					<Pct v={nas} size={HOOK.numSize} color={C.red} />
				</div>
				<ScaleBar value={bar} w={story.width - story.safe.left * 2} style={{left: story.safe.left, top: HOOK.barTop}} />
			</Camera>

			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 1060, opacity: qIn}}>
				<KineticText text="WHAT CAUSED THIS?" at={tWhat - 2} exitAt={tOut} fontSize={104} color={C.ink} colors={{'THIS?': C.red}} />
			</div>
			<SourceTag text={SRC.close} />
			<Sfx at={1} name="thud" volume={0.32} />
			<Sfx at={tWhat - 2} name="whoosh-soft" volume={0.22} />
		</AbsoluteFill>
	);
};
