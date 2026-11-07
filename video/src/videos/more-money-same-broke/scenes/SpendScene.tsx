import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {Kicker, NiceCar, ShopBag, TakeoutBag} from '../props';

export const METER = {x: story.safe.left, y: 300, w: 1080 - story.safe.left - story.safe.right, h: 60};
/** where the meter's "$0" lands — the next scene irises out from here */
export const ZERO_AT = {x: 840, y: 250};
const STAGE = {cx: 370, floor: 1300};

/**
 * THE SPENDING TRAP — "But what's the first thing you do? … gone too."
 * The extra $2,000 is a meter at the top. Each upgrade (car → takeout → shopping)
 * replaces the last in the same spot and bites a chunk out of the meter.
 * Illustrative only: no purchase prices, the meter simply runs to zero.
 */
export const SpendScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWhat = cue('L5', 'first');
	const tCar = cue('L6', 'nicer');
	const tMore = cue('L6', 'more');
	const tDash = cue('L6', 'DoorDash');
	const tShop = cue('L6', 'shopping');
	const tWhen = cue('L6', 'whenever');
	const tFeel = cue('L6', 'feel');
	const tLike = cue('L6', 'like');
	const tKnow = cue('L7', 'know');
	const tExtra = cue('L7', 'extra');
	const tGone = cue('L7', 'gone');

	// meter level: each purchase takes an (illustrative) bite; "gone" finishes it
	const bites: [number, number][] = [
		[tCar + 8, 0.42],
		[tDash + 4, 0.2],
		[tShop + 8, 0.16],
		[tFeel, 0.08],
		[tGone - 6, 0.14],
	];
	const level = 1 - bites.reduce((a, [t, b]) => a + b * prog(frame, t, 12, E.out), 0);
	const meterIn = sp(frame, fps, 0, 'smooth');

	// objects: car → takeout → shopping (each replaces the last on the same spot)
	const carIn = sp(frame, fps, tCar - 10, {damping: 22, stiffness: 70, mass: 1.2});
	const carOut = prog(frame, tMore - 6, 12, E.in);
	const foodIn = [tMore - 2, tDash - 2, tDash + 8].map((t) => sp(frame, fps, t, 'bouncy'));
	const foodOut = prog(frame, tShop - 6, 10, E.in);
	const shopIn = [tShop - 2, tShop + 4, tShop + 10].map((t) => sp(frame, fps, t, 'bouncy'));
	const toasts = [tWhen, tFeel, tLike].map((t) => sp(frame, fps, t - 2, 'snappy'));
	const shopDim = kf(frame, [tKnow, tKnow + 12], [0, 1]);
	const question = sp(frame, fps, tWhat - 4, 'bouncy') * (1 - prog(frame, tCar - 12, 8, E.in));

	const zero = sp(frame, fps, tGone + 2, 'heavy');
	const zeroHit = shake(frame, tGone + 4, 10, 14);
	const meterPulse = kf(frame, [tExtra, tExtra + 8, tExtra + 22], [0, 1, 0]);

	// chunks fly from the meter's edge to the object that ate them
	const chunk = (t: number) => {
		const f = prog(frame, t - 2, 16, E.inOut);
		if (f <= 0 || f >= 1) return null;
		const [x, y] = arc(f, [METER.x + METER.w * Math.max(level, 0.1), METER.y + METER.h / 2], [STAGE.cx, 980], -120);
		return <div key={t} style={{position: 'absolute', left: x - 30, top: y - 18, width: 60, height: 36, borderRadius: 10, background: P.accent, opacity: 1 - f * 0.6, transform: `scale(${1 - f * 0.5}) rotate(${f * 160}deg)`}} />;
	};

	const label = (text: string, p: number, out = 0) => (
		<Kicker
			color={P.ink}
			size={30}
			style={{
				position: 'absolute',
				left: STAGE.cx,
				top: 560,
				transform: `translateX(-50%) translateY(${(1 - p) * 20}px)`,
				opacity: Math.min(1, p) * (1 - out),
				background: P.paper,
				padding: '10px 22px',
				borderRadius: 14,
				boxShadow: `0 8px 16px ${P.shadow}`,
			}}
		>
			{text}
		</Kicker>
	);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg floorY={STAGE.floor} />
			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tCar, zoom: 1},
					{at: tCar + 20, zoom: 1.04, x: 470, y: 980, ease: E.out},
					{at: tKnow, zoom: 1.04, x: 470, y: 980},
					{at: tKnow + 20, zoom: 1, x: 540, y: 960},
				]}
				shakeX={zeroHit.x}
				shakeY={zeroHit.y}
			>
				{/* the extra $2,000 meter */}
				<div style={{position: 'absolute', left: METER.x, top: METER.y - 100, width: METER.w, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', opacity: meterIn}}>
					<Kicker>The extra</Kicker>
					<div style={{position: 'relative', fontSize: 64, fontWeight: 900, color: P.accent, letterSpacing: -2, lineHeight: 1}}>
						<span style={{opacity: 1 - zero * 0.75}}>{usd(FACTS.raise.value)}</span>
						<div style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 7, borderRadius: 4, background: P.danger, transformOrigin: '0 50%', transform: `scaleX(${zero})`}} />
					</div>
				</div>
				<div
					style={{
						position: 'absolute',
						left: METER.x,
						top: METER.y,
						width: METER.w,
						height: METER.h,
						borderRadius: METER.h / 2,
						background: P.line,
						overflow: 'hidden',
						opacity: meterIn,
						boxShadow: `0 0 ${30 * meterPulse}px rgba(30,158,87,${0.5 * meterPulse})`,
					}}
				>
					<div style={{width: METER.w * Math.max(0, level), height: '100%', borderRadius: METER.h / 2, background: '#3FCB7E'}} />
				</div>
				{/* $0 verdict */}
				<div
					style={{
						position: 'absolute',
						left: ZERO_AT.x - 150,
						top: METER.y + METER.h + 26,
						width: 300,
						textAlign: 'right',
						fontSize: 96,
						fontWeight: 900,
						color: P.danger,
						letterSpacing: -3,
						lineHeight: 1,
						opacity: Math.min(1, zero * 1.5),
						transform: `scale(${0.6 + 0.4 * zero})`,
						transformOrigin: '100% 0',
					}}
				>
					{usd(0)} <span style={{fontSize: 34, letterSpacing: 2}}>LEFT</span>
				</div>

				{/* "?" — what's the first thing you do */}
				<div
					style={{
						position: 'absolute',
						left: 640,
						top: 640,
						width: 120,
						height: 120,
						borderRadius: 60,
						background: P.gold,
						color: P.ink,
						fontSize: 84,
						fontWeight: 900,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transform: `scale(${question}) rotate(${(1 - question) * 30}deg)`,
					}}
				>
					?
				</div>

				{/* 1 · nicer car — rolls in from the left */}
				{carIn > 0.001 && carOut < 1 && (
					<>
						<NiceCar
							w={640}
							wheelSpin={(1 - carIn) * -540}
							style={{
								left: mix(-800, STAGE.cx - 320, carIn),
								top: STAGE.floor - 316,
								transform: `scale(${1 - carOut * 0.6}) translateY(${carOut * 120}px)`,
								opacity: 1 - carOut,
								transformOrigin: '50% 100%',
							}}
						/>
						{label('Nicer car', carIn, carOut)}
					</>
				)}

				{/* 2 · more delivery — bags keep landing (and stacking) */}
				{foodIn[0] > 0.001 && foodOut < 1 && (
					<>
						{[
							[STAGE.cx - 140, STAGE.floor - 276, -6],
							[STAGE.cx + 140, STAGE.floor - 276, 5],
							[STAGE.cx, STAGE.floor - 556, -2],
						].map(([x, y, r], i) => (
							<TakeoutBag
								key={i}
								w={240}
								style={{
									left: x - 120,
									top: mix(-400, y, foodIn[i]),
									transform: `rotate(${r}deg) scale(${1 - foodOut * 0.5})`,
									opacity: (foodIn[i] > 0.001 ? 1 : 0) * (1 - foodOut),
									transformOrigin: '50% 100%',
								}}
							/>
						))}
						{label('More delivery', foodIn[0], foodOut)}
					</>
				)}

				{/* 3 · shopping — bags pop up, orders keep coming */}
				{shopIn[0] > 0.001 && (
					<div style={{opacity: 1 - 0.45 * shopDim}}>
						{[
							[STAGE.cx - 180, 230, P.accent],
							[STAGE.cx, 280, P.gold],
							[STAGE.cx + 180, 230, P.danger],
						].map(([x, w, c], i) => (
							<ShopBag
								key={i}
								w={w as number}
								color={c as string}
								style={{
									left: (x as number) - (w as number) / 2,
									top: STAGE.floor - (w as number) * 1.15,
									transform: `scale(${shopIn[i]}) rotate(${(i - 1) * 4}deg)`,
									transformOrigin: '50% 100%',
								}}
							/>
						))}
						{label('Shopping', shopIn[0])}
						{toasts.map((p, i) => (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: STAGE.cx - 220,
									top: 680 + i * 84,
									width: 440,
									height: 70,
									borderRadius: 18,
									background: P.ink,
									color: '#F5F2EA',
									display: 'flex',
									alignItems: 'center',
									gap: 14,
									padding: '0 22px',
									boxSizing: 'border-box',
									fontSize: 30,
									fontWeight: 800,
									opacity: Math.min(1, p * 1.5),
									transform: `translateY(${(1 - p) * -30}px) scale(${0.9 + 0.1 * p})`,
								}}
							>
								<span style={{color: '#2CD47A', fontSize: 32}}>✓</span> Order placed
							</div>
						))}
					</div>
				)}

				{bites.slice(0, 4).map(([t]) => chunk(t))}

				<Marcus
					x={840}
					y={STAGE.floor}
					scale={1.0}
					facing={-1}
					seed={5}
					track={[
						{at: 0, pose: 'idle', face: 'happy'},
						{at: tWhat - 6, pose: 'think', face: 'curious'},
						{at: tCar + 2, pose: 'present', face: 'smug', spring: 'snappy'},
						{at: tMore, pose: ['point', {fs: 70, head: 8}], face: 'happy'},
						{at: tDash + 10, pose: 'fist', face: 'joy'},
						{at: tShop + 2, pose: 'celebrate', face: 'joy', cycle: 'cheer'},
						{at: tKnow - 2, pose: ['idle', {head: -18}], face: 'curious'},
						{at: tGone, pose: 'shock', face: 'shock', spring: 'bouncy'},
						{at: tGone + 24, pose: 'worried', face: 'worried'},
					]}
				/>
			</Camera>
			<Sfx at={tWhat - 4} name="pop" volume={0.3} />
			<Sfx at={tCar - 8} name="whoosh" volume={0.4} />
			<Sfx at={tCar + 8} name="cash" volume={0.35} />
			<Sfx at={tMore - 2} name="paper" volume={0.4} />
			<Sfx at={tDash + 4} name="cash" volume={0.3} />
			<Sfx at={tShop} name="pop" volume={0.35} />
			<Sfx at={tWhen} name="click" volume={0.35} />
			<Sfx at={tFeel} name="click" volume={0.35} />
			<Sfx at={tLike} name="click" volume={0.35} />
			<Sfx at={tGone + 2} name="thud" volume={0.5} />
		</AbsoluteFill>
	);
};
