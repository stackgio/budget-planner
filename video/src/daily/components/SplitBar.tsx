import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {sp} from '../../story/lib/motion';
import {dmm, usd} from '../theme';

export type BarItem = {label: string; amount: number; at: number};

/**
 * A fixed amount (e.g. a $500 raise) shown as an empty track that gets eaten,
 * segment by segment, by the items that claim it. Each segment springs in from
 * the right at its own `at` frame with its label underneath. `tone` decides
 * whether claimed money reads as spent (muted) or put to work (accent).
 */
export const SplitBar: React.FC<{
	total: number;
	items: BarItem[];
	w: number;
	h?: number;
	tone?: 'muted' | 'accent';
	fade?: number; // 0..1 drains colour from the claimed segments
}> = ({total, items, w, h = 64, tone = 'muted', fade = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const c = dmm.color;
	let x0 = 0;
	const segs = items.map((it) => {
		const p = sp(frame, fps, it.at, 'heavy');
		const sw = (it.amount / total) * w;
		const s = {it, x: x0, w: sw, p};
		x0 += sw;
		return s;
	});
	const fill = (i: number) => {
		if (tone === 'accent') return c.accent;
		const shades = ['#D9DCE1', '#B9BEC6', '#9CA3AF'];
		return shades[i % shades.length];
	};
	return (
		<div style={{position: 'relative', width: w, height: h + 70, fontFamily: dmm.font}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: 16, border: `2px dashed rgba(255,255,255,0.22)`}} />
			{segs.map((s, i) => (
				<React.Fragment key={s.it.label}>
					<div
						style={{
							position: 'absolute',
							left: s.x + 3,
							top: 3,
							width: Math.max(0, s.w - 6),
							height: h - 6,
							borderRadius: 13,
							background: fill(i),
							opacity: (0.35 + 0.65 * Math.min(1, s.p * 1.4)) * (1 - fade * 0.55),
							transform: `translateX(${(1 - s.p) * 120}px) scaleX(${0.6 + 0.4 * s.p})`,
							transformOrigin: '0% 50%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: c.bg,
							fontSize: 26,
							fontWeight: 900,
							visibility: s.p > 0.01 ? 'visible' : 'hidden',
						}}
					>
						{usd(s.it.amount)}
					</div>
					<div
						style={{
							position: 'absolute',
							left: s.x,
							top: h + 16,
							width: s.w,
							textAlign: 'center',
							fontSize: 24,
							fontWeight: 700,
							letterSpacing: 1,
							color: c.muted,
							opacity: Math.min(1, s.p * 1.6),
							transform: `translateY(${(1 - Math.min(1, s.p)) * 14}px)`,
							whiteSpace: 'nowrap',
						}}
					>
						{s.it.label}
					</div>
				</React.Fragment>
			))}
		</div>
	);
};
