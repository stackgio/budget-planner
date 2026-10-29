import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeOut, pop, tw} from '../../debt-story/anim';
import {animate, Marcus, P, POSES, walk} from '../../debt-story/Marcus';
import {Car, FRONT_WHEEL} from '../../debt-story/props/Car';
import {Street} from '../../debt-story/scenes/S02FlatTire';
import {Cam, Svg} from '../../debt-story/Stage';
import {C, FONT} from '../../debt-story/theme';
import {at, SCENES} from '../timing';
import {SceneWin} from '../ui';
import {ExpenseTag} from './S4Split';

// street authored in debt-story stage space; lifted by 230 px so the road clears the captions
const LIFT = 230;
const CAR = {x: 250, y: 1400 - LIFT, s: 1.25};
const TIRE = {x: CAR.x + FRONT_WHEEL.x * CAR.s, y: CAR.y + FRONT_WHEEL.y * CAR.s + 14};

/** Marcus by his car; the front tyre goes flat on "flat tire". */
export const S3Tire: React.FC = () => {
	const f = useCurrentFrame();
	const [from, to] = SCENES.tire;
	const d0 = at('tire');
	const flat = tw(f, d0, d0 + 18, 0, 1, (t) => 1 - Math.pow(1 - t, 2.2));
	const zoom = tw(f, d0 - 4, d0 + 34, 1, 1.22);
	const tag = pop(f, d0 + 24, 13, 190, 0.8);
	const ring = tw(f, d0 + 12, d0 + 22, 0, 1, easeOut);

	// walk-in: stride matched to scale (4.4 px/f at 0.8 → 5.6 px/f at 1.02)
	const W0 = from + 8;
	const MX0 = 40;
	const MX1 = 250;
	const wf = (MX1 - MX0) / 5.6;
	const mx = f < W0 ? MX0 : Math.min(MX1, MX0 + (f - W0) * 5.6);
	const amt = tw(f, W0, W0 + 5) * tw(f, W0 + wf - 5, W0 + wf, 1, 0);
	const {pose: base, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: -6}), expr: 'happy'},
		{f: d0 + 4, pose: P({...POSES.stand, head: 18, lean: 6}), expr: 'curious', dur: 6},
		{f: d0 + 14, pose: POSES.inspect, expr: 'shocked', dur: 9},
		{f: d0 + 28, pose: POSES.handsOnHead, expr: 'frustrated', dur: 10, overshoot: true},
	]);
	const pose = amt > 0 ? walk(base, (f - W0) * 0.12, amt) : base;

	return (
		<SceneWin id="tire" enter="push" exit="fade" drift={0}>
			<AbsoluteFill>
				<Cam zoom={zoom} fx={TIRE.x} fy={TIRE.y}>
					<Svg>
						<g transform={`translate(0 ${-LIFT})`}>
							<Street p={tw(f, from, to)} />
						</g>
						<g transform={`translate(${CAR.x} ${CAR.y}) scale(${CAR.s})`}>
							<Car flat={flat} id="dp3" />
						</g>
						{f > d0 && f < d0 + 26
							? [0, 1, 2].map((i) => {
									const t = ((f - d0 + i * 4) % 12) / 12;
									return (
										<path
											key={i}
											d={`M ${TIRE.x - 70 - t * 70} ${TIRE.y + 50 - i * 22} q -22 -8 -40 0`}
											stroke={C.white}
											strokeWidth={4}
											fill="none"
											strokeLinecap="round"
											opacity={(1 - t) * 0.6}
										/>
									);
								})
							: null}
						{ring > 0 ? (
							<g transform={`translate(${TIRE.x} ${TIRE.y + 6})`} opacity={ring}>
								<circle r={96 + (1 - ring) * 40} fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="20 12" transform={`rotate(${ring * 50})`} />
								<g transform="translate(0 -150)">
									<rect x={-62} y={-28} width={124} height={56} rx={14} fill={C.red} />
									<text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={32} fill={C.bg}>FLAT</text>
								</g>
							</g>
						) : null}
						<Marcus x={mx} y={1450 - LIFT} scale={1.02} pose={pose} expr={expr} frame={f} fx={f > d0 + 26 ? ['sweat'] : f > d0 + 12 ? ['shock'] : []} seed={2} />
					</Svg>
				</Cam>
			</AbsoluteFill>
			{/* the expense tag pops above the car, then carries over into the comparison (same position) */}
			<div style={{position: 'absolute', inset: 0, background: '#000', opacity: 0.25 * tw(f, d0 + 20, d0 + 30, 0, 1, easeOut), pointerEvents: 'none'}} />
			<ExpenseTag p={tag} />
		</SceneWin>
	);
};
