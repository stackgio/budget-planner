import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, noise, shake, tw} from '../anim';
import {animate, Marcus, P, POSES, walk} from '../Marcus';
import {Doc, Envelope, Notif} from '../props/Paper';
import {Cam, Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';

const FLOOR = 1420;
const DOOR = {x: 100, y: 900, w: 210, h: FLOOR - 900};
const START = 270; // global frame of this scene
const L = (g: number) => g - START;

const BRO = L(VO.bro); // 16
const SLAM = BRO + 1;
const FREEZE = [BRO + 9, BRO + 25] as const;
const OUT = L(VO.out);
const NOT = L(VO.notCollect);

/** A tower of stacked paper with some bills poking out. `extra` adds sheets on top. */
const BillTower: React.FC<{f: number; extra: number[]}> = ({f, extra}) => {
	const sheets = 26;
	return (
		<g>
			<ellipse cx={0} cy={4} rx={170} ry={14} fill="#000" opacity={0.6} />
			{Array.from({length: sheets}, (_, i) => {
				const w = 250 + noise(i * 3.1) * 18;
				const x = noise(i * 7.7) * 14 - w / 2;
				return <rect key={i} x={x} y={-(i + 1) * 15} width={w} height={14} rx={2} fill={i % 3 === 0 ? '#E6E1D5' : i % 3 === 1 ? '#F3F0E8' : '#D9D4C7'} transform={`rotate(${noise(i * 2.3) * 1.6})`} />;
			})}
			<g transform="translate(-118 -150) rotate(-14)">
				<Envelope w={150} label="BILL" />
			</g>
			<g transform="translate(122 -300) rotate(11)">
				<Envelope w={140} label="DUE" />
			</g>
			<g transform="translate(-112 -380) rotate(-8)">
				<Doc w={110} title="REPAIR" accent={C.orange} />
			</g>
			<g transform="translate(30 -440) rotate(6)">
				<Doc w={150} title="INVOICE" stamp="PAST DUE" />
			</g>
			<g transform="translate(-150 -250) rotate(-10) scale(0.58)">
				<Notif w={420} title="Bill reminder" body="Another payment is coming up" />
			</g>
			{extra.map((ef, i) => {
				if (f < ef) return null;
				const t = tw(f, ef, ef + 7, 0, 1, easeIn);
				const y = lerp(-1400, -540 - i * 50, t);
				return (
					<g key={i} transform={`translate(${i ? 30 : -30} ${y}) rotate(${i ? 12 : -9})`}>
						{i ? <Doc w={140} title="BILL" /> : <Envelope w={170} label="BILL" />}
					</g>
				);
			})}
		</g>
	);
};

export const S05Blocked: React.FC = () => {
	const raw = useCurrentFrame();
	// comedic freeze: time stops for Marcus and the world
	const frozen = raw >= FREEZE[0] && raw < FREEZE[1];
	const f = frozen ? FREEZE[0] : raw;
	const panIn = tw(raw, 0, 8, 1080, 0, easeOut);
	const towerX = lerp(860, 380, tw(f, BRO - 7, SLAM, 0, 1, easeIn)) + (f >= SLAM ? -18 * Math.sin(Math.min(1, (f - SLAM) / 8) * Math.PI) * Math.exp(-(f - SLAM) / 10) : 0);
	const sk = shake(raw, SLAM, 14, 14);
	const doorGlow = 0.75 + 0.25 * Math.sin(raw / 9) + tw(raw, 108, 126, 0, 2.5, easeIn);
	const walking = tw(f, 2, 6) * tw(f, BRO - 2, BRO, 1, 0);
	const mx = lerp(700, 560, tw(f, 2, BRO, 0, 1, (t) => t)) + (f > BRO ? 22 * tw(f, BRO, BRO + 4, 0, 1, easeOut) : 0);

	const keyed = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: -4}), expr: 'determined'},
		{f: BRO - 1, pose: P({...POSES.stand}), expr: 'determined'},
		{f: BRO + 3, pose: P({...POSES.flinch}), expr: 'shocked', dur: 4, overshoot: true},
		{f: BRO + 9, pose: P({...POSES.armsUp}), expr: 'frustrated', dur: 6, overshoot: true},
		{f: OUT - 8, pose: P({...POSES.armsUp, armF: [110, 30], armB: [-110, -30]}), expr: 'frustrated', dur: 10},
		{f: OUT + 2, pose: P({...POSES.point, armF: [104, 2], head: -6, gaze: 0.5}), expr: 'frustrated', dur: 8, overshoot: true},
		{f: NOT + 2, pose: P({lean: 6, head: 4, armF: [70, 26], armB: [60, 34], gaze: 0.6}), expr: 'frustrated', dur: 8},
		{f: NOT + 22, pose: P({...POSES.shrug, gaze: 0}), expr: 'deadpan', dur: 10},
	]);
	const pose = walking > 0 ? walk(keyed.pose, f * 0.36, walking) : keyed.pose;

	return (
		<AbsoluteFill style={{transform: `translateX(${panIn}px)`, filter: panIn > 2 ? `blur(${Math.min(10, panIn / 60)}px)` : undefined}}>
			<Cam zoom={(frozen ? 1.09 : 1 + 0.03 * tw(raw, 40, 126)) * 1.3} fx={440} fy={1440} x={sk.x} y={sk.y}>
				<AbsoluteFill style={{filter: frozen ? 'grayscale(0.75) contrast(1.1)' : undefined}}>
					<Svg>
						<defs>
							<filter id="doorBlur" x="-60%" y="-60%" width="220%" height="220%">
								<feGaussianBlur stdDeviation={26} />
							</filter>
							<linearGradient id="floor5" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0" stopColor="#171D1B" />
								<stop offset="1" stopColor="#0B0D0C" />
							</linearGradient>
						</defs>
						<rect x={-200} y={FLOOR} width={1480} height={600} fill="url(#floor5)" />
						<line x1={-200} x2={1280} y1={FLOOR} y2={FLOOR} stroke="#26302C" strokeWidth={3} />
						{/* the debt-free door */}
						<ellipse cx={DOOR.x + DOOR.w / 2} cy={FLOOR + 6} rx={260} ry={34} fill={C.green} opacity={0.12 * doorGlow} />
						<rect x={DOOR.x - 14} y={DOOR.y - 14} width={DOOR.w + 28} height={DOOR.h + 14} rx={10} fill={C.green} opacity={0.5 * doorGlow} filter="url(#doorBlur)" />
						<rect x={DOOR.x - 12} y={DOOR.y - 12} width={DOOR.w + 24} height={DOOR.h + 12} rx={8} fill="none" stroke={C.green} strokeWidth={8} />
						<rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="#0F2A1C" />
						<rect x={DOOR.x + DOOR.w - 16} y={DOOR.y} width={16} height={DOOR.h} fill={C.green} opacity={0.85} />
						<rect x={DOOR.x + 22} y={DOOR.y + 26} width={DOOR.w - 60} height={190} rx={6} fill="none" stroke="#1D4A33" strokeWidth={5} />
						<rect x={DOOR.x + 22} y={DOOR.y + 250} width={DOOR.w - 60} height={210} rx={6} fill="none" stroke="#1D4A33" strokeWidth={5} />
						<circle cx={DOOR.x + DOOR.w - 40} cy={DOOR.y + 270} r={9} fill={C.green} />
						<g transform={`translate(${DOOR.x + DOOR.w / 2} ${DOOR.y - 66})`}>
							<rect x={-130} y={-34} width={260} height={68} rx={14} fill="#0E1A14" stroke={C.green} strokeWidth={3} />
							<text x={0} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill={C.green} letterSpacing={2}>
								DEBT FREE
							</text>
						</g>
						<g transform={`translate(${towerX} ${FLOOR})`}>
							<BillTower f={f} extra={[NOT + 4, NOT + 12]} />
						</g>
						<Marcus x={mx} y={FLOOR + 30} scale={1.15} facing={-1} pose={pose} expr={keyed.expr} frame={f + 270} idle={!frozen} fx={f >= NOT + 18 ? ['tears'] : f >= BRO + 6 ? ['anger', 'steam'] : f >= BRO ? ['shock'] : []} seed={5} />
						{/* impact lines on the slam */}
						{raw >= SLAM && raw < SLAM + 8
							? [0, 1, 2, 3].map((i) => (
									<line
										key={i}
										x1={towerX + 150}
										y1={1000 + i * 90}
										x2={towerX + 150 + 40 + (raw - SLAM) * 8}
										y2={990 + i * 90 - 20}
										stroke={C.white}
										strokeWidth={6}
										strokeLinecap="round"
										opacity={1 - (raw - SLAM) / 8}
									/>
								))
							: null}
					</Svg>
				</AbsoluteFill>
			</Cam>
			{/* freeze-frame accent */}
			{frozen ? (
				<AbsoluteFill style={{boxShadow: 'inset 0 0 0 14px rgba(245,247,245,0.85)', opacity: raw - FREEZE[0] < 2 ? 1 : 0.6}}>
					<AbsoluteFill style={{background: 'white', opacity: raw - FREEZE[0] < 2 ? 0.35 : 0}} />
				</AbsoluteFill>
			) : null}
			{/* door light floods into Scene 6 */}
			<AbsoluteFill
				style={{
					opacity: tw(raw, 112, 126, 0, 1, easeIn),
					background: `radial-gradient(circle at ${DOOR.x + DOOR.w / 2}px ${DOOR.y + 200}px, rgba(57,255,136,0.9) 0%, rgba(20,80,48,0.95) 40%, #07130D 100%)`,
				}}
			/>
		</AbsoluteFill>
	);
};
