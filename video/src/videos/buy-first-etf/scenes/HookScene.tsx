import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {DemoScrims, PhoneDemo} from '../../../story/components/PhoneDemo';
import {camAt} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {Chip, on, R, REC, REDACT} from '../ui';

/** HOOK — "YOUR FIRST INVESTMENT: $10" over Gio's real $10.01 order, readable on frame 0. */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tTen = cue('L2', 'ten', -0.1);
	const tEnd = cue('L2', undefined, 0, 'end');
	// quick, controlled push-in on the estimated cost, then a slow settle
	const cam = camAt(frame, [
		{at: 0, cx: 603, cy: 760, zoom: 1.0},
		{at: 16, cx: 603, cy: 900, zoom: 1.12},
		{at: tTen, cx: 603, cy: 920, zoom: 1.14},
		{at: tTen + 18, cx: 603, cy: 940, zoom: 1.2},
		{at: tEnd + 14, cx: 603, cy: 940, zoom: 1.22},
	]);
	const settle = sp(frame + 6, fps, 0, 'smooth');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={700} />
			<PhoneDemo {...REC} srcSec={10.45} camera={cam} focusY={960} windowTop={500} windowBottom={1380} minTop={455} redact={REDACT} marks={[{...R.estRow, p: on(frame, 10)}]} palette={P} />
			<DemoScrims top={480} bottom={1370} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: story.safe.top + 6, transform: `scale(${1.03 - 0.03 * settle})`, transformOrigin: '0 0'}}>
				<div style={{fontSize: 64, fontWeight: 900, letterSpacing: -1, color: P.ink, lineHeight: 1}}>YOUR FIRST INVESTMENT:</div>
				<div style={{fontSize: 200, fontWeight: 900, letterSpacing: -6, color: P.accent, lineHeight: 0.95, marginTop: 6}}>$10</div>
			</div>
			<Chip text={`${usd(FACTS.estCost.value)} ESTIMATED`} at={-30} x={540} y={1262} palette={P} size={52} />
			<Sfx at={tTen - 8} name="pop" volume={0.25} />
		</AbsoluteFill>
	);
};
