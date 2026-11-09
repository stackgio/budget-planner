import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, FONT, StudioBg} from '../look';

/** Shared with PaymentScene so the $750 match-cuts across the scene change. */
export const HERO750 = {cx: 540, cy: 600, size: 310, endScale: 1.06};

export const Price750: React.FC<{scale: number; color?: string; tracking?: number}> = ({scale, color = C.white, tracking = -14}) => (
	<div
		style={{
			position: 'absolute',
			left: 0,
			right: 0,
			top: HERO750.cy - HERO750.size * 0.56,
			textAlign: 'center',
			fontFamily: FONT,
			fontWeight: 900,
			fontSize: HERO750.size,
			lineHeight: 1.12,
			letterSpacing: tracking,
			color,
			transform: `scale(${scale})`,
			transformOrigin: `50% ${HERO750.size * 0.56}px`,
			textShadow: '0 20px 60px rgba(0,0,0,0.55)',
			fontVariantNumeric: 'tabular-nums',
		}}
	>
		${FACTS.payment.value}
	</div>
);

export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSeven = cue('L1', 'seven');
	const tMonth = cue('L1', 'month');
	const tCrazy = cue('L2', 'crazy');

	// $750 is on screen from frame 0, landing with a forceful-but-elegant scale settle
	const land = sp(frame, fps, -4, 'heavy');
	const emph = sp(frame, fps, tCrazy - 3, 'smooth');
	const scale = 1.32 - 0.32 * land + (HERO750.endScale - 1) * emph;
	const tracking = -24 + 10 * land;
	const perMonth = prog(frame, 5, 14);
	// red rule draws under the price while the amount is spoken
	const rule = kf(frame, [tSeven, tMonth + 8], [0, 1], E.inOut);

	// car: slow dolly, light sweep across the paint, then the camera pushes on "crazy"
	const sheen = kf(frame, [0, 75], [-0.25, 1.25], E.soft);
	const sheen2 = kf(frame, [tCrazy - 4, tCrazy + 40], [-0.25, 1.25], E.soft);
	const dim = kf(frame, [tCrazy - 2, tCrazy + 18], [1, 0.62]);
	const spin = 0;

	return (
		<AbsoluteFill>
			<Camera
				keys={[
					{at: 0, zoom: 1.06, x: 580, y: 1000},
					{at: tCrazy - 10, zoom: 1.0, x: 540, y: 960, ease: E.soft},
					{at: tCrazy + 24, zoom: 1.1, x: 600, y: 1000, ease: E.inOut},
				]}
			>
				<StudioBg floorY={1330} />
				<div style={{position: 'absolute', inset: 0, filter: `brightness(${dim})`}}>
					<Car
						id="hookcar"
						variant="luxury"
						paint={PAINTS.gunmetal}
						x={360}
						y={1330}
						w={1360}
						lights={1}
						beam={0.9}
						spin={spin}
						sheen={frame < tCrazy - 4 ? sheen : sheen2}
						sheenAmt={0.6}
						reflection={0.24}
					/>
				</div>
			</Camera>
			{/* top fade so the type always reads */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 980, background: 'linear-gradient(180deg, rgba(16,16,16,0.85) 0%, rgba(16,16,16,0.35) 70%, rgba(16,16,16,0) 100%)'}} />
			<Price750 scale={scale} tracking={tracking} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: HERO750.cy + 178,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 800,
					fontSize: 60,
					letterSpacing: 18,
					color: C.gray,
					opacity: perMonth,
					transform: `translateY(${(1 - perMonth) * 24}px) scale(${1 + (HERO750.endScale - 1) * emph})`,
				}}
			>
				/ MONTH
			</div>
			<div
				style={{
					position: 'absolute',
					left: 540 - 300,
					top: HERO750.cy + 146,
					width: 600 * rule,
					height: 6,
					borderRadius: 3,
					background: C.red,
					opacity: 0.9,
				}}
			/>
		</AbsoluteFill>
	);
};
