import React from 'react';
import {dmm} from '../theme';

/**
 * Glass panel with a small uppercase tag ("MOVE 1 · SPEND IT"). `dim` (0..1)
 * desaturates and darkens the whole panel — used when money "loses colour".
 */
export const Panel: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	tag: string;
	tagNumber?: string;
	tone?: 'accent' | 'muted';
	dim?: number;
	glow?: number;
	children?: React.ReactNode;
	style?: React.CSSProperties;
}> = ({x, y, w, h, tag, tagNumber, tone = 'accent', dim = 0, glow = 0, children, style}) => {
	const c = dmm.color;
	const toneColor = tone === 'accent' ? c.accent : c.muted;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: 34,
				background: c.panel,
				border: `2px solid ${glow > 0 ? `rgba(54,217,121,${0.09 + glow * 0.35})` : c.panelLine}`,
				boxShadow: `0 30px 80px rgba(0,0,0,0.45)${glow > 0 ? `, 0 0 ${60 * glow}px rgba(54,217,121,${0.1 * glow})` : ''}`,
				overflow: 'hidden',
				filter: dim > 0 ? `saturate(${1 - dim}) brightness(${1 - dim * 0.25})` : undefined,
				fontFamily: dmm.font,
				...style,
			}}
		>
			<div style={{position: 'absolute', left: 36, top: 30, display: 'flex', alignItems: 'center', gap: 14}}>
				{tagNumber && (
					<div
						style={{
							height: 40,
							minWidth: 40,
							padding: '0 10px',
							borderRadius: 10,
							background: tone === 'accent' ? c.accent : c.mutedSoft,
							color: tone === 'accent' ? c.bg : c.ink,
							fontSize: 24,
							fontWeight: 900,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{tagNumber}
					</div>
				)}
				<div style={{fontSize: dmm.type.label, fontWeight: 800, letterSpacing: 4, color: toneColor}}>{tag}</div>
			</div>
			{children}
		</div>
	);
};
