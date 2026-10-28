import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, noise, pop, shake, tw} from '../anim';
import {HOOK_WARN} from '../layout';
import {animate, Marcus, P, POSES, type Joints} from '../Marcus';
import {Car} from '../props/Car';
import {TireIcon, Warn} from '../props/Icons';
import {Doc, Envelope} from '../props/Paper';
import {Cam, Svg} from '../Stage';
import {C, FONT} from '../theme';
import {VO} from '../timing';
import {CAR, Street, TIRE_SCREEN} from './S02FlatTire';

/*
 * 0.00–1.00  "I swear,"                      close-up: tyre squashing flat, repair bill slaps in
 * 1.03–2.60  "the moment you start paying…"  whip-zoom to Marcus hammering his DEBT block down
 * 2.92–4.17  "EVERYTHING decides to break."  setbacks crash in, the block grows back, Marcus loses it
 */
const CUT = 30;
const HITS = [42, 56, 70];
const BREAK = VO.everything;
const FLOOR = 1500;
const BLOCK = {x: 720, w: 380};

const Hammer: React.FC<{j: Joints; s: number}> = ({j, s}) => {
	const dx = j.handF.x - j.elbowF.x;
	const dy = j.handF.y - j.elbowF.y;
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;
	const L = 150 / s;
	const ex = j.handF.x + ux * L;
	const ey = j.handF.y + uy * L;
	const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
	return (
		<g>
			<line x1={j.handF.x - ux * 20} y1={j.handF.y - uy * 20} x2={ex} y2={ey} stroke="#8A6A4A" strokeWidth={11} strokeLinecap="round" />
			<g transform={`translate(${ex} ${ey}) rotate(${ang})`}>
				<rect x={-16} y={-38} width={44} height={76} rx={8} fill="#4A5357" stroke="#6E797D" strokeWidth={3} />
			</g>
		</g>
	);
};

export const S01Hook: React.FC = () => {
	const f = useCurrentFrame();

	// ---- A: close-up ----
	const flat = tw(f, 0, 16, 0.35, 1, easeOut);
	const zoomA = 2.15 + tw(f, 0, CUT, 0, 0.25) + tw(f, CUT - 4, CUT + 2, 0, 1.2, easeIn);
	const blurA = tw(f, CUT - 4, CUT + 2, 0, 18);
	const slap = tw(f, 4, 10, 0, 1, easeIn);
	const skA = shake(f, 10, 10, 18);

	// ---- B/C: debt block ----
	const inB = tw(f, CUT - 2, CUT + 8, 0, 1, easeOut);
	const hitsDone = HITS.filter((h) => f >= h).length;
	const shrink = 1 - 0.09 * hitsDone + HITS.reduce((a, h) => a + (f >= h ? 0.03 * Math.sin(Math.min(1, (f - h) / 6) * Math.PI) : 0), 0);
	const regrow = f >= BREAK + 10 ? 0.16 * pop(f, BREAK + 10, 9, 160) : 0;
	const blockS = shrink + regrow;
	const skC = shake(f, BREAK, 22, 20);
	const flash = tw(f, BREAK, BREAK + 3) * tw(f, BREAK + 3, BREAK + 20, 1, 0);

	const swing = (h: number) => [
		{f: h - 8, pose: P({lean: -8, head: -6, armF: [176, -24], armB: [150, -10], legB: [-14, 4], legF: [16, 6]}), expr: 'determined' as const, dur: 6},
		{f: h, pose: P({lean: 22, head: 8, armF: [92, 0], armB: [84, 4], legB: [-22, 6], legF: [24, 16]}), expr: 'determined' as const, dur: 4},
	];
	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand}), expr: 'determined'},
		...swing(HITS[0]),
		...swing(HITS[1]),
		...swing(HITS[2]),
		{f: HITS[2] + 10, pose: P({lean: 4, head: -6, armF: [40, 30], armB: [-10, 8]}), expr: 'happy', dur: 8},
		{f: BREAK + 4, pose: P({...POSES.flinch}), expr: 'shocked', dur: 4, overshoot: true},
		{f: BREAK + 22, pose: P({...POSES.handsOnHead}), expr: 'frustrated', dur: 8, overshoot: true},
	]);
	const holding = f < BREAK + 2;
	const fx = f >= BREAK + 22 ? (['steam', 'anger'] as const) : f >= BREAK ? (['shock'] as const) : f >= HITS[2] + 6 ? (['sparkle'] as const) : [];

	const crash = [
		{f: BREAK + 2, x: 760, y: 1120, rot: 10, kind: 'doc' as const},
		{f: BREAK + 7, x: 900, y: 1300, rot: -14, kind: 'env' as const},
		{f: BREAK + 12, x: 560, y: 1330, rot: 18, kind: 'env' as const},
	];

	return (
		<AbsoluteFill>
			{/* B/C */}
			{f >= CUT - 2 ? (
				<AbsoluteFill style={{opacity: inB, transform: `scale(${lerp(1.18, 1, inB)})`, transformOrigin: '540px 1150px', filter: inB < 1 ? `blur(${(1 - inB) * 14}px)` : undefined}}>
					<Cam x={skC.x} y={skC.y} rot={skC.r} zoom={1.3 + 0.05 * tw(f, CUT, BREAK) + 0.06 * pop(f, BREAK, 9, 240)} fx={520} fy={1460}>
						<AbsoluteFill style={{background: `radial-gradient(ellipse 800px 700px at 540px 1150px, ${f >= BREAK ? '#2A1414' : '#13201A'} 0%, ${C.bg} 75%)`}} />
						<Svg>
							<rect x={-100} y={FLOOR} width={1280} height={700} fill="#101412" />
							<line x1={-100} x2={1280} y1={FLOOR} y2={FLOOR} stroke="#26302C" strokeWidth={3} />
							{/* the DEBT block */}
							<g transform={`translate(${BLOCK.x} ${FLOOR}) scale(${blockS})`}>
								<rect x={-BLOCK.w / 2 + 8} y={-BLOCK.w + 10} width={BLOCK.w} height={BLOCK.w} rx={18} fill="#000" opacity={0.4} />
								<rect x={-BLOCK.w / 2} y={-BLOCK.w} width={BLOCK.w} height={BLOCK.w} rx={18} fill="#2A2D2E" stroke="#3E4344" strokeWidth={5} />
								<rect x={-BLOCK.w / 2} y={-BLOCK.w} width={BLOCK.w} height={44} rx={18} fill="#34383A" />
								{hitsDone > 0 ? <path d={`M ${-BLOCK.w / 2} -250 L -150 -230 L -170 -200 L -130 -170`} stroke="#151718" strokeWidth={5} fill="none" /> : null}
								{hitsDone > 1 ? <path d={`M ${-BLOCK.w / 2} -110 L -140 -120 L -120 -80`} stroke="#151718" strokeWidth={5} fill="none" /> : null}
								<text x={0} y={-BLOCK.w / 2 + 34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} letterSpacing={4} fill={C.red}>
									DEBT
								</text>
							</g>
							{/* chips + PAID pops */}
							{HITS.map((h, i) =>
								f >= h && f < h + 22 ? (
									<g key={i}>
										{Array.from({length: 6}, (_, k) => {
											const t = (f - h) / 22;
											const vx = -6 - noise(k + i * 9) * 8 - 6;
											const vy = -10 - Math.abs(noise(k * 3 + i)) * 10;
											return <rect key={k} x={BLOCK.x - (BLOCK.w / 2) * blockS + vx * (f - h)} y={1270 + vy * (f - h) + 0.9 * (f - h) ** 2} width={16} height={12} fill="#3E4344" opacity={1 - t} transform={`rotate(${k * 40} ${BLOCK.x - 190} 1270)`} />;
										})}
										<text x={BLOCK.x - 40 + i * 30} y={1040 - (f - h) * 5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill={C.green} opacity={1 - (f - h) / 22}>
											PAID
										</text>
									</g>
								) : null,
							)}
							<Marcus x={250} y={FLOOR + 6} scale={1.22} pose={pose} expr={expr} frame={f} fx={[...fx]} seed={1}>
								{(j) => (holding ? <Hammer j={j} s={1.22} /> : null)}
							</Marcus>
							{!holding ? (
								<g transform={`translate(${lerp(400, 430, tw(f, BREAK, BREAK + 8))} ${lerp(1260, FLOOR - 20, tw(f, BREAK, BREAK + 8, 0, 1, easeIn))}) rotate(${lerp(-40, 82, tw(f, BREAK, BREAK + 8))})`}>
									<line x1={-90} y1={0} x2={90} y2={0} stroke="#8A6A4A" strokeWidth={13} strokeLinecap="round" />
									<rect x={80} y={-44} width={52} height={88} rx={9} fill="#4A5357" stroke="#6E797D" strokeWidth={3} />
								</g>
							) : null}
							{/* setbacks crash in */}
							{crash.map((c, i) => {
								if (f < c.f) return null;
								const t = tw(f, c.f, c.f + 6, 0, 1, easeIn);
								return (
									<g key={i} transform={`translate(${c.x} ${lerp(200, c.y, t)}) rotate(${lerp(c.rot * 3, c.rot, t)}) scale(1.5)`}>
										{c.kind === 'doc' ? <Doc w={150} title="REPAIR BILL" accent={C.orange} /> : <Envelope w={170} label="BILL" />}
									</g>
								);
							})}
							{f >= BREAK + 4 ? (
								<g transform={`translate(${lerp(1300, 330, tw(f, BREAK + 4, BREAK + 16, 0, 1, easeOut))} ${FLOOR - 90 - Math.abs(Math.sin(tw(f, BREAK + 4, BREAK + 16) * Math.PI * 2)) * 60}) rotate(${-tw(f, BREAK + 4, BREAK + 16) * 520})`}>
									<TireIcon r={90} flat={false} />
								</g>
							) : null}
							{f >= BREAK ? (
								<g transform={`translate(${HOOK_WARN.x} ${HOOK_WARN.y}) scale(${pop(f, BREAK, 9, 260)})`}>
									<Warn size={150} glow={0.6} />
								</g>
							) : null}
						</Svg>
					</Cam>
					<AbsoluteFill style={{opacity: flash * 0.6, background: 'radial-gradient(ellipse 620px 1000px at 540px 1100px, transparent 40%, rgba(255,60,60,0.6) 100%)'}} />
				</AbsoluteFill>
			) : null}

			{/* A: close-up of the tyre */}
			{f < CUT + 2 ? (
				<AbsoluteFill style={{filter: blurA > 0 ? `blur(${blurA}px)` : undefined, opacity: tw(f, CUT - 1, CUT + 2, 1, 0)}}>
					<AbsoluteFill style={{background: C.bg}} />
					<Cam zoom={zoomA} fx={TIRE_SCREEN.x} fy={TIRE_SCREEN.y} x={520 - TIRE_SCREEN.x + skA.x} y={1150 - TIRE_SCREEN.y + skA.y}>
						<Svg>
							<Street p={0.2} />
							<g transform={`translate(${CAR.x} ${CAR.y}) scale(${CAR.s})`}>
								<Car flat={flat} id="h1" />
							</g>
							{[0, 1, 2].map((i) => {
								const t = ((f + i * 4) % 12) / 12;
								return (
									<path
										key={i}
										d={`M ${TIRE_SCREEN.x - 70 - t * 50} ${TIRE_SCREEN.y + 50 - i * 18} q -18 -6 -32 0`}
										stroke={C.white}
										strokeWidth={3}
										fill="none"
										strokeLinecap="round"
										opacity={(1 - t) * 0.7}
									/>
								);
							})}
						</Svg>
					</Cam>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse 600px 900px at 540px 1150px, transparent 50%, rgba(255,60,60,0.35) 100%)', opacity: 0.5 + 0.5 * Math.sin(f / 3)}} />
					<Svg>
						<Marcus x={175} y={2000} scale={2.1} pose={P({...POSES.handsOnHead, gaze: 0.8})} expr="shocked" frame={f} fx={['sweat', 'shock']} seed={1} />
						<g transform={`translate(${lerp(1400, 860, slap)} ${lerp(700, 1250, slap)}) rotate(${lerp(40, 9, slap)}) scale(2.3)`}>
							<Doc w={150} title="REPAIR BILL" accent={C.red} />
						</g>
					</Svg>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};
