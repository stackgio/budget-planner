import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOut, lerp, pop, settle, shake, tw} from '../anim';
import {animate, Marcus, P, POSES} from '../Marcus';
import {ExpenseCard, FundCard, PlanCard} from '../props/Cards';
import {Svg} from '../Stage';
import {C} from '../theme';
import {VO} from '../timing';

const START = 506;
const L = (g: number) => g - START;
const DROP = L(VO.lifeDoesnt) - 1; // big card starts falling
const IMPACT = DROP + 8;
const SHIFT = L(VO.thatsWhy) - 8; // mood change
/** Final emergency-fund card placement (Scene 9 starts from here). */
export const FUND_CENTER = {cx: 620, cy: 1010, w: 560};

const icon = (d: React.ReactNode) => (
	<svg width={48} height={48} viewBox="0 0 48 48" fill="none" stroke={C.green} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
		{d}
	</svg>
);
const PLAN = [
	{title: 'DEBT PAYMENTS', icon: icon(<><rect x={6} y={10} width={36} height={30} rx={5} /><path d="M 6 19 L 42 19 M 15 6 L 15 13 M 33 6 L 33 13" /></>), place: 4, scatter: {x: -420, y: 420, r: -38}},
	{title: 'MONTHLY BUDGET', icon: icon(<><circle cx={24} cy={24} r={17} /><path d="M 24 7 L 24 24 L 39 31" /></>), place: 13, scatter: {x: 380, y: 520, r: 26}},
	{title: 'SAVINGS GOAL', icon: icon(<><circle cx={24} cy={24} r={17} /><circle cx={24} cy={24} r={9} /><circle cx={24} cy={24} r={2} fill={C.green} /></>), place: 22, scatter: {x: -120, y: 640, r: -14}},
];
const SLOT = {x: 440, y0: 720, gap: 172};

export const S07PlanToFund: React.FC = () => {
	const f = useCurrentFrame();
	const fadeIn = tw(f, 4, 14, 0, 1, easeOut);
	const sk = shake(f, IMPACT, 16, 18);
	const recede = tw(f, SHIFT, SHIFT + 22);
	const greenAmb = tw(f, SHIFT, SHIFT + 40);

	// emergency fund card: small hint → grows to centre
	const cardIn = pop(f, SHIFT + 10, 16, 150);
	const grow = tw(f, L(VO.howImportant) - 10, L(VO.emergencyFund) - 4, 0, 1);
	const cardScale = lerp(0.36, 1, grow) * cardIn;
	const ccx = lerp(800, FUND_CENTER.cx, grow);
	const ccy = lerp(760, FUND_CENTER.cy, grow);
	const outline = tw(f, L(VO.emergencyFund) - 6, L(VO.emergencyFund) + 18, 0, 1, easeOut);
	const meter = tw(f, L(VO.emergencyFund), L(VO.reallyIs) + 4, 0, 0.78);

	const {pose, expr} = animate(f, [
		{f: 0, pose: P({...POSES.stand, head: 6}), expr: 'determined'},
		{f: 5, pose: P({armF: [98, 0], armB: [-8, 8], lean: 6, head: 4}), expr: 'determined', dur: 5},
		{f: 10, pose: P({armF: [30, 20], armB: [-8, 8], head: 4}), expr: 'determined', dur: 5},
		{f: 14, pose: P({armF: [84, 4], armB: [-8, 8], lean: 6, head: 8}), expr: 'determined', dur: 5},
		{f: 19, pose: P({armF: [30, 20], armB: [-8, 8], head: 6}), expr: 'happy', dur: 5},
		{f: 23, pose: P({armF: [72, 6], armB: [-8, 8], lean: 8, head: 12}), expr: 'happy', dur: 5},
		{f: 32, pose: P({...POSES.stand, head: 4}), expr: 'happy', dur: 8},
		{f: IMPACT + 3, pose: P({...POSES.flinch}), expr: 'shocked', dur: 4, overshoot: true},
		{f: IMPACT + 22, pose: P({...POSES.slump, head: 26}), expr: 'deadpan', dur: 14},
		{f: SHIFT + 16, pose: P({...POSES.stand, head: -10}), expr: 'curious', dur: 10},
		{f: L(VO.howImportant) + 6, pose: P({...POSES.handChin, head: -2}), expr: 'curious', dur: 12},
		{f: L(VO.emergencyFund) + 6, pose: P({...POSES.thumbsUp, gaze: 0.8}), expr: 'relieved', dur: 10, overshoot: true},
	]);

	const scatter = (i: number) => tw(f, IMPACT, IMPACT + 18, 0, 1, easeOut);
	const bigY = lerp(-500, 930, tw(f, DROP, IMPACT, 0, 1, easeIn));

	return (
		<AbsoluteFill style={{opacity: fadeIn}}>
			<AbsoluteFill style={{opacity: greenAmb, background: 'radial-gradient(ellipse 700px 700px at 620px 1000px, rgba(57,255,136,0.09), transparent 70%)'}} />
			<AbsoluteFill style={{transform: `translate(${sk.x}px, ${sk.y}px)`}}>
				{/* the plan (recedes when the mood shifts) */}
				<AbsoluteFill
					style={{
						transform: `scale(${1 - 0.14 * recede})`,
						transformOrigin: '600px 1100px',
						filter: recede > 0 ? `blur(${recede * 9}px) saturate(${1 - recede * 0.8})` : undefined,
						opacity: 1 - recede * 0.8,
					}}
				>
					<Svg>
						{/* desk the plan sits on */}
						<polygon points="380,1258 1050,1258 1080,1300 350,1300" fill="#2A2420" />
						<rect x={350} y={1300} width={730} height={40} fill="#1B1714" />
						<rect x={410} y={680} width={600} height={570} rx={22} fill="#121715" stroke="#1F2724" strokeWidth={3} />
					</Svg>
					{PLAN.map((p, i) => {
						if (f < p.place) return null;
						const t = settle(f, p.place);
						const sc = scatter(i);
						const fall = f > IMPACT ? Math.pow(tw(f, IMPACT, IMPACT + 26), 2) * 160 : 0;
						const x = lerp(260, SLOT.x, t) + p.scatter.x * sc;
						const y = lerp(SLOT.y0 + i * SLOT.gap + 60, SLOT.y0 + i * SLOT.gap, t) + p.scatter.y * sc * 0.6 + fall;
						return (
							<div key={i} style={{position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${y}px) rotate(${p.scatter.r * sc}deg) scale(${lerp(0.7, 1, t)})`, transformOrigin: '270px 75px', opacity: Math.min(1, t * 2)}}>
								<PlanCard title={p.title} icon={p.icon} checked={tw(f, p.place + 6, p.place + 12)} />
							</div>
						);
					})}
					{f >= DROP ? (
						<div style={{position: 'absolute', left: 0, top: 0, transform: `translate(400px, ${bigY}px) rotate(${f >= IMPACT ? -4 : -12}deg)`}}>
							<ExpenseCard w={620} title="UNEXPECTED EXPENSE" />
						</div>
					) : null}
					{f >= IMPACT && f < IMPACT + 14 ? (
						<Svg>
							{Array.from({length: 10}, (_, i) => {
								const a = (i / 10) * Math.PI * 2;
								const r = 60 + (f - IMPACT) * 22;
								return <line key={i} x1={710 + Math.cos(a) * r} y1={990 + Math.sin(a) * r * 0.6} x2={710 + Math.cos(a) * (r + 40)} y2={990 + Math.sin(a) * (r + 40) * 0.6} stroke={C.red} strokeWidth={5} strokeLinecap="round" opacity={1 - (f - IMPACT) / 14} />;
							})}
						</Svg>
					) : null}
				</AbsoluteFill>
				{/* emergency fund */}
				{cardIn > 0 ? (
					<>
						<Svg>
							{outline > 0 ? (
								<g>
									{[30, 56].map((pad, k) => {
										const w = FUND_CENTER.w + pad * 2;
										const h = FUND_CENTER.w * 0.62 + pad * 2;
										const per = 2 * (w + h);
										const p = tw(f, L(VO.emergencyFund) - 6 + k * 8, L(VO.emergencyFund) + 18 + k * 8, 0, 1, easeOut);
										return (
											<rect
												key={k}
												x={FUND_CENTER.cx - w / 2}
												y={FUND_CENTER.cy - h / 2}
												width={w}
												height={h}
												rx={34 + pad}
												fill="none"
												stroke={C.green}
												strokeWidth={k ? 2.5 : 4}
												strokeDasharray={per}
												strokeDashoffset={per * (1 - p)}
												opacity={(k ? 0.35 : 0.8) * (0.85 + 0.15 * Math.sin(f / 7))}
											/>
										);
									})}
								</g>
							) : null}
						</Svg>
						<div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${ccx - FUND_CENTER.w / 2}px, ${ccy - (FUND_CENTER.w * 0.62) / 2}px) scale(${cardScale})`, transformOrigin: `${FUND_CENTER.w / 2}px ${(FUND_CENTER.w * 0.62) / 2}px`}}>
							<FundCard w={FUND_CENTER.w} meter={meter} glow={0.4 + 0.6 * outline} />
						</div>
					</>
				) : null}
				<Svg>
					<Marcus opacity={tw(f, 224, 231, 1, 0)} x={lerp(220, 150, recede)} y={1450} scale={lerp(1.05, 0.92, recede)} pose={pose} expr={expr} frame={f + 506} seed={7} />
				</Svg>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
