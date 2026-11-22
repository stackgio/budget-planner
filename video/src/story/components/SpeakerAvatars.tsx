import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useCues} from '../lib/cues';
import {mix} from '../lib/motion';
import {story} from '../theme';

export type Speaker = {id: string; label: string; initial: string; fill: string; ink: string};

/**
 * Faceless "who's talking" strip for dialogue videos: one icon avatar per
 * speaker. The active speaker lights up, its ring pulses on every spoken word
 * and a small equalizer runs next to the name; the other speaker dims.
 * Render it at video level (sceneStartFrame 0) so it never jumps on cuts.
 * `lineSpeaker` maps narration line ids to speaker ids.
 */
export const SpeakerAvatars: React.FC<{
	speakers: [Speaker, Speaker];
	lineSpeaker: Record<string, string>;
	y?: number;
	muted?: string;
}> = ({speakers, lineSpeaker, y = 182, muted = '#8B9197'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {narration} = useCues();
	const t = frame / fps;

	// active speaker: the line being spoken (held through the gap until the next line starts)
	let activeLine = narration.lines[0];
	for (const l of narration.lines) if (t >= l.start - 0.35) activeLine = l;
	const active = lineSpeaker[activeLine.id];
	const lineLive = t <= activeLine.end + 0.25 ? 1 : 0;

	// smooth "is talking" envelope per speaker, plus a per-word pulse
	const level = (id: string) => {
		const ls = narration.lines.filter((l) => lineSpeaker[l.id] === id);
		let on = 0;
		let pulse = 0;
		for (const l of ls) {
			const inLine = Math.min(1, Math.max(0, (t - (l.start - 0.35)) / 0.12), Math.max(0, (l.end + 0.25 - t) / 0.2));
			on = Math.max(on, inLine);
			for (const w of l.words) {
				const d = t - w.start;
				if (d >= -0.02 && d < 0.3) pulse = Math.max(pulse, 1 - d / 0.3);
			}
		}
		return {on, pulse};
	};

	return (
		<div
			style={{
				position: 'absolute',
				left: story.safe.left,
				right: story.safe.right,
				top: y,
				height: 112,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				fontFamily: story.font,
				pointerEvents: 'none',
			}}
		>
			{speakers.map((s, i) => {
				const {on, pulse} = level(s.id);
				const isActive = s.id === active;
				const a = Math.max(on, isActive ? 0.55 * lineLive : 0);
				const right = i === 1;
				return (
					<div key={s.id} style={{display: 'flex', alignItems: 'center', gap: 34, flexDirection: right ? 'row-reverse' : 'row', opacity: mix(0.38, 1, a)}}>
						<div style={{position: 'relative', width: 96, height: 96, transform: `scale(${mix(0.84, 1, a)})`}}>
							<div
								style={{
									position: 'absolute',
									inset: -10 - 10 * pulse * on,
									borderRadius: '50%',
									border: `4px solid ${s.fill}`,
									opacity: on * (0.35 + 0.65 * pulse),
								}}
							/>
							<div
								style={{
									position: 'absolute',
									inset: 0,
									borderRadius: '50%',
									background: s.fill,
									color: s.ink,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 48,
									fontWeight: 900,
									boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
								}}
							>
								{s.initial}
							</div>
						</div>
						<div style={{display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start', gap: 8}}>
							<div style={{fontSize: 32, fontWeight: 900, letterSpacing: 4, color: isActive && a > 0.5 ? '#FFFFFF' : muted}}>{s.label}</div>
							<div style={{display: 'flex', gap: 5, alignItems: 'flex-end', height: 24, opacity: on}}>
								{[0, 1, 2, 3].map((k) => {
									const h = 6 + 18 * on * Math.abs(Math.sin(frame * (0.42 + k * 0.11) + k * 1.7)) * (0.5 + 0.5 * pulse);
									return <div key={k} style={{width: 6, height: h, borderRadius: 3, background: s.fill}} />;
								})}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};
