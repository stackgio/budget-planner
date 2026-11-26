import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {E, kf, sp} from '../../story/lib/motion';
import {dmm} from '../theme';

/**
 * Frame-0 hook stamp (creator rule 2026-11-26: a strong hook on every video).
 * Fully readable on frame 0, keeps moving (slow pulse) so the first second is never
 * static, then lifts away at `out`. Use one short idea: a big number/claim + a small line.
 */
export const HookStamp: React.FC<{small?: string; big: string; y: number; out: number; bigColor?: string; bigSize?: number}> = ({small, big, y, out, bigColor = dmm.color.accent, bigSize = 150}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const gone = kf(frame, [out, out + 12], [0, 1], E.in);
	if (gone >= 1) return null;
	const pulse = 1 + 0.035 * Math.sin(frame / 5);
	const pop = frame < 2 ? 1 : 1 + 0.06 * (1 - sp(frame, fps, 0, 'bouncy'));
	return (
		<div style={{position: 'absolute', left: dmm.safe.left, width: dmm.width - dmm.safe.left - dmm.safe.right, top: y, textAlign: 'center', fontFamily: dmm.font, opacity: 1 - gone, transform: `translateY(${-60 * gone}px)`}}>
			{small && <div style={{fontSize: 40, fontWeight: 900, letterSpacing: 2, color: dmm.color.ink, whiteSpace: 'nowrap'}}>{small}</div>}
			<div style={{fontSize: bigSize, fontWeight: 900, lineHeight: 1, letterSpacing: -4, color: bigColor, whiteSpace: 'nowrap', transform: `scale(${pulse * pop})`, textShadow: '0 0 40px rgba(54,217,121,0.35)'}}>{big}</div>
		</div>
	);
};
