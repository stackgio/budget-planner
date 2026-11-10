import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {Coin, SavingsJar} from '../../../story/components/Money';
import {DotGrid, HouseKey} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {kf, mix, sp, wobble} from '../../../story/lib/motion';
import {cinematic as C, story} from '../../../story/theme';
import {ESTIMATE_HANDOFF} from './DecisionScene';
import {EstimateCard} from './shared';

const CARD = {w: 320, h: 560};
/** Final fan: centred in the safe area (x 72–960 → centre 516). Centre card in front. */
const SLOTS = {
	left: {x: 300, y: 850, rot: -9},
	center: {x: 518, y: 810, rot: 2},
	right: {x: 736, y: 850, rot: 9},
};
const OUTLINE = '2px solid rgba(245,242,234,0.85)';

const CardFrame: React.FC<{x: number; y: number; w: number; h: number; rot: number; opacity?: number; radius?: number; outline?: number; children: React.ReactNode; z: number}> = ({x, y, w, h, rot, opacity = 1, radius = 28, outline = 1, children, z}) => (
	<div
		style={{
			position: 'absolute',
			left: x - w / 2,
			top: y - h / 2,
			width: w,
			height: h,
			transform: `rotate(${rot}deg)`,
			borderRadius: radius,
			overflow: 'hidden',
			background: '#121418',
			border: outline > 0 ? OUTLINE : 'none',
			boxShadow: `0 30px 60px rgba(0,0,0,${0.6 * outline})`,
			opacity,
			zIndex: z,
		}}
	>
		<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: C.accent, opacity: 0.85 * outline}} />
		{children}
	</div>
);

const Choice: React.FC<{text: string; p: number; x: number; y: number}> = ({text, p, x, y}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * p})`,
			opacity: p,
			display: 'flex',
			alignItems: 'center',
			gap: 14,
			background: '#F5F2EA',
			color: '#0B0C0E',
			borderRadius: 18,
			padding: '14px 24px',
			fontSize: 42,
			fontWeight: 900,
			letterSpacing: 1,
			whiteSpace: 'nowrap',
			boxShadow: '0 16px 30px rgba(0,0,0,0.5)',
			zIndex: 10,
		}}
	>
		<div style={{width: 16, height: 16, borderRadius: 8, background: C.accent}} />
		{text}
	</div>
);

/**
 * L26–L27 — ENDING. Opens on the $5,000 estimate full-frame on a dark dotted
 * grid (match cut from the previous scene). On "If you had the down payment
 * today" the frame pulls back into the centre card while two more tall,
 * tilted cards fan out: keys (BUY NOW on "buying") and savings (STACK LONGER
 * on "stacking"). Settles on the last word, holds ~1 s, cut.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tIf = cue('L27');
	const tBuying = cue('L27', 'buying');
	const tStacking = cue('L27', 'stacking');
	const pull = sp(frame, fps, tIf - 2, 'smooth');
	const fanL = sp(frame, fps, tIf + 6, {damping: 18, stiffness: 110, mass: 1});
	const fanR = sp(frame, fps, tIf + 10, {damping: 18, stiffness: 110, mass: 1});
	const buy = sp(frame, fps, tBuying - 3, 'bouncy');
	const stack = sp(frame, fps, tStacking - 3, 'bouncy');
	const c = SLOTS.center;
	const cw = mix(1080, CARD.w, pull);
	const ch = mix(1920, CARD.h, pull);
	const cx = mix(540, c.x, pull);
	const cy = mix(960, c.y, pull);
	// estimate: from the hand-off framing (full frame) to fitting the centre card
	const ew = mix(ESTIMATE_HANDOFF.w, 286, pull);
	const float = wobble(frame, 2, 0.9, 4);
	const keySway = wobble(frame, 9, 0.8, 5);
	const jar = kf(frame, [tIf, tStacking + 30], [0.25, 0.7]);
	const coinT = ((frame - tIf) % 40) / 40;
	const side = (p: number, s: {x: number; y: number; rot: number}) => ({x: mix(c.x, s.x, p), y: mix(c.y + 20, s.y, p), rot: mix(0, s.rot, p)});
	const L = side(fanL, SLOTS.left);
	const R = side(fanR, SLOTS.right);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DotGrid />
			{/* left: keys → BUY NOW */}
			<CardFrame x={L.x} y={L.y} w={CARD.w} h={CARD.h} rot={L.rot} opacity={Math.min(1, fanL * 3)} z={1}>
				<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(260px 300px at 50% 45%, rgba(255,226,160,0.16), rgba(0,0,0,0) 70%)'}} />
				<HouseKey w={300} style={{left: 160 + 0.28 * 300 - 20, top: 250, transform: `translate(-50%,-50%) rotate(${-35 + keySway}deg)`, transformOrigin: '22% 50%'}} />
			</CardFrame>
			{/* right: savings → STACK LONGER */}
			<CardFrame x={R.x} y={R.y} w={CARD.w} h={CARD.h} rot={R.rot} opacity={Math.min(1, fanR * 3)} z={1}>
				<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(260px 300px at 50% 50%, rgba(44,212,122,0.14), rgba(0,0,0,0) 70%)'}} />
				<SavingsJar w={190} level={jar} palette={C} showLabel={false} style={{left: 205, top: 430}} />
				{frame >= tIf && <Coin size={46} spin={frame * 6} style={{left: 205, top: 90 + coinT * 150, opacity: coinT < 0.85 ? 1 : (1 - coinT) * 6}} />}
			</CardFrame>
			{/* centre: the $5,000 estimate, in front */}
			<CardFrame x={cx} y={cy} w={cw} h={ch} rot={mix(0, c.rot, pull)} radius={mix(0, 28, pull)} outline={pull} z={2}>
				<EstimateCard w={ew} owner={1} style={{left: cw / 2, top: ch / 2 + mix(ESTIMATE_HANDOFF.y - 960, 0, pull) + float * pull}} />
			</CardFrame>
			<Choice text="BUY NOW" p={buy} x={262} y={1150} />
			<Choice text="STACK LONGER" p={stack} x={740} y={1150} />
			<Sfx at={tIf - 2} name="whoosh-soft" volume={0.35} />
			<Sfx at={tBuying - 3} name="pop" volume={0.25} />
			<Sfx at={tStacking - 3} name="coin" volume={0.25} />
		</AbsoluteFill>
	);
};
