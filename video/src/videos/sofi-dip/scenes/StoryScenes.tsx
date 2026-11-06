import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg, EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {StoryGraph} from '../../../story/components/StoryGraph';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp, wobble} from '../../../story/lib/motion';
import {cinematic, editorial, story} from '../../../story/theme';
import {Label} from '../parts';

/** HYPOTHETICAL price path for the risk lesson — labelled EXAMPLE on screen. */
const EX = [100, 102, 99, 100, 96, 97, 93, 90, 91, 87, 85, 86, 80, 77, 79, 73, 70, 71, 65, 60];
const BUY_I = 12;

const SCREEN = {x: 585, y: 880, w: 330, h: 220};

const MiniChart: React.FC = () => {
	const pts = EX.slice(0, BUY_I + 1).map((v, i) => [SCREEN.x + 30 + (i / (EX.length - 1)) * (SCREEN.w - 60), SCREEN.y + 30 + ((105 - v) / 50) * (SCREEN.h - 60)]);
	return <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')} fill="none" stroke={editorial.danger} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />;
};

/** SCENE 6 — I'M STILL LEARNING: Marcus studies a chart on his laptop. */
export const LearnScene: React.FC = () => {
	const P = editorial;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t22 = cue('L9', '22,');
	const tLearn = cue('L9', 'learning');
	const tInv = cue('L9', 'investing.');
	const glow = 0.6 + 0.4 * Math.sin(frame / 9);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg floorY={1340} />
			<Camera
				keys={[
					// framed tight on the desk (no empty paper), slow push toward the laptop
					{at: 0, zoom: 1.22, x: 600, y: 1030},
					{at: tInv + 14, zoom: 1.32, x: 640, y: 1010, ease: E.soft},
				]}
			>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					{/* stool */}
					<rect x={262} y={1236} width={130} height={16} rx={6} fill="#2B2F36" />
					<path d="M285 1252L272 1340M370 1252L383 1340" stroke="#2B2F36" strokeWidth={10} strokeLinecap="round" />
					{/* desk */}
					<rect x={440} y={1130} width={580} height={20} rx={4} fill="#2B2F36" />
					<path d="M530 1150V1340M990 1150V1340" stroke="#2B2F36" strokeWidth={14} strokeLinecap="round" />
					{/* mug */}
					<rect x={940} y={1076} width={44} height={54} rx={8} fill={P.paper} stroke="#2B2F36" strokeWidth={5} />
					{/* laptop */}
					<rect x={SCREEN.x - 16} y={SCREEN.y - 16} width={SCREEN.w + 32} height={SCREEN.h + 32} rx={16} fill="#1B1E23" />
					<rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={6} fill="#0F1115" />
					{[0, 1, 2].map((i) => (
						<line key={i} x1={SCREEN.x + 30} x2={SCREEN.x + SCREEN.w - 30} y1={SCREEN.y + 60 + i * 55} y2={SCREEN.y + 60 + i * 55} stroke="#22262C" strokeWidth={2} />
					))}
					<MiniChart />
					<rect x={SCREEN.x - 50} y={1116} width={SCREEN.w + 100} height={14} rx={5} fill="#9AA1AB" />
					<path d={`M${SCREEN.x + 20},${SCREEN.y + SCREEN.h}L${SCREEN.x - 120},1300L${SCREEN.x + SCREEN.w + 120},1300L${SCREEN.x + SCREEN.w - 20},${SCREEN.y + SCREEN.h}Z`} fill={`rgba(44,212,122,${0.05 * glow})`} />
				</svg>
				<Marcus
					x={330}
					y={1340}
					scale={1.05}
					facing={1}
					seed={5}
					track={[
						{at: 0, pose: ['sit', {fs: 30, fe: 132, head: 10}], face: 'focused'},
						{at: t22 - 4, pose: ['sit', {fs: 30, fe: 132, head: -4}], face: 'smug'},
						{at: tLearn - 4, pose: 'sitType', face: 'focused', cycle: 'type'},
					]}
				/>
			</Camera>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, right: story.safe.right, opacity: 1}}>
				<KineticText text="22." at={t22 - 2} mode="slam" slamScale={0.35} fontSize={story.type.mega} color={P.accent} />
				<KineticText text="STILL LEARNING." at={tLearn - 6} mode="rise" fontSize={story.type.h1 + 10} color={P.ink} style={{marginTop: 4}} />
			</div>
			<Sfx at={t22 - 2} name="thud" volume={0.3} />
			<Sfx at={tLearn - 4} name="click" volume={0.25} />
			<Sfx at={tInv + 4} name="whoosh" volume={0.3} />
		</AbsoluteFill>
	);
};

/** SCENE 7 — THE REAL RISK: an EXAMPLE chart, a buy marker, and the drop continues. */
export const RiskScene: React.FC = () => {
	const P = editorial;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tDrops = cue('L10', 'drops');
	const tGood = cue('L10', 'good');
	const tIt = cue('L11', 'It');
	const tFall = cue('L11', 'fall');
	const tFurther = cue('L11', 'further.', 0, 'end');
	const G = {x: 60, y: 560, w: 830, h: 700, pad: {l: 40, r: 50, t: 30, b: 60}};
	const progress = frame < tFall ? kf(frame, [0, tDrops + 8], [0.05, BUY_I / (EX.length - 1)], E.soft) : kf(frame, [tFall, tFurther], [BUY_I / (EX.length - 1), 1], E.inOut);
	const yMax = 110;
	const PW = G.w - G.pad.l - G.pad.r;
	const PH = G.h - G.pad.t - G.pad.b;
	const bx = G.x + G.pad.l + (BUY_I / (EX.length - 1)) * PW;
	const by = G.y + G.pad.t + PH - (EX[BUY_I] / yMax) * PH;
	const ex = G.x + G.pad.l + PW;
	const ey = G.y + G.pad.t + PH - (EX[EX.length - 1] / yMax) * PH;
	const buy = sp(frame, fps, tGood - 4, 'bouncy');
	const wait = sp(frame, fps, tFall + 4, 'bouncy');
	const dash = prog(frame, tFall, 20, E.out);
	const tag = sp(frame, fps, 0, 'snappy');
	const worry = sp(frame, fps, tFurther - 10, 'snappy');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<Camera keys={[{at: 0, zoom: 1.0}, {at: tFall, zoom: 1.0}, {at: tFurther + 10, zoom: 1.04, x: 560, y: 960}]}>
				<div
					style={{
						position: 'absolute',
						left: story.safe.left,
						top: 450,
						padding: '8px 18px',
						borderRadius: 10,
						border: `3px solid ${P.ink}`,
						opacity: tag,
					}}
				>
					<Label color={P.ink} size={26}>
						Example · illustrative only
					</Label>
				</div>
				<StoryGraph w={G.w} h={G.h} style={{left: G.x, top: G.y}} palette={P} pad={G.pad} yMax={yMax} progress={progress} series={[{id: 'ex', values: EX, color: P.danger, fill: true}]} />
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					{dash > 0 && <line x1={bx} x2={bx + (G.x + G.w - G.pad.r - bx) * dash} y1={by} y2={by} stroke={P.accent} strokeWidth={4} strokeDasharray="12 10" />}
					<circle cx={bx} cy={by} r={30 * buy} fill="none" stroke={P.accent} strokeWidth={6} />
					<circle cx={bx} cy={by} r={14 * buy} fill={P.accent} />
				</svg>
				<div
					style={{
						position: 'absolute',
						left: bx,
						top: by - 120,
						transform: `translateX(-50%) scale(${buy})`,
						padding: '10px 22px',
						borderRadius: 14,
						background: P.accent,
						color: '#fff',
						fontSize: 36,
						fontWeight: 900,
						letterSpacing: 2,
						whiteSpace: 'nowrap',
					}}
				>
					BUY THE DIP?
				</div>
				{/* the other path: waiting — introduces the final question early */}
				<div
					style={{
						position: 'absolute',
						left: ex,
						top: ey + 34,
						transform: `translateX(-104%) scale(${wait})`,
						transformOrigin: '100% 0%',
						padding: '10px 22px',
						borderRadius: 14,
						background: P.danger,
						color: '#fff',
						fontSize: 36,
						fontWeight: 900,
						letterSpacing: 2,
						whiteSpace: 'nowrap',
					}}
				>
					WAIT FOR LOWER?
				</div>
			</Camera>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, right: story.safe.right}}>
				<KineticText text="A DROP ≠ A DEAL" at={-6} mode="rise" exitAt={tIt - 6} fontSize={story.type.display - 8} color={P.ink} colors={{'≠': P.danger}} />
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, right: story.safe.right}}>
				<KineticText text="IT COULD DROP MORE." at={tIt} mode="rise" fontSize={story.type.display - 8} color={P.ink} colors={{more: P.danger}} />
			</div>
			<Marcus
				x={955}
				y={story.ground}
				scale={0.95}
				facing={-1}
				seed={8}
				opacity={kf(frame, [tFall - 6, tFall + 6], [0, 1])}
				track={[
					{at: 0, pose: 'idle', face: 'curious'},
					{at: tFall, pose: 'think', face: 'curious'},
					{at: tFurther - 10, pose: 'worried', face: 'worried', spring: 'bouncy'},
				]}
			/>
			<Sfx at={tGood - 4} name="pop" volume={0.35} />
			<Sfx at={tFall} name="whoosh-soft" volume={0.3} />
			{worry > 0 && <Sfx at={tFurther - 10} name="thud" volume={0.25} />}
		</AbsoluteFill>
	);
};

/** wavy background line (purely decorative, no data) */
const Wave: React.FC<{x: number; w: number; y: number; slope: number; color: string; seed: number}> = ({x, w, y, slope, color, seed}) => {
	const frame = useCurrentFrame();
	const N = 24;
	const d = Array.from({length: N + 1}, (_, i) => {
		const px = x + (i / N) * w;
		const py = y + slope * (i / N) * 200 + wobble(frame + i * 9, seed + i, 1.2, 26);
		return `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`;
	}).join('');
	return <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" opacity={0.28} />;
};

/** SCENE 9 — THE AUDIENCE DECIDES. */
export const AskScene: React.FC = () => {
	const P = cinematic;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBuy = cue('L13', 'buy');
	const tOr = cue('L14', 'or');
	const tWait = cue('L14', 'wait');
	const tAdvice = cue('L15', 'This');
	const tResearch = cue('L16', 'Always');
	const L = sp(frame, fps, tBuy - 6, 'heavy');
	const R = sp(frame, fps, tWait - 6, 'heavy');
	const or = sp(frame, fps, tOr - 2, 'bouncy');
	const disc = sp(frame, fps, tAdvice - 4, 'snappy');
	const brand = sp(frame, fps, tResearch, 'snappy');
	const split = prog(frame, 0, 14, E.out);
	const side = (p: number, left: boolean) => {
		const color = left ? P.accent : P.danger;
		return (
			<div
				style={{
					position: 'absolute',
					left: left ? 0 : 540,
					width: 540,
					top: 0,
					bottom: 0,
					background: left ? `rgba(44,212,122,${0.1 * p})` : `rgba(255,91,72,${0.1 * p})`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: left ? story.safe.left : 60,
						right: left ? 50 : story.safe.right - 20,
						top: 560,
						opacity: p,
						transform: `translateY(${(1 - p) * 60}px)`,
					}}
				>
					<div style={{width: 80, height: 10, borderRadius: 5, background: color, marginBottom: 28}} />
					<div style={{fontSize: 96, fontWeight: 900, letterSpacing: -3, lineHeight: 0.98, color: P.ink}}>
						{left ? (
							<>
								BUY THE <span style={{color}}>DIP?</span>
							</>
						) : (
							<>
								WAIT FOR <span style={{color}}>LOWER?</span>
							</>
						)}
					</div>
				</div>
			</div>
		);
	};
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg light={0.5} lightX={540} lightY={760} warm={false} />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<Wave x={0} w={540} y={420} slope={-0.2} color={P.accent} seed={1} />
				<Wave x={0} w={540} y={1080} slope={-0.15} color={P.accent} seed={4} />
				<Wave x={540} w={540} y={360} slope={0.6} color={P.danger} seed={2} />
				<Wave x={540} w={540} y={1000} slope={0.5} color={P.danger} seed={6} />
			</svg>
			{side(L, true)}
			{side(R, false)}
			<div style={{position: 'absolute', left: 538, width: 4, top: 300, height: 840 * split, background: P.line}} />
			<div
				style={{
					position: 'absolute',
					left: 540 - 56,
					top: 420,
					width: 112,
					height: 112,
					borderRadius: 56,
					background: P.ink,
					color: P.bg,
					fontSize: 40,
					fontWeight: 900,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `scale(${or})`,
				}}
			>
				OR
			</div>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 48, top: 1150, textAlign: 'center', opacity: disc, transform: `translateY(${(1 - disc) * 16}px)`}}>
				<div style={{display: 'inline-block', padding: '14px 26px', borderRadius: 14, border: `2px solid ${P.line}`, background: 'rgba(11,12,14,0.7)'}}>
					<Label color={P.body} size={26}>
						Not financial advice · do your own research
					</Label>
				</div>
			</div>
			<BrandBug palette={P} opacity={0.75 * brand} text="@STACKWITHGIO" style={{left: 0, right: 48, justifyContent: 'center', top: 1290}} />
			<Sfx at={tBuy - 6} name="whoosh-soft" volume={0.3} />
			<Sfx at={tWait - 6} name="whoosh-soft" volume={0.3} />
			<Sfx at={tOr - 2} name="pop" volume={0.3} />
		</AbsoluteFill>
	);
};
