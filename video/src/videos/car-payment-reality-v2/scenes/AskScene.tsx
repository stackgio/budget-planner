import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {mix, sp} from '../../../story/lib/motion';
import {CX, M} from '../parts';

/* L15: the question card. Centered in the column clear of the platform buttons; holds after the voice ends. */
export const AskScene: React.FC = () => {
	const f = useCurrentFrame();
	const {cue, fps} = useCues();
	const tWhat = cue('L15', "what's");
	const tPay = cue('L15', 'willing'); // full card up well before the question ends

	const a = sp(f, fps, 2, 'snappy');
	const b = sp(f, fps, tWhat - 2, 'snappy');
	const c = sp(f, fps, tPay - 4, 'bouncy');

	const line = (k: number): React.CSSProperties => ({opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * 30}px)`});

	return (
		<AbsoluteFill style={{background: M.bg}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 40% at 50% 45%, #17191D 0%, #0B0C0E 72%)'}} />
			<div style={{position: 'absolute', left: CX - 430, width: 860, top: 470, textAlign: 'center', fontFamily: M.font, fontWeight: 900, color: M.ink, lineHeight: 1.02}}>
				<div style={{fontSize: 82, letterSpacing: -1, ...line(a)}}>WHAT&apos;S YOUR</div>
				<div style={{fontSize: 132, letterSpacing: -4, ...line(b)}}>
					<span style={{color: M.green}}>MAX</span> CAR
				</div>
				<div style={{fontSize: 132, letterSpacing: -4, ...line(b)}}>PAYMENT?</div>
				<div style={{marginTop: 70, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 10, ...line(c), transform: `scale(${mix(0.85, 1, c)})`}}>
					<span style={{fontSize: 120}}>$</span>
					<span style={{display: 'inline-block', width: 250, borderBottom: `12px solid ${M.green}`, height: 96}} />
					<span style={{fontSize: 72, color: M.muted, marginLeft: 12}}>/ mo</span>
				</div>
			</div>
			<Sfx at={tPay - 4} name="pop" volume={0.25} />
		</AbsoluteFill>
	);
};
