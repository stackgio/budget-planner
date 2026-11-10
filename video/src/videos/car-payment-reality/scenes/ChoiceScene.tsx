import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS, usd} from '../facts';
import {CarKey, CoupeSilhouette, CX, HatchSilhouette, M} from '../parts';

/*
 * L11–L14: from cost to personal choice.
 *   L11–L12  a nice car, parked. Breathe. "GO FOR IT." on "go for it"
 *   L13      "But me personally": the key comes back; the nice car rolls out,
 *            a reliable used car rolls in → RELIABLE USED CAR
 *   L14      "driving a nice car": Gio's pick moves up; the nice car returns below,
 *            and on "stressed about money" the monthly bill lands beside it.
 */

const GROUND = 1010;

const Floor: React.FC<{y: number; o?: number}> = ({y, o = 1}) => (
	<div style={{position: 'absolute', left: 60, right: 60, top: y, height: 3, background: `linear-gradient(90deg, transparent, ${M.line} 15%, ${M.line} 85%, transparent)`, opacity: o}} />
);

export const ChoiceScene: React.FC = () => {
	const f = useCurrentFrame();
	const {cue, fps} = useCues();

	const tIf = cue('L12');
	const tGo = cue('L12', 'go');
	const tBut = cue('L13');
	const tMe = cue('L13', 'me');
	const tRather = cue('L13', "I'd");
	const tReliable = cue('L13', 'reliable');
	const tDriving = cue('L14', 'driving');
	const tStressed = cue('L14', 'stressed');
	const tEvery = cue('L14', 'every');

	/* nice car: parked from the start, rolls out left on "But" */
	const coupeIn = prog(f, 0, 24, E.out);
	const coupeOut = prog(f, tBut + 2, 18, E.in);
	const coupeX = mix(-120, 0, coupeIn) - 1100 * coupeOut;

	/* afford-it type */
	const affordIn = sp(f, fps, tIf + 4, 'snappy');
	const goIn = sp(f, fps, tGo - 2, 'bouncy');
	const textOut = prog(f, tBut, 8, E.in);

	/* key returns on "me personally" */
	const keyT = prog(f, tMe - 6, 16, E.in);
	const keySettle = sp(f, fps, tMe + 10, 'bouncy');
	const keyXY = arc(keyT, [1260, 80], [842, 452], 140);
	const keyRot = mix(140, -18, keyT) + (1 - keySettle) * 8;

	/* used car rolls in */
	const hatch = sp(f, fps, tRather - 4, 'heavy');
	const hatchX = mix(1200, 0, hatch);
	const relIn = sp(f, fps, tReliable - 2, 'snappy');

	/* L14: Gio's pick moves up, the nice car + monthly bill below */
	const up = prog(f, tDriving - 6, 18, E.inOut);
	const coupe2 = sp(f, fps, tDriving - 2, 'heavy');
	const bill = sp(f, fps, tStressed - 3, 'heavy');
	const stamp = sp(f, fps, tEvery - 1, {damping: 14, stiffness: 260, mass: 0.6});

	const pickScale = mix(1, 0.6, up);
	const pickY = mix(0, -150, up);

	return (
		<AbsoluteFill style={{background: M.bg}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 40% at 50% 55%, #17191D 0%, #0B0C0E 72%)'}} />

			{/* ── part 1: the nice car, breathing room ── */}
			{coupeOut < 1 && (
				<>
					<Floor y={GROUND} o={1 - coupeOut} />
					<div style={{position: 'absolute', left: CX - 410 + coupeX, top: GROUND - 280 + 8}}>
						<CoupeSilhouette w={820} />
					</div>
				</>
			)}
			{affordIn > 0 && textOut < 1 && (
				<div style={{position: 'absolute', left: 72, right: 120, top: 330, textAlign: 'center', fontFamily: M.font, fontWeight: 900, opacity: 1 - textOut}}>
					<div style={{fontSize: 58, color: M.ink, letterSpacing: 1, opacity: Math.min(1, affordIn), transform: `translateY(${(1 - affordIn) * 20}px)`}}>
						CAN COMFORTABLY AFFORD IT?
					</div>
					<div style={{fontSize: 118, color: M.green, letterSpacing: -2, marginTop: 14, opacity: Math.min(1, goIn * 1.5), transform: `scale(${mix(0.8, 1, goIn)})`}}>GO FOR IT.</div>
				</div>
			)}

			{/* ── part 2: Gio's pick (moves up on L14) ── */}
			{f >= tMe - 8 && (
				<div style={{position: 'absolute', inset: 0, transformOrigin: `${CX}px 300px`, transform: `translateY(${pickY}px) scale(${pickScale})`}}>
					{hatch > 0.001 && (
						<>
							<Floor y={GROUND} o={Math.min(1, hatch * 2)} />
							<div style={{position: 'absolute', left: CX - 390 + hatchX, top: GROUND - 300 + 8}}>
								<HatchSilhouette w={780} />
							</div>
						</>
					)}
					{relIn > 0 && (
						<div style={{position: 'absolute', left: 110, top: 330, fontFamily: M.font, fontWeight: 900, lineHeight: 1, opacity: Math.min(1, relIn * 1.5), transform: `translateX(${(1 - relIn) * -40}px)`}}>
							<div style={{fontSize: 104, color: M.green, letterSpacing: -2}}>RELIABLE</div>
							<div style={{fontSize: 104, color: M.ink, letterSpacing: -2, marginTop: 6}}>USED CAR</div>
						</div>
					)}
					<CarKey x={keyXY[0]} y={keyXY[1]} rot={keyRot} scale={0.9} />
				</div>
			)}

			{/* ── part 3: the nice car + the bill that comes every month ── */}
			{coupe2 > 0.001 && (
				<>
					<div style={{position: 'absolute', left: 90, right: 150, top: 800, height: 2, background: M.line, opacity: up}} />
					<Floor y={1330} o={Math.min(1, coupe2 * 2)} />
					<div style={{position: 'absolute', left: 60 + mix(-900, 0, coupe2), top: 1330 - 175 + 5}}>
						<CoupeSilhouette w={500} />
					</div>
				</>
			)}
			{bill > 0.001 && (
				<div
					style={{
						position: 'absolute',
						left: 640,
						top: kf(bill, [0, 1], [1500, 960]),
						width: 290,
						height: 330,
						background: M.paper,
						borderRadius: 6,
						transform: `rotate(${mix(14, 5, bill)}deg)`,
						boxShadow: '0 24px 40px rgba(0,0,0,0.6)',
						fontFamily: M.font,
						color: M.paperInk,
						padding: '26px 24px',
						boxSizing: 'border-box',
					}}
				>
					<div style={{fontSize: 24, fontWeight: 900, letterSpacing: 4, color: M.paperMuted}}>EXAMPLE BILL</div>
					<div style={{borderTop: `3px dashed ${M.paperLine}`, margin: '14px 0 18px'}} />
					<div style={{fontSize: 26, fontWeight: 800, letterSpacing: 3, color: M.paperMuted}}>TOTAL</div>
					<div style={{fontSize: 70, fontWeight: 900, letterSpacing: -3, lineHeight: 1.1, whiteSpace: 'nowrap'}}>
						{usd(FACTS.monthly.value)}
						<span style={{fontSize: 30, letterSpacing: 0}}>/MO</span>
					</div>
					{stamp > 0.001 && (
						<div
							style={{
								position: 'absolute',
								left: '50%',
								top: 262,
								transform: `translate(-50%,-50%) rotate(-10deg) scale(${mix(1.8, 1, Math.min(1, stamp))})`,
								opacity: Math.min(1, stamp * 1.8),
								border: `5px solid ${M.paperInk}`,
								borderRadius: 8,
								padding: '4px 12px',
								fontSize: 30,
								fontWeight: 900,
								letterSpacing: 3,
								color: M.paperInk,
								background: M.green,
								whiteSpace: 'nowrap',
							}}
						>
							EVERY MONTH
						</div>
					)}
				</div>
			)}

			<Sfx at={tMe - 6} name="whoosh-soft" volume={0.25} />
			<Sfx at={tMe + 9} name="click" volume={0.35} />
			<Sfx at={tBut + 2} name="whoosh" volume={0.2} />
			<Sfx at={tStressed - 3} name="paper" volume={0.35} />
			<Sfx at={tEvery - 1} name="stamp" volume={0.3} />
		</AbsoluteFill>
	);
};
