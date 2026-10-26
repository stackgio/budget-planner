import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../../brand/theme';
import {clamp, ease, springAt, springs} from '../../lib/motion';

export type TimelineEvent = {date: string; label: string; detail?: string; at: number; highlight?: boolean};

type Props = {
	events: TimelineEvent[];
	/** Vertical spacing between events (px). */
	gap?: number;
	width?: number;
};

/**
 * Vertical timeline for 9:16. The spine grows toward each event as it is
 * reached; events land on their own frames (sync them to narration cues).
 */
export const Timeline: React.FC<Props> = ({events, gap = 240, width = 760}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ats = events.map((e) => e.at);
	const spine =
		events.length > 1
			? interpolate(frame, ats, events.map((_, i) => i * gap), {...clamp, easing: events.slice(1).map(() => ease.inOut)})
			: 0;
	const spineIn = interpolate(frame, [ats[0] - 8, ats[0]], [0, 1], clamp);
	return (
		<div style={{position: 'relative', width, height: (events.length - 1) * gap + 120, fontFamily: fonts.body}}>
			<div style={{position: 'absolute', left: 38, top: 20, width: 6, height: (events.length - 1) * gap, background: colors.line, borderRadius: 3, opacity: spineIn}} />
			<div style={{position: 'absolute', left: 38, top: 20, width: 6, height: spine, background: colors.green, borderRadius: 3, boxShadow: `0 0 18px ${colors.green}88`}} />
			{events.map((e, i) => {
				const s = springAt(frame, fps, e.at, springs.pop);
				const txt = springAt(frame, fps, e.at + 3, springs.soft, 14);
				const c = e.highlight ? colors.green : colors.white;
				return (
					<div key={i} style={{position: 'absolute', top: i * gap, left: 0, right: 0, display: 'flex', gap: 40, alignItems: 'flex-start'}}>
						<div
							style={{
								width: 82,
								height: 82,
								flexShrink: 0,
								borderRadius: 999,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								scale: interpolate(s, [0, 1], [0, 1]),
								background: colors.black,
								border: `6px solid ${frame >= e.at ? colors.green : colors.line}`,
							}}
						>
							<div style={{width: 26, height: 26, borderRadius: 99, background: c}} />
						</div>
						<div style={{opacity: txt, translate: `${(1 - txt) * 40}px 0px`, paddingTop: 4}}>
							<div style={{fontFamily: fonts.display, fontWeight: 900, fontSize: 60, color: c, letterSpacing: '-0.02em', lineHeight: 1}}>{e.date}</div>
							<div style={{fontWeight: 700, fontSize: 44, color: colors.white, marginTop: 8}}>{e.label}</div>
							{e.detail ? <div style={{fontWeight: 500, fontSize: 34, color: colors.muted, marginTop: 6}}>{e.detail}</div> : null}
						</div>
					</div>
				);
			})}
		</div>
	);
};
