import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {HouseKey, Stamp} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';

/** Center of the key bow / thermostat — the match-cut anchor shared with JulyScene. */
export const ANCHOR = {x: 540, y: 820};

/**
 * L9 — "So boom": brisk CREDIT → APPROVED → KEYS. The keys get a dark
 * close-up and turn like in a lock; the turn match-cuts to the thermostat dial.
 */
export const KeysScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tCredit = cue('L9', 'credit');
	const tApprove = cue('L9', 'approves');
	const tKeys = cue('L9', 'keys.');
	const tFinally = cue('L9', 'finally');
	const c = sp(frame, fps, tCredit - 4, 'bouncy') * (1 - kf(frame, [tApprove - 6, tApprove - 1], [0, 1]));
	const check = kf(frame, [tCredit + 4, tCredit + 12], [0, 1]);
	const doc = sp(frame, fps, tApprove - 5, 'bouncy') * (1 - kf(frame, [tFinally - 2, tFinally + 4], [0, 1]));
	const dark = prog(frame, tFinally - 4, 12, E.inOut);
	const key = sp(frame, fps, tKeys - 10, 'heavy');
	const turn = kf(frame, [tKeys + 10, tKeys + 22], [0, 70], E.inOut);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg warm lightX={ANCHOR.x} lightY={ANCHOR.y} light={0.8 + 0.6 * dark} />
			{c > 0.01 && (
				<div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', opacity: Math.min(1, c * 1.5), transform: `scale(${0.6 + 0.4 * c})`}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 28, background: P.paper, borderRadius: 28, padding: '28px 48px', boxShadow: `0 20px 40px ${P.shadow}`}}>
						<div style={{fontSize: 112, fontWeight: 900, letterSpacing: -2, color: P.ink}}>CREDIT</div>
						<svg width="92" height="92" viewBox="0 0 92 92">
							<circle cx="46" cy="46" r="42" fill={P.accent} />
							<path d="M26,48 L40,62 L68,32" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="70" strokeDashoffset={70 * (1 - check)} />
						</svg>
					</div>
				</div>
			)}
			{doc > 0.01 && (
				<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: Math.min(1, doc * 1.5)}}>
					<div style={{position: 'absolute', left: 290, top: 520, width: 500, height: 560, background: '#fff', borderRadius: 20, boxShadow: `0 24px 40px ${P.shadow}`, transform: `translateY(${(1 - doc) * 80}px) rotate(-2deg)`, padding: 44}}>
						<div style={{fontSize: 34, fontWeight: 900, letterSpacing: 4, color: P.ink}}>MORTGAGE</div>
						{[0.9, 0.7, 0.82, 0.6, 0.76].map((f, i) => (
							<div key={i} style={{height: 14, width: `${f * 100}%`, background: P.line, borderRadius: 7, marginTop: 30}} />
						))}
					</div>
					<Stamp text="APPROVED" at={tApprove} color={P.accent} rot={-10} fontSize={92} style={{left: 540, top: 860}} />
				</div>
			)}
			{frame >= tKeys - 12 && (
				<div style={{opacity: Math.min(1, key * 2)}}>
					<HouseKey w={540} style={{left: ANCHOR.x + 0.28 * 540, top: ANCHOR.y, transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * key}) rotate(${-12 + (1 - key) * -30 + turn}deg)`, transformOrigin: '22% 50%'}} />
				</div>
			)}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1130, textAlign: 'center', opacity: kf(frame, [tKeys - 2, tKeys + 6], [0, 1]) * (1 - kf(frame, [tKeys + 14, tKeys + 20], [0, 1])), fontSize: 112, fontWeight: 900, color: '#F5F2EA', letterSpacing: 6}}>KEYS</div>
			<Sfx at={tCredit + 4} name="pop" volume={0.3} />
			<Sfx at={tApprove} name="stamp" volume={0.4} />
			<Sfx at={tKeys - 6} name="coin" volume={0.3} />
			<Sfx at={tKeys + 12} name="click" volume={0.5} />
		</AbsoluteFill>
	);
};
