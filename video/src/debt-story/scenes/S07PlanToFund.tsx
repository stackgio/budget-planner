import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, settle, shake, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {PlanCard} from '../props/Cards';
import {Jar} from '../props/Jar';
import {Doc} from '../props/Paper';
import {Svg} from '../Stage';
import {C} from '../theme';
import {VO} from '../timing';

const START = 506;
const L = (g: number) => g - START;
const DROP = L(VO.lifeDoesnt) - 1;
const IMPACT = DROP + 8;
const SHIFT = L(VO.thatsWhy) - 8; // mood change
const GROW = [L(VO.thatsWhy) + 10, L(VO.emergencyFund) - 4] as const;
/** Final jar placement (stage space); Scene 9 starts from here. */
export const JAR = {x: 640, base: 1420, w: 400, fill: 0.4};

const icon = (d: React.ReactNode) => (
	<svg width={48} height={48} viewBox="0 0 48 48" fill="none" stroke={C.green} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
		{d}
	</svg>
);
const PLAN = [
	{title: 'DEBT PAYMENTS', icon: icon(<><rect x={6} y={10} width={36} height={30} rx={5} /><path d="M 6 19 L 42 19 M 15 6 L 15 13 M 33 6 L 33 13" /></>), place: 4, scatter: {x: 170, y: 330, r: 18}},
	{title: 'MONTHLY BUDGET', icon: icon(<><circle cx={24} cy={24} r={17} /><path d="M 24 7 L 24 24 L 39 31" /></>), place: 13, scatter: {x: 400, y: 160, r: 28}},
	{title: 'SAVINGS GOAL', icon: icon(<><circle cx={24} cy={24} r={17} /><circle cx={24} cy={24} r={9} /><circle cx={24} cy={24} r={2} fill={C.green} /></>), place: 22, scatter: {x: -30, y: 300, r: -10}},
];
const SLOT = {x: 445, y0: 760, gap: 172};

export const S07PlanToFund: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = tw(f, 4, 14, 0, 1, easeOut);
	const sk = shake(f, IMPACT, 18, 22);
	const recede = tw(f, SHIFT, SHIFT + 22);
	const greenAmb = tw(f, SHIFT, SHIFT + 40);
	const punch = 1 + 0.07 * tw(f, IMPACT, IMPACT + 3) * tw(f, IMPACT + 3, IMPACT + 20, 1, 0.4);
	// slow push toward the jar for the solution beat
	const slowPush = 1 + 0.06 * tw(f, GROW[1], 238);

	const jarIn = tw(f, SHIFT + 8, SHIFT + 20, 0, 1, easeOut);
	const grow = tw(f, GROW[0], GROW[1], 0, 1);
	const jarS = lerp(0.42, 1, grow);
	const jx = lerp(850, JAR.x, grow);
	const jb = lerp(1000, JAR.base, grow);
	const fill = lerp(0.12, JAR.fill, tw(f, GROW[1] + 4, L(VO.reallyIs) + 2, 0, 1, (t) => t));

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: 6}), expr: 'determined'},
		{f: 5, pose: P({armF: [98, 0], armB: [-8, 8], lean: 6, head: 4}), expr: 'determined', dur: 5},
		{f: 10, pose: P({armF: [30, 20], armB: [-8, 8], head: 4}), expr: 'determined', dur: 5},
		{f: 14, pose: P({armF: [84, 4], armB: [-8, 8], lean: 6, head: 8}), expr: 'determined', dur: 5},
		{f: 19, pose: P({armF: [30, 20], armB: [-8, 8], head: 6}), expr: 'happy', dur: 5},
		{f: 23, pose: P({armF: [72, 6], armB: [-8, 8], lean: 8, head: 12}), expr: 'happy', dur: 5},
		{f: 32, pose: P({...POSES.thumbsUp, gaze: 0.8}), expr: 'happy', dur: 8},
		{f: IMPACT + 3, pose: P({...POSES.flinch}), expr: 'shocked', dur: 4, overshoot: true},
		{f: IMPACT + 18, pose: P({...POSES.handsOnHead}), expr: 'frustrated', dur: 8},
		{f: IMPACT + 40, pose: P({...POSES.slump, head: 26}), expr: 'sad', dur: 14},
		{f: SHIFT + 16, pose: P({...POSES.stand, head: -10}), expr: 'curious', dur: 10},
		{f: GROW[0] + 14, pose: P({...POSES.handChin, head: -2}), expr: 'curious', dur: 12},
		{f: GROW[1] + 8, pose: P({...POSES.thumbsUp, gaze: 0.8}), expr: 'relieved', dur: 12},
	]);
	const fx = f > GROW[1] + 8 ? ['sparkle' as const] : f > IMPACT + 18 && f < IMPACT + 46 ? ['tears' as const] : f > IMPACT && f < IMPACT + 18 ? ['shock' as const] : [];

	const scatter = tw(f, IMPACT, IMPACT + 18, 0, 1, easeOut);
	const bigY = lerp(-300, 1000, tw(f, DROP, IMPACT, 0, 1, easeIn));

	return (
		<AbsoluteFill style={{opacity: fadeIn * tw(f, 231, 235, 1, 0)}}>
			<AbsoluteFill style={{opacity: greenAmb, background: 'radial-gradient(ellipse 640px 700px at 640px 1150px, rgba(57,255,136,0.08), transparent 70%)'}} />
			<AbsoluteFill style={{transform: `translate(${sk.x}px, ${sk.y}px) scale(${punch * slowPush})`, transformOrigin: '640px 1100px'}}>
				{/* the plan (recedes when the mood shifts) */}
				<AbsoluteFill
					style={{
						transform: `scale(${1 - 0.14 * recede})`,
						transformOrigin: '600px 1150px',
						filter: recede > 0 ? `blur(${recede * 9}px) saturate(${1 - recede * 0.8})` : undefined,
						opacity: 1 - recede * 0.85,
					}}
				>
					<Svg>
						<rect x={-100} y={1460} width={1280} height={700} fill="#101412" />
						{/* corkboard on the wall */}
						<rect x={405} y={700} width={610} height={590} rx={14} fill="#3A2C1F" />
						<rect x={421} y={716} width={578} height={558} rx={8} fill="#8C6A47" />
						<rect x={421} y={716} width={578} height={558} rx={8} fill="#6E5236" opacity={0.35} />
						{/* desk */}
						<polygon points="360,1300 1060,1300 1090,1342 330,1342" fill="#5A3F2B" />
						<rect x={330} y={1342} width={760} height={118} fill="#2E2017" />
					</Svg>
					{PLAN.map((p, i) => {
						if (f < p.place) return null;
						const t = settle(f, p.place);
						const fall = f > IMPACT ? Math.pow(tw(f, IMPACT, IMPACT + 26), 2) * 60 : 0;
						const x = lerp(260, SLOT.x, t) + p.scatter.x * scatter;
						const y = lerp(SLOT.y0 + i * SLOT.gap + 60, SLOT.y0 + i * SLOT.gap, t) + p.scatter.y * scatter * 0.6 + fall;
						return (
							<div key={i} style={{position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${y}px) rotate(${p.scatter.r * scatter + (i - 1) * 1.5}deg) scale(${lerp(0.7, 1, t)})`, transformOrigin: '270px 75px', opacity: Math.min(1, t * 2)}}>
								<PlanCard paper title={p.title} icon={p.icon} checked={tw(f, p.place + 6, p.place + 12)} />
								<div style={{position: 'absolute', left: 258, top: -8, width: 22, height: 22, borderRadius: 11, background: C.red, boxShadow: '0 3px 6px rgba(0,0,0,0.5)', opacity: 1 - scatter}} />
							</div>
						);
					})}
					{f >= DROP ? (
						<Svg>
							<g transform={`translate(720 ${bigY}) rotate(${f >= IMPACT ? -5 : -14}) scale(2.7)`}>
								<Doc w={150} title="REPAIR BILL" accent={C.red} stamp="DUE NOW" />
							</g>
							{f >= IMPACT && f < IMPACT + 14
								? Array.from({length: 10}, (_, i) => {
										const a = (i / 10) * Math.PI * 2;
										const r = 160 + (f - IMPACT) * 24;
										return <line key={i} x1={720 + Math.cos(a) * r} y1={1000 + Math.sin(a) * r * 0.7} x2={720 + Math.cos(a) * (r + 40)} y2={1000 + Math.sin(a) * (r + 40) * 0.7} stroke={C.red} strokeWidth={6} strokeLinecap="round" opacity={1 - (f - IMPACT) / 14} />;
									})
								: null}
						</Svg>
					) : null}
				</AbsoluteFill>
				{/* emergency fund jar */}
				{jarIn > 0 ? (
					<Svg>
						<ellipse cx={jx} cy={jb + 6} rx={260 * jarS} ry={30 * jarS} fill={C.green} opacity={0.1 * grow} />
						<g transform={`translate(${jx} ${jb}) scale(${jarS})`} opacity={jarIn}>
							<Jar w={JAR.w} fill={fill} />
						</g>
					</Svg>
				) : null}
				<Svg>
					<Marcus opacity={tw(f, 224, 231, 1, 0)} x={lerp(220, 175, recede)} y={1460} scale={lerp(1.15, 1.02, recede)} pose={pose} expr={expr} frame={f + 506} fx={fx} seed={7} />
				</Svg>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
