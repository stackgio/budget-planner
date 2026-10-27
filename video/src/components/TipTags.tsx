import React from 'react';
import {formatMoney} from '../lib/format';
import {theme} from '../theme';

export type Tag = {text: string; bg: string; y: number};

const H = 50; // pill height
const GAP = 8;
const FS = 28;

/** Pills that ride the tip of the line: live value(s) + cash invested. */
export const TipTags: React.FC<{
	tags: Tag[];
	tipX: number;
	chartW: number;
	plotTop: number;
	plotBottom: number;
	opacity: number;
}> = ({tags, tipX, chartW, plotTop, plotBottom, opacity}) => {
	if (opacity <= 0 || tags.length === 0) return null;
	// Stack top-to-bottom without overlaps, kept inside the plot.
	const sorted = [...tags].sort((a, b) => a.y - b.y).map((t) => ({...t}));
	for (let i = 1; i < sorted.length; i++) {
		sorted[i].y = Math.max(sorted[i].y, sorted[i - 1].y + H + GAP);
	}
	const overflow = sorted[sorted.length - 1].y + H / 2 - plotBottom;
	if (overflow > 0) sorted.forEach((t) => (t.y -= overflow));
	sorted.forEach((t) => (t.y = Math.max(plotTop + H / 2, t.y)));

	const widest = Math.max(...sorted.map((t) => t.text.length * FS * 0.62 + 36));
	const right = tipX + 26 + widest < chartW - 8;
	return (
		<div style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}>
			{sorted.map((t, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						top: t.y - H / 2,
						left: right ? tipX + 26 : undefined,
						right: right ? undefined : chartW - tipX + 26,
						height: H,
						padding: '0 18px',
						borderRadius: 12,
						background: t.bg,
						color: '#fff',
						fontSize: FS,
						fontWeight: 800,
						display: 'flex',
						alignItems: 'center',
						whiteSpace: 'nowrap',
						fontVariantNumeric: 'tabular-nums',
						boxShadow: '0 4px 12px rgba(15,17,20,0.12)',
					}}
				>
					{t.text}
				</div>
			))}
		</div>
	);
};

export const investedText = (v: number) => `Invested ${formatMoney(v)}`;
