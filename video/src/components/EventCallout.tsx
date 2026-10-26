import React from 'react';
import {interpolate, Easing} from 'remotion';
import type {EventTiming} from '../lib/timeline';
import {theme, toneColor} from '../theme';

type Props = {
	ev: EventTiming;
	frame: number;
	until: number;
	px: number;
	py: number;
	chartW: number;
	plotTop: number;
	plotLeft: number;
	plotBottom: number;
	dateLabel: string;
};

const CARD_W = 470;

/** Editorial callout: leader line + white card. Lives inside the zoomed chart layer. */
export const EventCallout: React.FC<Props> = ({ev, frame, until, px, py, chartW, plotTop, plotLeft, plotBottom, dateLabel}) => {
	const appear = ev.frame - 4;
	if (frame < appear || frame > until + 12) return null;
	const inP = interpolate(frame, [appear, appear + 12], [0, 1], {
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	const outP = interpolate(frame, [until, until + 12], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const o = Math.min(inP, outP);

	const mid = (plotTop + plotBottom) / 2;
	const above = py > mid; // point low -> card above it
	const cardH = ev.event.subtitle ? 128 : 84;
	const side = px + 36 + CARD_W <= chartW - 8 ? 'right' : px - 36 - CARD_W >= plotLeft ? 'left' : 'stack';
	let cardTop: number;
	let cardLeft: number;
	let lx1 = px;
	let ly1 = above ? py - 16 : py + 16;
	let lx2 = px;
	let ly2: number;
	if (side === 'stack') {
		const gap = 70;
		cardTop = above ? Math.max(plotTop - 10, py - gap - cardH) : Math.min(plotBottom - cardH, py + gap);
		cardLeft = Math.max(8, Math.min(chartW - CARD_W - 8, px - CARD_W / 2));
		ly2 = above ? cardTop + cardH : cardTop;
	} else {
		// beside the point, nudged away from the line's vertical position
		cardTop = Math.max(plotTop - 10, Math.min(plotBottom - cardH, above ? py - cardH - 30 : py + 30));
		cardLeft = side === 'right' ? px + 36 : px - 36 - CARD_W;
		lx1 = side === 'right' ? px + 14 : px - 14;
		ly1 = py;
		lx2 = side === 'right' ? cardLeft : cardLeft + CARD_W;
		ly2 = Math.max(cardTop + 20, Math.min(cardTop + cardH - 20, py));
	}
	const accent = toneColor(ev.event.tone);
	return (
		<div style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
			<svg width={chartW} height={2000} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<line
					x1={lx1}
					y1={ly1}
					x2={interpolate(inP, [0, 1], [lx1, lx2])}
					y2={interpolate(inP, [0, 1], [ly1, ly2])}
					stroke={theme.ink}
					strokeWidth={3}
				/>
			</svg>
			<div
				style={{
					position: 'absolute',
					left: cardLeft,
					top: cardTop + (1 - inP) * (above ? 14 : -14),
					width: CARD_W,
					background: '#fff',
					border: `2px solid ${theme.ink}`,
					borderRadius: 18,
					padding: '16px 22px',
					boxShadow: '0 10px 30px rgba(15,17,20,0.10)',
					boxSizing: 'border-box',
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', gap: 10}}>
					<div style={{width: 12, height: 12, borderRadius: 6, background: accent}} />
					<div style={{fontSize: 24, fontWeight: 700, color: theme.muted, letterSpacing: 1, textTransform: 'uppercase'}}>
						{dateLabel}
					</div>
				</div>
				<div style={{fontSize: 36, fontWeight: 800, color: theme.ink, marginTop: 4, lineHeight: 1.1}}>{ev.event.title}</div>
				{ev.event.subtitle && (
					<div style={{fontSize: 26, fontWeight: 600, color: accent === theme.ink ? theme.charcoal : accent, marginTop: 6}}>
						{ev.event.subtitle}
					</div>
				)}
			</div>
		</div>
	);
};
