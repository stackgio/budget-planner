import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {SRC} from '../facts';
import {Chip, DataCenter} from '../art';
import {C, Kicker, NewsBg, SourceTag} from '../ui';
import {DC} from './DataCenterScene';

/** Pipeline node centres — NvidiaScene irises out of the CHIPS node. */
export const NODE_Y = 760;
export const NODES = [
	{x: 152, label: 'CHIPS'},
	{x: 342, label: 'SERVERS'},
	{x: 532, label: 'POWER'},
	{x: 722, label: 'BUILDINGS'},
];
const RET_X = 892;

const Icon: React.FC<{i: number}> = ({i}) => {
	if (i === 0) return <Chip size={92} />;
	const stroke = {stroke: C.ink, strokeWidth: 6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	return (
		<svg width={92} height={92} viewBox="0 0 100 100">
			{i === 1 && (
				<g {...stroke}>
					<rect x={22} y={10} width={56} height={80} rx={6} />
					<path d="M32 30 H68 M32 50 H68 M32 70 H68" />
				</g>
			)}
			{i === 2 && <path d="M56 8 L24 56 H48 L40 92 L76 40 H52 Z" fill={C.green} />}
			{i === 3 && (
				<g {...stroke}>
					<path d="M12 90 V40 L50 16 L88 40 V90 Z M36 90 V62 H64 V90" />
				</g>
			)}
		</svg>
	);
};

/**
 * BILLIONS — "Why does that matter? Because companies are spending billions of dollars building AI
 * infrastructure, and investors are already questioning whether those investments will pay off."
 * Same racks as the previous shot (match cut) shrink into a money pipeline:
 * chips → servers → power → buildings → returns "?". No unsourced dollar total.
 */
export const BillionsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWhy = cue('L6');
	const tBil = cue('L7', 'billions');
	const tBuild = cue('L7', 'building');
	const tInfra = cue('L7', 'infrastructure');
	const tQ = cue('L7', 'questioning');
	const tPay = cue('L7', 'pay');

	// match-cut handoff: the data center from the previous shot recedes
	const recede = sp(frame, fps, 4, 'smooth');
	const dcOpacity = kf(frame, [tWhy + 10, tBil - 2], [1, 0]);
	const lineP = kf(frame, [tBil - 4, tInfra + 10], [0, 1], E.inOut);
	const nodeP = NODES.map((_, i) => sp(frame, fps, mix(tBil - 4, tInfra, i / 3), 'bouncy'));
	const retP = sp(frame, fps, tQ - 4, 'bouncy');
	const qPulse = kf(frame, [tPay, tPay + 6, tPay + 20], [0, 1, 0], E.out);
	const flowOn = frame > tBil;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg lightY={NODE_Y} light={0.8} />
			{dcOpacity > 0 && (
				<div
					style={{
						position: 'absolute',
						left: (story.width - DC.w) / 2,
						top: DC.top,
						opacity: dcOpacity,
						transformOrigin: '50% 60%',
						transform: `scale(${1 - 0.18 * recede}) translateY(${-40 * recede}px)`,
					}}
				>
					<DataCenter w={DC.w} frame={frame} px={-36} craneRun={0} stall={1 - recede} />
				</div>
			)}
			<Kicker style={{left: story.safe.left, top: 250, opacity: kf(frame, [tWhy - 4, tWhy + 6], [0, 1])}} color={C.ink}>
				WHY IT MATTERS
			</Kicker>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 330}}>
				<KineticText text="BILLIONS INVESTED" at={tBil - 2} fontSize={108} color={C.ink} colors={{INVESTED: C.green}} />
			</div>

			{/* pipeline */}
			<svg width={story.width} height={story.height} style={{position: 'absolute', inset: 0}}>
				<line x1={NODES[0].x} y1={NODE_Y} x2={NODES[0].x + (RET_X - NODES[0].x) * lineP} y2={NODE_Y} stroke={C.line} strokeWidth={8} strokeLinecap="round" />
				{flowOn &&
					Array.from({length: 9}, (_, k) => {
						const u = ((frame - tBil) * 0.012 + k / 9) % 1;
						const x = NODES[0].x + (RET_X - NODES[0].x) * u;
						if (u > lineP) return null;
						return <circle key={k} cx={x} cy={NODE_Y} r={7} fill={C.green} opacity={0.9 * Math.sin(Math.PI * u)} />;
					})}
			</svg>
			{NODES.map((n, i) => (
				<div key={n.label} style={{position: 'absolute', left: n.x - 80, top: NODE_Y - 80, width: 160, opacity: nodeP[i], transform: `scale(${0.6 + 0.4 * nodeP[i]})`}}>
					<div style={{width: 160, height: 160, borderRadius: 32, background: C.panel, border: `3px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 48px rgba(0,0,0,0.5)'}}>
						<Icon i={i} />
					</div>
					<div style={{marginTop: 18, marginLeft: -20, width: 200, textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: 1.5, color: C.body}}>{n.label}</div>
				</div>
			))}
			{/* returns? */}
			<div style={{position: 'absolute', left: RET_X - 44, top: NODE_Y - 56, width: 88, height: 112, opacity: retP, transform: `scale(${(0.5 + 0.5 * retP) * (1 + 0.12 * qPulse)})`, fontSize: 112, fontWeight: 900, color: C.red, textAlign: 'center', lineHeight: '112px'}}>
				?
			</div>
			<div style={{position: 'absolute', left: RET_X - 80, top: NODE_Y + 98, width: 160, textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: 1.5, color: C.red, opacity: retP}}>RETURNS</div>

			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 1060}}>
				<KineticText text="WILL IT PAY OFF?" at={tQ - 2} fontSize={104} color={C.ink} colors={{'OFF?': C.red}} />
			</div>
			<SourceTag text={SRC.roi} at={tBil} />
			<Sfx at={tBil - 2} name="cash" volume={0.2} />
			<Sfx at={tBuild} name="tick" volume={0.18} />
			<Sfx at={tQ - 2} name="pop" volume={0.22} />
		</AbsoluteFill>
	);
};
