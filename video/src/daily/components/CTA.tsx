import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {prog, sp} from '../../story/lib/motion';
import {dmm} from '../theme';

/**
 * End call-to-action card (creator rule 2026-11-26: a CTA on every video).
 * Appears when the narration speaks the CTA, then breathes gently until the last frame
 * (so the ending is never static). It replaces the plain signature: the brand is in the
 * button. `prompt` is the episode-specific action (comment / save / share / check …).
 */
export const CTACard: React.FC<{at: number; y: number; prompt: string; button?: string}> = ({at, y, prompt, button = 'FOLLOW STACK WITH GIO'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'bouncy');
	if (frame < at - 1) return null;
	const breathe = 1 + 0.03 * Math.sin((frame - at) / 7);
	const shine = ((frame - at) * 9) % 900;
	return (
		<div style={{position: 'absolute', left: dmm.safe.left, width: dmm.width - dmm.safe.left - dmm.safe.right, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, fontFamily: dmm.font, opacity: Math.min(1, p * 1.5)}}>
			<div style={{position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 26px 10px 12px', borderRadius: 999, background: dmm.color.accent, color: dmm.color.bg, transform: `scale(${(0.7 + 0.3 * p) * breathe})`}}>
				<div style={{width: 40, height: 40, borderRadius: 999, background: dmm.color.bg, color: dmm.color.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, lineHeight: 1}}>+</div>
				<div style={{fontSize: 32, fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap'}}>{button}</div>
				<div style={{position: 'absolute', top: 0, bottom: 0, left: shine - 120, width: 60, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))', transform: 'skewX(-20deg)'}} />
			</div>
			<div style={{fontSize: 26, fontWeight: 800, letterSpacing: 2, color: dmm.color.ink, whiteSpace: 'nowrap', opacity: prog(frame, at + 8, 10)}}>{prompt}</div>
		</div>
	);
};
