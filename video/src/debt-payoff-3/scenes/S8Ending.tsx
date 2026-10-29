import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeIO, easeOut, pop, tw} from '../../debt-story/anim';
import {animate, Marcus, P, POSES, walk} from '../../debt-story/Marcus';
import {Svg} from '../../debt-story/Stage';
import {C, FONT} from '../../debt-story/theme';
import {at} from '../timing';
import {Kicker, Rise, SceneWin} from '../ui';

const TRACK = {x0: 150, x1: 930, y: 1046, h: 18};
const FLAG_X = 900;
const WALK = {x0: 210, x1: 450};
const SPEED = 4.4; // px / frame, matched to the stride at PHASE_RATE so the feet don't skate
const PHASE_RATE = 0.12;

/** Personal ending: Marcus walks the payoff track toward DEBT FREE; the two closing lines land. */
export const S8Ending: React.FC = () => {
	const f = useCurrentFrame();
	const w0 = at('working') + 4;
	const walkFrames = (WALK.x1 - WALK.x0) / SPEED;
	const w1 = w0 + walkFrames;
	const walking = f >= w0 && f < w1;
	const mx = f < w0 ? WALK.x0 : f >= w1 ? WALK.x1 : WALK.x0 + (f - w0) * SPEED;
	const amt = tw(f, w0, w0 + 6) * tw(f, w1 - 6, w1, 1, 0);
	const meterIn = pop(f, at('working') - 2, 16, 150, 0.9);
	const flag = pop(f, at('debtFree', 1), 12, 190, 0.8);

	const {pose, expr} = animate(f, [
		{f: 0, pose: POSES.stand, expr: 'determined'},
		{f: w1 + 8, pose: P({...POSES.stand, head: -14}), expr: 'determined', dur: 10},
		{f: at('notJust') + 6, pose: P({...POSES.handChin, head: -10}), expr: 'curious', dur: 10},
		{f: at('habits') + 4, pose: POSES.fistPump, expr: 'determined', dur: 9, overshoot: true},
	]);
	const p = walking || amt > 0 ? walk(pose, (f - w0) * PHASE_RATE, amt) : pose;

	const line1 = at('notJust') - 2;
	const line2 = at('changing') - 2;

	return (
		<SceneWin id="ending" enter="fade" exit="push" fy={900}>
			{/* closing lines (the tracker sits above) */}
			<div style={{position: 'absolute', left: 90, right: 90, top: 262, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 74, lineHeight: 1.06, letterSpacing: -2}}>
				<div style={{color: C.white, opacity: 1 - 0.35 * tw(f, line2, line2 + 10)}}>
					<div><Rise text="PAYING IT OFF" start={line1} stagger={2} /></div>
					<div><Rise text="IS ONE THING." start={line1 + 6} stagger={2} /></div>
				</div>
				<div style={{marginTop: 22, color: C.green}}>
					<div><Rise text="STAYING OUT" start={line2} stagger={2} color={C.green} /></div>
					<div><Rise text="IS THE GOAL." start={line2 + 6} stagger={2} color={C.green} /></div>
				</div>
			</div>

			{/* payoff meter */}
			<div style={{position: 'absolute', left: TRACK.x0, top: TRACK.y + 40, fontFamily: FONT, opacity: meterIn}}>
				<Kicker>START</Kicker>
			</div>
			<Svg>
				<g opacity={Math.min(1, meterIn * 1.5)}>
					<rect x={TRACK.x0} y={TRACK.y} width={TRACK.x1 - TRACK.x0} height={TRACK.h} rx={TRACK.h / 2} fill="rgba(245,247,245,0.08)" />
					<rect x={TRACK.x0} y={TRACK.y} width={mx - TRACK.x0} height={TRACK.h} rx={TRACK.h / 2} fill={C.green} />
					{/* a calm sweep shows "in progress" without inventing a percentage */}
					<rect x={TRACK.x0 + ((f * 6) % Math.max(1, mx - TRACK.x0 + 80)) - 80} y={TRACK.y} width={80} height={TRACK.h} fill="rgba(255,255,255,0.28)" clipPath="url(#fillclip)" />
					<defs>
						<clipPath id="fillclip">
							<rect x={TRACK.x0} y={TRACK.y} width={mx - TRACK.x0} height={TRACK.h} rx={TRACK.h / 2} />
						</clipPath>
					</defs>
					<text x={mx} y={TRACK.y + 66} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} letterSpacing={2} fill={C.green} opacity={tw(f, w1, w1 + 10)}>
						IN PROGRESS
					</text>
				</g>
				{/* DEBT FREE flag at the end of the track */}
				<g transform={`translate(${FLAG_X} ${TRACK.y})`} opacity={Math.min(1, flag * 1.5)}>
					<rect x={-4} y={-190 * flag} width={8} height={190 * flag} rx={4} fill={C.white} />
					<g transform={`translate(0 ${-190 * flag}) scale(${flag})`}>
						<path d="M 4 0 L -150 0 L -150 64 L 4 64 Z" fill={C.green} />
						<text x={-73} y={42} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={28} fill={C.bg}>
							DEBT FREE
						</text>
					</g>
				</g>
				<Marcus x={mx} y={TRACK.y - 2} scale={0.8} pose={p} expr={expr} frame={f} shadow={false} seed={5} idle={!walking} />
			</Svg>
		</SceneWin>
	);
};
