import React from 'react';
import {editorial, type Palette} from '../theme';

/**
 * Financial progress bar. `progress` 0..1 (animate outside). Optional tick
 * `milestones` (0..1), a leading knob, and labels above.
 */
export const ProgressBar: React.FC<{
	progress: number;
	w: number;
	h?: number;
	palette?: Palette;
	color?: string;
	label?: React.ReactNode;
	valueLabel?: React.ReactNode;
	milestones?: number[];
	knob?: boolean;
	style?: React.CSSProperties;
}> = ({progress, w, h = 34, palette = editorial, color, label, valueLabel, milestones = [], knob = true, style}) => {
	const p = Math.max(0, Math.min(1, progress));
	const c = color ?? palette.accent;
	return (
		<div style={{position: 'absolute', width: w, fontFamily: 'Inter', ...style}}>
			{(label || valueLabel) && (
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: h * 0.45}}>
					<div style={{fontSize: Math.max(22, h * 0.8), fontWeight: 800, letterSpacing: 2, color: palette.muted}}>{label}</div>
					<div style={{fontSize: Math.max(26, h), fontWeight: 900, color: palette.ink, fontVariantNumeric: 'tabular-nums'}}>{valueLabel}</div>
				</div>
			)}
			<div style={{position: 'relative', height: h, borderRadius: h / 2, background: palette.line, overflow: 'visible'}}>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: Math.max(h, p * w),
						opacity: p > 0.001 ? 1 : 0,
						borderRadius: h / 2,
						background: `linear-gradient(90deg, ${c} 0%, ${c} 70%, ${palette.name === 'cinematic' ? '#7CF0B0' : '#3FBF77'} 100%)`,
						boxShadow: palette.name === 'cinematic' ? `0 0 ${h}px ${palette.accentSoft}` : undefined,
					}}
				/>
				{milestones.map((m) => (
					<div key={m} style={{position: 'absolute', left: m * w - 2, top: h * 0.2, bottom: h * 0.2, width: 4, borderRadius: 2, background: m <= p ? 'rgba(255,255,255,0.7)' : palette.muted, opacity: 0.6}} />
				))}
				{knob && p > 0.001 && (
					<div
						style={{
							position: 'absolute',
							left: Math.max(h, p * w) - h * 0.85,
							top: -h * 0.18,
							width: h * 1.36,
							height: h * 1.36,
							borderRadius: '50%',
							background: '#fff',
							border: `${Math.max(4, h * 0.16)}px solid ${c}`,
							boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
						}}
					/>
				)}
			</div>
		</div>
	);
};
