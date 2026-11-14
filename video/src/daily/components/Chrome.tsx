import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, staticFile} from 'remotion';
import {BrandLogo} from '../../story/components/Chrome';
import {dmm} from '../theme';

/** Subtle end signature: mark + wordmark. */
export const Signature: React.FC<{opacity?: number; x?: number; y: number}> = ({opacity = 1, x = dmm.safe.left, y}) => (
	<div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 12, opacity, fontFamily: dmm.font}}>
		<BrandLogo size={30} ink={dmm.color.ink} accent={dmm.color.accent} />
		<div style={{fontSize: 24, fontWeight: 800, letterSpacing: 4, color: dmm.color.ink}}>STACK WITH GIO</div>
	</div>
);

/** Horizontal year track 0..N with a moving playhead and "YEAR n" readout. */
export const YearTrack: React.FC<{years: number; progress: number; w: number; x: number; y: number; label?: string}> = ({years, progress, w, x, y, label = 'YEAR'}) => {
	const c = dmm.color;
	const p = Math.max(0, Math.min(1, progress));
	const yr = Math.min(years, Math.floor(p * years + 1e-6));
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: 60, fontFamily: dmm.font}}>
			<div style={{position: 'absolute', left: 0, right: 170, top: 28, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)'}} />
			<div style={{position: 'absolute', left: 0, width: (w - 170) * p, top: 28, height: 4, borderRadius: 2, background: c.ink}} />
			{Array.from({length: years + 1}, (_, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: ((w - 170) * i) / years - 4,
						top: 22,
						width: 8,
						height: 16,
						borderRadius: 3,
						background: i <= yr && p > 0 ? c.ink : 'rgba(255,255,255,0.22)',
					}}
				/>
			))}
			<div style={{position: 'absolute', right: 0, top: 6, width: 156, textAlign: 'right', fontSize: 30, fontWeight: 900, letterSpacing: 2, color: c.ink, fontVariantNumeric: 'tabular-nums'}}>
				{label} {yr}
			</div>
		</div>
	);
};

/** Music bed with a short fade in / fade out so it never clicks. */
export const MusicBed: React.FC<{src: string; volume?: number; fadeIn?: number; fadeOut?: number; total?: number}> = ({
	src,
	volume = 0.5,
	fadeIn = 4,
	fadeOut = 18,
	total = dmm.durationInFrames,
}) => (
	<Html5Audio
		src={staticFile(src)}
		volume={(f) =>
			volume * interpolate(f, [0, fadeIn, total - fadeOut, total - 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
		}
	/>
);

/** QC-only overlay: platform safe area + typical UI zones. Never on in a final render. */
export const SafeZoneOverlay: React.FC = () => {
	const s = dmm.safe;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: dmm.width, height: s.top, background: 'rgba(255,0,80,0.18)'}} />
			<div style={{position: 'absolute', left: 0, bottom: 0, width: dmm.width, height: s.bottom, background: 'rgba(255,0,80,0.18)'}} />
			<div style={{position: 'absolute', right: 0, top: s.top, width: s.right, height: dmm.height - s.top - s.bottom, background: 'rgba(255,0,80,0.18)'}} />
			<div style={{position: 'absolute', left: s.left, top: s.top, right: s.right, bottom: s.bottom, border: '3px dashed rgba(255,0,80,0.9)'}} />
		</AbsoluteFill>
	);
};
