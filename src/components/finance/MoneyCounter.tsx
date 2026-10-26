import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../../brand/theme';
import {clamp, ease, springAt, springs} from '../../lib/motion';

type Props = {
	from: number;
	to: number;
	/** Frame the count starts and the frame it lands on the final value. */
	startFrame: number;
	endFrame: number;
	decimals?: number;
	currency?: string;
	fontSize?: number;
	color?: string;
	/** Glow + scale pulse when the final value lands. */
	landingPulse?: boolean;
	/** Show a "+" or "−" sign in front of the currency. */
	sign?: '+' | '-' | null;
	easing?: (t: number) => number;
	style?: React.CSSProperties;
};

/**
 * Odometer-style counter. Each digit is a rolling column, higher places roll
 * only when the lower place carries, and leading digits grow in as the value
 * reaches them, so the layout never jumps. Use from > to for debt payoff.
 */
export const MoneyCounter: React.FC<Props> = ({
	from,
	to,
	startFrame,
	endFrame,
	decimals = 2,
	currency = '$',
	fontSize = 200,
	color = colors.white,
	landingPulse = true,
	sign = null,
	easing = ease.out,
	style,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const value = interpolate(frame, [startFrame, endFrame], [from, to], {...clamp, easing});

	// Work in integer units of the last decimal so every column is a 0–9 wheel.
	const unit = Math.pow(10, decimals);
	// Round away float noise (15.52 * 100 = 1551.999…) so the final digits sit exactly.
	const scaled = Math.round(Math.abs(value) * unit * 1e6) / 1e6;
	const maxScaled = Math.max(Math.abs(from), Math.abs(to)) * unit;
	const intDigits = Math.max(1, Math.floor(Math.max(Math.abs(from), Math.abs(to))).toString().length);
	const places = intDigits + decimals;

	const land = landingPulse ? springAt(frame, fps, endFrame, springs.pop) : 0;
	const pulse = landingPulse ? interpolate(land, [0, 0.5, 1], [0, 1, 0]) : 0;
	const digitH = fontSize * 1.1;
	const digitW = fontSize * 0.62;

	const columns: React.ReactNode[] = [];
	for (let k = places - 1; k >= 0; k--) {
		const p = Math.pow(10, k);
		const n = scaled / p;
		const digit = Math.floor(n) % 10;
		// Digits sit still and roll to the next value at the end of each step
		// (the last 30% for the lowest place, the last 10% of the lower place's
		// cycle for carries), so every frame shows crisp, readable numbers.
		const frac = k === 0 ? n - Math.floor(n) : (scaled % p) / p;
		const threshold = k === 0 ? 0.7 : 0.9;
		const roll = frac > threshold ? ease.inOut((frac - threshold) / (1 - threshold)) : 0;
		const position = digit + roll;

		// Leading integer digits (beyond the ones place) grow in when reached.
		const isLeading = k >= decimals + 1;
		const presence = isLeading ? interpolate(scaled / p, [0.9, 1], [0, 1], clamp) : 1;
		if (isLeading && maxScaled / p < 1) continue;

		columns.push(
			<span
				key={`d${k}`}
				style={{
					display: 'inline-block',
					position: 'relative',
					width: digitW * presence,
					height: digitH,
					overflow: 'hidden',
					opacity: presence,
				}}
			>
				<span style={{position: 'absolute', left: 0, top: 0, translate: `0px ${-position * digitH}px`}}>
					{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
						<span key={i} style={{display: 'block', height: digitH, lineHeight: `${digitH}px`, width: digitW, textAlign: 'center'}}>
							{d}
						</span>
					))}
				</span>
			</span>,
		);
		if (k === decimals && decimals > 0) {
			columns.push(<Static key="dot" text="." width={digitW * 0.42} height={digitH} />);
		}
		// Thousands separators between integer groups.
		const intPos = k - decimals;
		if (intPos > 0 && intPos % 3 === 0) {
			columns.push(<Static key={`c${k}`} text="," width={digitW * 0.42 * presence} height={digitH} opacity={presence} />);
		}
	}

	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				fontFamily: fonts.display,
				fontWeight: 800,
				fontSize,
				color,
				letterSpacing: '-0.02em',
				fontVariantNumeric: 'tabular-nums',
				scale: 1 + pulse * 0.06,
				// drop-shadow on the whole row: text-shadow would be clipped per digit column.
				filter: `drop-shadow(0 0 ${24 + pulse * 40}px ${color}${pulse > 0.05 ? '99' : '44'})`,
				...style,
			}}
		>
			{sign ? <Static text={sign === '-' ? '−' : '+'} width={digitW * 0.75} height={digitH} /> : null}
			<Static text={currency} width={digitW * 0.8} height={digitH} />
			{columns}
		</div>
	);
};

const Static: React.FC<{text: string; width: number; height: number; opacity?: number}> = ({text, width, height, opacity = 1}) => (
	<span style={{display: 'inline-block', width, height, lineHeight: `${height}px`, textAlign: 'center', opacity, overflow: 'hidden'}}>
		{text}
	</span>
);
