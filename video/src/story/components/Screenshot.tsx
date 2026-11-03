import React from 'react';
import {Img, staticFile} from 'remotion';
import {editorial, type Palette} from '../theme';

/** A rectangle in the screenshot's own pixel space (natural image size). */
export type Region = {x: number; y: number; w: number; h: number};

/**
 * REAL evidence (portfolio, dividend, budget, paycheck screenshots).
 * The image itself is never retouched: we only frame it, zoom into it,
 * highlight a region, and BLUR sensitive regions (account numbers, names,
 * emails). Pass the image's natural size so regions line up exactly.
 *
 * Camera: `focus` (0..1) eases from the full screenshot to `zoomTo`.
 */
export const Screenshot: React.FC<{
	src: string; // inside public/, e.g. "motion/<slug>/assets/portfolio.png"
	natural: {w: number; h: number};
	/** on-screen width of the full screenshot */
	w: number;
	/** sensitive regions to blur (always on) */
	redact?: Region[];
	/** region to draw attention to; `highlight` 0..1 draws the box */
	mark?: Region;
	highlight?: number;
	/** region the camera pushes into; `focus` 0..1 */
	zoomTo?: Region;
	focus?: number;
	/** max on-screen height of the viewport (crop) — defaults to full image height */
	viewportH?: number;
	frame?: 'card' | 'phone' | 'none';
	palette?: Palette;
	style?: React.CSSProperties;
}> = ({src, natural, w, redact = [], mark, highlight = 0, zoomTo, focus = 0, viewportH, frame = 'card', palette = editorial, style}) => {
	const s = w / natural.w; // natural → screen
	const fullH = natural.h * s;
	const vh = viewportH ?? fullH;
	// camera: scale + translate so zoomTo fills the viewport width (or height)
	let k = 1;
	let tx = 0;
	let ty = 0;
	if (zoomTo && focus > 0) {
		const kTarget = Math.min(w / (zoomTo.w * s), vh / (zoomTo.h * s));
		k = 1 + (kTarget - 1) * focus;
		const cx = (zoomTo.x + zoomTo.w / 2) * s;
		const cy = (zoomTo.y + zoomTo.h / 2) * s;
		tx = (w / 2 - cx * k) * focus;
		ty = (vh / 2 - cy * k) * focus;
		// keep the image covering the viewport
		tx = Math.min(0, Math.max(w - w * k, tx));
		ty = Math.min(0, Math.max(vh - fullH * k, ty));
	}
	const pad = frame === 'phone' ? 18 : frame === 'card' ? 10 : 0;
	const radius = frame === 'phone' ? 54 : frame === 'card' ? 26 : 0;
	return (
		<div
			style={{
				position: 'absolute',
				width: w + pad * 2,
				height: vh + pad * 2,
				padding: pad,
				borderRadius: radius + pad,
				background: frame === 'phone' ? '#121316' : frame === 'card' ? palette.paper : 'transparent',
				boxShadow: frame === 'none' ? undefined : `0 30px 60px ${palette.shadow}`,
				boxSizing: 'border-box',
				...style,
			}}
		>
			<div style={{position: 'relative', width: w, height: vh, overflow: 'hidden', borderRadius: radius}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: w, height: fullH, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${k})`}}>
					<Img src={staticFile(src)} style={{width: w, height: fullH, display: 'block'}} />
					{redact.map((r, i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: r.x * s,
								top: r.y * s,
								width: r.w * s,
								height: r.h * s,
								backdropFilter: 'blur(14px)',
								WebkitBackdropFilter: 'blur(14px)',
								background: 'rgba(200,200,200,0.35)',
								borderRadius: 8,
							}}
						/>
					))}
					{mark && highlight > 0 && (
						<div
							style={{
								position: 'absolute',
								left: mark.x * s - 8,
								top: mark.y * s - 8,
								width: mark.w * s + 16,
								height: mark.h * s + 16,
								border: `${4 / k}px solid ${palette.accent}`,
								borderRadius: 12,
								opacity: highlight,
								transform: `scale(${1.08 - 0.08 * highlight})`,
								boxShadow: `0 0 0 ${2000 * highlight}px rgba(0,0,0,${0.0 + 0.18 * highlight})`,
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
};
