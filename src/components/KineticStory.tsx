import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SAFE_CENTER_WIDTH} from '../brand/theme';
import {clamp} from '../lib/motion';
import {msToFrames, type Narration} from '../lib/timing';
import {Background} from './Background';
import {Camera} from './Camera';
import {KineticText} from './KineticText';
import {Scene} from './Scene';

type Props = {
	narration: Narration;
	/** Words to color green (case-insensitive, punctuation ignored). */
	emphasize?: string[];
	/** Frame the story ends (e.g. where the end card starts). */
	endFrame: number;
};

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9$%']/g, '');

/**
 * Kinetic-typography video straight from narration.json: one line per beat,
 * every word lands on the frame it is spoken. Ideal for motivational and
 * quote-style shorts; layer character or data scenes on top as needed.
 */
export const KineticStory: React.FC<Props> = ({narration, emphasize = [], endFrame}) => {
	const {fps} = useVideoConfig();
	const emph = new Set(emphasize.map(clean));
	const lines = narration.lines;
	return (
		<AbsoluteFill>
			<GlowBackground endFrame={endFrame} />
			{lines.map((line, i) => {
				const from = i === 0 ? 0 : msToFrames(line.startMs, fps) - 3;
				const to = i < lines.length - 1 ? msToFrames(lines[i + 1].startMs, fps) - 3 : endFrame;
				const words = narration.words.filter((w) => w.startMs >= line.startMs - 1 && w.endMs <= line.endMs + 1);
				const size = words.length <= 4 ? 128 : words.length <= 8 ? 104 : 84;
				return (
					<Scene key={line.id} name={`Line ${line.id}`} from={from} to={to}>
						<Camera keys={[{frame: from, zoom: 1}, {frame: to, zoom: 1.05}]} drift={2}>
							<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
								<KineticText
									style={i % 2 ? 'pop' : 'rise'}
									fontSize={size}
									// Headroom for the 5% camera push so text never grows past the safe box.
									maxWidth={Math.round(SAFE_CENTER_WIDTH / 1.07)}
									exitAt={i < lines.length - 1 ? to - 6 : undefined}
									words={words.map((w, wi) => ({
										text: w.text.trim(),
										// New sentence, new line.
										br: wi < words.length - 1 && /[.!?]$/.test(w.text.trim()),
										at: msToFrames(w.startMs, fps) - 1,
										color: emph.has(clean(w.text)) ? colors.green : undefined,
									}))}
								/>
							</AbsoluteFill>
						</Camera>
					</Scene>
				);
			})}
		</AbsoluteFill>
	);
};

// The light drifts slowly across the frame so static moments still breathe.
const GlowBackground: React.FC<{endFrame: number}> = ({endFrame}) => {
	const frame = useCurrentFrame();
	const x = interpolate(frame, [0, endFrame], [30, 70], clamp);
	return <Background glow={{x, y: 40 + 8 * Math.sin(frame / 60), opacity: 0.16, size: 60}} />;
};
