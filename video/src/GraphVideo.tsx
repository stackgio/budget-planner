import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import './fonts';
import type {Spec} from './schema';
import {buildTimeline} from './lib/timeline';
import {theme} from './theme';
import {Header} from './components/Header';
import {Counter} from './components/Counter';
import {LineChart} from './components/LineChart';
import {ResultCard} from './components/ResultCard';
import {Brand} from './components/Brand';

export const GraphVideo: React.FC<Spec> = (spec) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tl = useMemo(() => buildTimeline(spec, fps), [spec, fps]);
	const f = Math.min(frame, tl.durationInFrames - 1);

	return (
		<AbsoluteFill style={{background: theme.bg[spec.background], fontFamily: theme.font, color: theme.ink}}>
			<LineChart spec={spec} tl={tl} frame={f} />
			<Header spec={spec} frame={f} questionFrame={tl.questionFrame} />
			<Counter spec={spec} tl={tl} frame={f} />
			<ResultCard spec={spec} frame={f} fps={fps} start={tl.resultFrame} />
			<Brand text={spec.brand} footnote={spec.footnote} />
		</AbsoluteFill>
	);
};
