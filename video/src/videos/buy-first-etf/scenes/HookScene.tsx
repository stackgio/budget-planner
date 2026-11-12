import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {camAt, ScreenRecording} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {Chip, on, R, REC, REDACT} from '../ui';

const PH = {x: 220, top: 450, w: 640, h: 930};

/** HOOK — the real $10.01 order, readable on frame 0. Viewer learns: this is a real, tiny first order. */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tTen = cue('L2', 'ten', -0.1);
	const tEnd = cue('L2', undefined, 0, 'end');
	const cam = camAt(frame, [
		{at: 0, cx: 603, cy: 880, zoom: 1},
		{at: tTen, cx: 603, cy: 880, zoom: 1},
		{at: tTen + 22, cx: 603, cy: 900, zoom: 1.1},
		{at: tEnd + 10, cx: 603, cy: 900, zoom: 1.1},
	]);
	const settle = sp(frame + 8, fps, 0, 'smooth');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={500} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: story.safe.top + 4, textAlign: 'center', transform: `scale(${1.04 - 0.04 * settle})`}}>
				<div style={{fontSize: 112, fontWeight: 900, lineHeight: 0.98, letterSpacing: -2, color: P.ink}}>
					BUY YOUR<br />FIRST <span style={{color: P.accent}}>ETF</span>
				</div>
			</div>
			<ScreenRecording
				{...REC}
				w={PH.w}
				h={PH.h}
				srcSec={10.45}
				camera={cam}
				redact={REDACT}
				marks={[{...R.estRow, p: on(frame, 6)}]}
				style={{left: PH.x - 14, top: PH.top - 14}}
			/>
			<Chip text={`${usd(FACTS.estCost.value)} ESTIMATED`} at={-30} x={540} y={1180} palette={P} size={52} />
			<Sfx at={tTen} name="pop" volume={0.3} />
		</AbsoluteFill>
	);
};
