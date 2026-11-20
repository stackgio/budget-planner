import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {DeskSurface, DrawCheck, TopDownPhone} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, CaptionPlate, HEADER_TOP, L, R} from '../kit';

const PHONE = {w: 360, x: 540 - 180, y: 640};

/**
 * HOOK — "Just got paid? Do these five things…"
 * Frame 0: topic on screen (big green 5) and the phone already landing on the
 * desk. The screen wakes on "paid" with an editorial PAYCHECK DEPOSITED note
 * (no amount, no bank UI). Cut to the calendar on "before".
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tPaid = cue('L1', 'paid');
	const tFive = cue('L2', 'five');

	// phone is mid-drop on frame 0 and settles in ~8 frames
	const land = sp(frame, fps, -5, 'heavy');
	const lift = 1 - land;
	const wake = kf(frame, [tPaid - 2, tPaid + 4], [0, 1], E.out);
	const note = sp(frame, fps, tPaid + 3, 'snappy');
	const five = 1 + 0.07 * Math.sin(Math.PI * kf(frame, [tFive, tFive + 12], [0, 1], E.inOut));

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DeskSurface />

			{/* phone landing on the desk */}
			<TopDownPhone
				w={PHONE.w}
				awake={wake}
				rot={mix(-9, -4, land)}
				lift={lift}
				style={{left: PHONE.x + 30 * lift, top: PHONE.y - 60 * lift, transform: `rotate(${mix(-9, -4, land)}deg) scale(${1 + 0.1 * lift})`}}
			>
				<div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', color: C.white, fontSize: 96, fontWeight: 300, letterSpacing: -2}}>8:02</div>
				<div style={{position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center', color: C.grey, fontSize: 26, fontWeight: 700, letterSpacing: 3}}>FRIDAY</div>
				{/* generic notification placeholder: no app, no amount */}
				<div style={{position: 'absolute', top: 330, left: 22, right: 22, height: 96, borderRadius: 26, background: 'rgba(255,255,255,0.12)', opacity: note}} />
			</TopDownPhone>

			{/* editorial note tracked to the screen (not bank UI, no dollar amount) */}
			<div style={{position: 'absolute', left: 400, top: 1150, opacity: Math.min(1, note * 2), transform: `translateY(${(1 - note) * 18}px)`}}>
				<svg width={80} height={90} style={{position: 'absolute', left: -6, top: -78, overflow: 'visible'}}>
					<path d="M 40 4 L 40 80" stroke={C.green} strokeWidth={5} strokeLinecap="round" />
					<circle cx={40} cy={4} r={9} fill={C.green} />
				</svg>
				<div style={{display: 'flex', alignItems: 'center', gap: 16, background: C.black, color: C.white, padding: '18px 26px', borderRadius: 18, fontSize: 36, fontWeight: 900, letterSpacing: 3, boxShadow: '0 12px 28px rgba(0,0,0,0.25)', whiteSpace: 'nowrap'}}>
					<DrawCheck size={44} progress={kf(frame, [tPaid + 3, tPaid + 15], [0, 1], E.out)} />
					PAYCHECK DEPOSITED
				</div>
			</div>

			{/* topic, fully readable on frame 0 */}
			<div
				style={{
					position: 'absolute',
					left: L,
					top: HEADER_TOP,
					width: R - L,
					background: C.black,
					borderRadius: 26,
					padding: '26px 34px 30px 26px',
					display: 'flex',
					alignItems: 'center',
					gap: 26,
					boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
				}}
			>
				<div style={{fontSize: 300, fontWeight: 900, color: C.green, lineHeight: 0.8, letterSpacing: -12, transform: `scale(${five})`, transformOrigin: '50% 60%', marginTop: 8}}>5</div>
				<div style={{color: C.white, fontSize: 74, fontWeight: 900, lineHeight: 1.0, letterSpacing: -1.5}}>
					THINGS TO DO
					<br />
					WHEN YOU
					<br />
					GET PAID
				</div>
			</div>

			<CaptionPlate />
			<Sfx at={2} name="thud" volume={0.22} />
			<Sfx at={tPaid} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
