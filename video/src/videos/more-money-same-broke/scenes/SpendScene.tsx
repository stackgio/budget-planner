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
import {FrontDoor, Hoodie, Kicker, NiceCar, Parcel, Phone, Sneaker, TakeoutBag} from '../props';

const FLOOR = 1300;
const MX = 880; // Marcus stays put; the world changes around him
/** meter (HUD, outside the camera): normal and hero placement */
const M = {x: story.safe.left, w: 1080 - story.safe.left - story.safe.right, y: 300, h: 64, heroY: 560, heroH: 112};
/** where "$0 LEFT" lands in the hero framing — the next scene irises out from here */
export const ZERO_AT = {x: 860, y: 750};
/** share of the extra $2,000 each purchase eats (illustrative, no prices). Sums to 1. */
const SHARE = {car: 0.4, food: 0.22, shop: 0.38};

/** world point → screen point for a settled camera framing */
const toScreen = (wx: number, wy: number, c: {x: number; y: number; z: number}): [number, number] => [540 + (wx - c.x) * c.z, 960 + (wy - c.y) * c.z];
const CAM = {
	wide: {x: 540, y: 960, z: 1},
	car: {x: 500, y: 1020, z: 1.02},
	door: {x: 690, y: 1090, z: 1.16},
	phone: {x: 430, y: 960, z: 1.08},
};

/**
 * THE SPENDING TRAP — "But what's the first thing you do? … gone too."
 * Three different shots for three different upgrades (street → front door →
 * phone close-up). The $2,000 raise is a HUD meter (green = unspent): each purchase becomes a
 * labelled segment eating the green, and a chunk flies from the meter to it.
 * On "Before you know it" the meter drops to centre stage and runs out on "gone".
 */
export const SpendScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWhat = cue('L5', 'first');
	const tCar = cue('L6', 'nicer');
	const tOrder = cue('L6', 'order');
	const tMore = cue('L6', 'more');
	const tDash = cue('L6', 'DoorDash');
	const tShop = cue('L6', 'shopping');
	const tWhen = cue('L6', 'whenever');
	const tFeel = cue('L6', 'feel');
	const tBefore = cue('L7', 'Before');
	const tKnow = cue('L7', 'know');
	const tExtra = cue('L7', 'extra');
	const tGone = cue('L7', 'gone');

	// ---- meter consumption (fractions of the extra $2,000)
	const pc = SHARE.car * prog(frame, tCar + 8, 16, E.out);
	const pf = SHARE.food * prog(frame, tMore + 6, 18, E.out);
	const ps = 0.18 * prog(frame, tShop + 8, 14, E.out) + 0.08 * prog(frame, tFeel + 4, 14, E.out) + (SHARE.shop - 0.26) * prog(frame, tGone - 10, 12, E.out);
	const green = Math.max(0, 1 - pc - pf - ps);
	const hero = prog(frame, tBefore - 4, 22, E.inOut);
	const my = mix(M.y, M.heroY, hero);
	const mh = mix(M.h, M.heroH, hero);
	const zero = sp(frame, fps, tGone + 2, 'heavy');
	const pulse = kf(frame, [tExtra, tExtra + 8, tExtra + 22], [0, 1, 0]);
	const hit = shake(frame, tGone + 4, 10, 14);

	// ---- moments
	const carIn = sp(frame, fps, tCar - 12, {damping: 24, stiffness: 60, mass: 1.2});
	const carOut = prog(frame, tOrder - 8, 16, E.in);
	const carX = mix(-900, 40, carIn) - 1100 * carOut;
	const doorIn = sp(frame, fps, tOrder - 6, 'smooth');
	const doorOut = prog(frame, tShop - 8, 12, E.in);
	const bags = [tMore - 2, tDash - 2, tDash + 6].map((t) => sp(frame, fps, t, 'bouncy'));
	const phoneIn = sp(frame, fps, tShop - 8, 'bouncy');
	const taps = [tShop, tFeel - 2];
	const tapDip = Math.max(...taps.map((t) => kf(frame, [t, t + 3, t + 9], [0, 1, 0])));
	const ordered = taps.map((t) => kf(frame, [t + 2, t + 4, t + 18, t + 22], [0, 1, 1, 0]));
	const cart = taps.filter((t) => frame >= t + 4).length;
	const productSlide = prog(frame, tWhen - 4, 10, E.inOut);
	const parcels = taps.map((t) => prog(frame, t + 6, 20, E.inOut));
	const question = sp(frame, fps, tWhat - 4, 'bouncy') * (1 - prog(frame, tCar - 14, 8, E.in));
	const dim = 1 - 0.95 * hero;

	// camera: wide → track the car → push to the door → pan to the phone → back wide
	const camKeys = [
		{at: 0, zoom: CAM.wide.z, x: CAM.wide.x, y: CAM.wide.y},
		{at: tCar - 12, zoom: CAM.car.z, x: 360, y: CAM.car.y},
		{at: tCar + 16, zoom: CAM.car.z, x: CAM.car.x, y: CAM.car.y, ease: E.out},
		{at: tOrder - 6, zoom: CAM.car.z, x: CAM.car.x, y: CAM.car.y},
		{at: tMore + 2, zoom: CAM.door.z, x: CAM.door.x, y: CAM.door.y},
		{at: tShop - 8, zoom: CAM.door.z, x: CAM.door.x, y: CAM.door.y},
		{at: tShop + 6, zoom: CAM.phone.z, x: CAM.phone.x, y: CAM.phone.y},
		{at: tBefore - 4, zoom: CAM.phone.z, x: CAM.phone.x, y: CAM.phone.y},
		{at: tBefore + 18, zoom: CAM.wide.z, x: CAM.wide.x, y: CAM.wide.y},
	];

	// chunk: meter edge → purchase (screen space)
	const chunk = (t: number, to: [number, number], key: string) => {
		const f = prog(frame, t, 16, E.inOut);
		if (f <= 0 || f >= 1) return null;
		const [x, y] = arc(f, [M.x + M.w * Math.max(green, 0.08), M.y + M.h / 2], to, -140);
		return <div key={key} style={{position: 'absolute', left: x - 34, top: y - 20, width: 68, height: 40, borderRadius: 10, background: '#3FCB7E', opacity: 1 - f * 0.5, transform: `scale(${1 - f * 0.45}) rotate(${f * 160}deg)`}} />;
	};

	// one labelled segment of the meter (right-aligned stack: car | food | shop)
	const seg = (from: number, width: number, color: string, label: string, short: string) => {
		if (width <= 0.001) return null;
		const px = width * M.w;
		return (
			<div key={label} style={{position: 'absolute', left: (1 - from - width) * M.w, top: 0, width: px, height: '100%', background: color, borderLeft: '3px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
				<span style={{fontSize: mix(26, 34, hero), fontWeight: 900, letterSpacing: 2, color: '#fff', whiteSpace: 'nowrap', opacity: px > 90 ? 1 : 0}}>{px > 200 ? label : short}</span>
			</div>
		);
	};

	// moment tag (HUD): 1 · NICER CAR / 2 · MORE DELIVERY / 3 · SHOPPING
	const tag = (n: number, text: string, a: number, b: number) => {
		const p = sp(frame, fps, a, 'snappy') * (1 - prog(frame, b, 8, E.in));
		if (p <= 0.001) return null;
		return (
			<div key={n} style={{position: 'absolute', left: story.safe.left, top: 400, display: 'flex', alignItems: 'center', gap: 16, opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * -40}px)`}}>
				<div style={{width: 60, height: 60, borderRadius: 16, background: P.ink, color: '#fff', fontSize: 34, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
				<Kicker color={P.ink} size={34}>{text}</Kicker>
			</div>
		);
	};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg floorY={FLOOR} />
			<Camera keys={camKeys} shakeX={hit.x} shakeY={hit.y}>
				<div style={{position: 'absolute', inset: 0, opacity: dim, transform: `translateY(${hero * 80}px)`}}>
					{/* "?" — what's the first thing you do */}
					<div style={{position: 'absolute', left: 700, top: 690, width: 120, height: 120, borderRadius: 60, background: P.gold, color: P.ink, fontSize: 84, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${question}) rotate(${(1 - question) * 30}deg)`}}>?</div>

					{/* A · the car: a street shot, rolls in and later drives off */}
					{carIn > 0.001 && carOut < 1 && (
						<>
							<div style={{position: 'absolute', left: -200, right: -200, top: FLOOR + 30, height: 8, background: `repeating-linear-gradient(90deg, ${P.line} 0 80px, transparent 80px 140px)`, transform: `translateX(${(carX % 140)}px)`}} />
							<NiceCar w={760} wheelSpin={carX * 1.2} style={{left: carX, top: FLOOR - 372}} />
						</>
					)}

					{/* B · the front door: takeout keeps arriving */}
					{doorIn > 0.001 && doorOut < 1 && (
						<div style={{opacity: Math.min(1, doorIn * 1.5) * (1 - doorOut)}}>
							<FrontDoor w={210} open={kf(frame, [tMore - 10, tMore - 2], [0, 1])} style={{left: MX - 105, top: FLOOR - 441}} />
							{[
								[600, FLOOR - 236, -5],
								[460, FLOOR - 236, 6],
								[530, FLOOR - 470, -2],
							].map(([x, y, r], i) => (
								<TakeoutBag key={i} w={190} style={{left: x - 95, top: mix(FLOOR - 1100, y, bags[i]), opacity: bags[i] > 0.001 ? 1 : 0, transform: `rotate(${r}deg)`, transformOrigin: '50% 100%'}} />
							))}
						</div>
					)}

					{/* C · the phone close-up: BUY NOW, twice */}
					{phoneIn > 0.001 && (
						<>
							<Phone w={380} style={{left: 110, top: mix(1500, 520, phoneIn), transform: `rotate(${-4 + 4 * (1 - phoneIn)}deg) scale(${1 - 0.03 * tapDip})`}}>
								<div style={{position: 'absolute', left: 22, right: 22, top: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
									<div style={{fontSize: 34, fontWeight: 900, color: P.ink}}>Shop</div>
									<div style={{position: 'relative', fontSize: 30, fontWeight: 900, color: P.ink}}>
										CART
										<div style={{position: 'absolute', right: -22, top: -18, width: 40, height: 40, borderRadius: 20, background: P.danger, color: '#fff', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: cart > 0 ? 1 : 0, transform: `scale(${1 + 0.3 * tapDip})`}}>{cart}</div>
									</div>
								</div>
								<div style={{position: 'absolute', left: 22, right: 22, top: 90, height: 330, borderRadius: 22, background: P.bg2, overflow: 'hidden'}}>
									<div style={{position: 'absolute', left: 44 - 340 * productSlide, top: 30}}>
										<Hoodie w={250} color={P.accent} />
									</div>
									<div style={{position: 'absolute', left: 44 + 340 * (1 - productSlide), top: 30}}>
										<Sneaker w={250} color={P.gold} />
									</div>
								</div>
								<div style={{position: 'absolute', left: 22, top: 446, width: 200, height: 18, borderRadius: 9, background: P.line}} />
								<div style={{position: 'absolute', left: 22, top: 478, width: 130, height: 18, borderRadius: 9, background: P.line}} />
								{(() => {
									const o = Math.max(...ordered);
									return (
										<div style={{position: 'absolute', left: 22, right: 22, bottom: 30, height: 96, borderRadius: 24, background: o > 0.5 ? P.ink : P.accent, color: '#fff', fontSize: 36, fontWeight: 900, letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.06 * tapDip})`}}>
											{o > 0.5 ? 'ORDERED ✓' : 'BUY NOW'}
										</div>
									);
								})()}
							</Phone>
							{/* parcels pile up next to Marcus */}
							{parcels.map((f, i) => {
								if (f <= 0) return null;
								const [x, y] = arc(f, [300, 1160], [620 + i * 30, FLOOR - 76 - i * 104], 260);
								return <Parcel key={i} w={170} style={{left: x - 85, top: y - 30, transform: `rotate(${(1 - f) * 200 + (i ? -4 : 3)}deg)`}} />;
							})}
						</>
					)}
				</div>

				<Marcus
					x={MX}
					y={FLOOR}
					scale={1.0}
					facing={-1}
					seed={5}
					opacity={1}
					track={[
						{at: 0, pose: 'idle', face: 'happy'},
						{at: tWhat - 6, pose: 'think', face: 'curious'},
						{at: tCar + 4, pose: 'present', face: 'smug', spring: 'snappy'},
						{at: tOrder - 2, pose: ['idle', {head: 6}], face: 'curious'},
						{at: tMore + 2, pose: 'hold', face: 'happy'},
						{at: tDash + 8, pose: 'fist', face: 'joy', spring: 'bouncy'},
						{at: tShop - 6, pose: ['point', {fs: 92, fe: 10}], face: 'focused', spring: 'snappy'},
						{at: tFeel - 4, pose: ['point', {fs: 100, fe: 30}], face: 'smug', spring: 'snappy'},
						{at: tFeel + 2, pose: ['point', {fs: 92, fe: 6}], face: 'joy'},
						{at: tKnow - 2, pose: ['idle', {head: -18}], face: 'curious'},
						{at: tGone, pose: 'shock', face: 'shock', spring: 'bouncy'},
						{at: tGone + 24, pose: 'worried', face: 'worried'},
					]}
				/>
			</Camera>

			{/* ---- HUD: the extra $2,000 meter (stays connected to every purchase) ---- */}
			{/* header: the bar IS the raise; green = the part not spent yet */}
			<div style={{position: 'absolute', left: M.x, top: my - mix(84, 112, hero), width: M.w, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 14, fontWeight: 900, whiteSpace: 'nowrap'}}>
					<Kicker size={mix(32, 40, hero)} color={P.ink}>Your</Kicker>
					<span style={{fontSize: mix(60, 84, hero), color: P.accent, letterSpacing: -2, lineHeight: 1}}>{usd(FACTS.raise.value)}</span>
					<Kicker size={mix(32, 40, hero)} color={P.ink}>raise</Kicker>
				</div>
			</div>
			<div style={{position: 'absolute', left: M.x, top: my, width: M.w, height: mh, borderRadius: mh / 2, background: P.line, overflow: 'hidden', boxShadow: `0 ${10 * hero}px ${30 * hero}px ${P.shadow}, 0 0 ${30 * pulse}px rgba(30,158,87,${0.5 * pulse})`}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: M.w * green, height: '100%', background: '#3FCB7E', display: 'flex', alignItems: 'center', paddingLeft: 24, boxSizing: 'border-box', overflow: 'hidden'}}>
					<span style={{fontSize: mix(26, 34, hero), fontWeight: 900, letterSpacing: 2, color: '#0E4D2A', opacity: M.w * green > 220 ? 1 : 0, whiteSpace: 'nowrap'}}>UNSPENT</span>
				</div>
				{seg(0, pc, P.ink, 'CAR', 'CAR')}
				{seg(SHARE.car, pf, '#B0844E', 'FOOD', 'FOOD')}
				{seg(SHARE.car + SHARE.food, ps, P.danger, 'SHOPPING', 'SHOP')}
			</div>
			<div style={{position: 'absolute', left: ZERO_AT.x - 300, top: my + mh + 26, width: 300, textAlign: 'right', fontSize: 110, fontWeight: 900, color: P.danger, letterSpacing: -3, lineHeight: 1, opacity: Math.min(1, zero * 1.5), transform: `scale(${0.6 + 0.4 * zero})`, transformOrigin: '100% 0'}}>
				{usd(0)} <span style={{fontSize: 38, letterSpacing: 2}}>LEFT</span>
			</div>

			{tag(1, 'Nicer car', tCar - 6, tOrder - 6)}
			{tag(2, 'More delivery', tOrder - 4, tShop - 8)}
			{tag(3, 'Shopping', tShop - 6, tBefore - 6)}

			{chunk(tCar + 6, toScreen(420, 1110, CAM.car), 'c')}
			{chunk(tMore + 4, toScreen(560, 1180, CAM.door), 'f')}
			{chunk(tShop + 6, toScreen(300, 900, CAM.phone), 's1')}
			{chunk(tFeel + 2, toScreen(300, 900, CAM.phone), 's2')}

			<Sfx at={tWhat - 4} name="pop" volume={0.3} />
			<Sfx at={tCar - 10} name="whoosh" volume={0.4} />
			<Sfx at={tCar + 8} name="cash" volume={0.35} />
			<Sfx at={tOrder - 8} name="whoosh-soft" volume={0.35} />
			<Sfx at={tMore - 2} name="paper" volume={0.4} />
			<Sfx at={tDash + 6} name="paper" volume={0.3} />
			<Sfx at={tShop} name="click" volume={0.4} />
			<Sfx at={tFeel - 2} name="click" volume={0.4} />
			<Sfx at={tBefore - 2} name="whoosh-soft" volume={0.3} />
			<Sfx at={tGone + 2} name="thud" volume={0.5} />
		</AbsoluteFill>
	);
};
