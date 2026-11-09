import React from 'react';
import {Img, staticFile} from 'remotion';

/** A rectangle in the recording's natural pixel space. */
export type RecRect = {x: number; y: number; w: number; h: number};
/** A privacy mask, active for recording frames [from, to] (inclusive). */
export type RecMask = RecRect & {from: number; to: number};

/**
 * REAL screen recording played from an image sequence extracted from the
 * creator's original file (frames are never retouched). The parent decides
 * WHICH source frame shows (`index`) so the footage can hold, slow down or
 * fast-forward to stay in sync with the narration, and WHAT part is framed
 * (`view`, a rectangle in natural pixels that fills the viewport).
 *
 * `masks` are opaque privacy panels (balances, buying power, positions)
 * drawn only while their frame range is on screen. `marks` draw a green
 * attention border around a region (0..1 strength) — outside the UI pixels.
 */
export const ScreenRecording: React.FC<{
	/** folder inside public/, e.g. "motion/<slug>/assets/rec" — files r000.jpg … */
	dir: string;
	count: number;
	index: number;
	natural: {w: number; h: number};
	/** viewport size on screen */
	w: number;
	h: number;
	view: RecRect;
	masks?: RecMask[];
	marks?: {rect: RecRect; p: number; color: string}[];
	maskColor?: string;
	radius?: number;
	/** show a single still image (inside public/) instead of the sequence — same camera/marks */
	src?: string;
	style?: React.CSSProperties;
}> = ({dir, count, index, natural, w, h, view, masks = [], marks = [], maskColor = '#151B17', radius = 34, src: still, style}) => {
	const i = Math.max(0, Math.min(count - 1, Math.round(index)));
	const k = Math.max(w / view.w, h / view.h);
	const tx = w / 2 - (view.x + view.w / 2) * k;
	const ty = h / 2 - (view.y + view.h / 2) * k;
	const src = staticFile(still ?? `${dir}/r${String(i).padStart(3, '0')}.jpg`);
	return (
		<div style={{position: 'absolute', width: w, height: h, overflow: 'hidden', borderRadius: radius, background: '#000', ...style}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: natural.w, height: natural.h, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${k})`}}>
				<Img src={src} style={{width: natural.w, height: natural.h, display: 'block'}} />
				{masks
					.filter((m) => i >= m.from && i <= m.to)
					.map((m, n) => (
						<div
							key={n}
							style={{
								position: 'absolute',
								left: m.x,
								top: m.y,
								width: m.w,
								height: m.h,
								background: maskColor,
								borderRadius: 18,
								boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.07)',
								backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 10px, rgba(255,255,255,0) 10px 22px)',
							}}
						/>
					))}
				{marks
					.filter((m) => m.p > 0.001)
					.map((m, n) => (
						<div
							key={`m${n}`}
							style={{
								position: 'absolute',
								left: m.rect.x - 14,
								top: m.rect.y - 14,
								width: m.rect.w + 28,
								height: m.rect.h + 28,
								border: `${6 / k}px solid ${m.color}`,
								borderRadius: 22,
								opacity: m.p,
								transform: `scale(${1.06 - 0.06 * m.p})`,
								boxShadow: `0 0 ${30 * m.p}px ${m.color}55`,
							}}
						/>
					))}
			</div>
		</div>
	);
};

/** Piecewise-linear map from a scene frame to a source frame index via [frame, index] anchors. */
export const recIndex = (frame: number, anchors: [number, number][]) => {
	const a = [...anchors].sort((x, y) => x[0] - y[0]);
	if (frame <= a[0][0]) return a[0][1];
	for (let n = 1; n < a.length; n++) {
		if (frame <= a[n][0]) {
			const [f0, i0] = a[n - 1];
			const [f1, i1] = a[n];
			return i0 + ((i1 - i0) * (frame - f0)) / Math.max(1, f1 - f0);
		}
	}
	return a[a.length - 1][1];
};

/** Interpolate between view rectangles keyed by frame (eased). */
export const recView = (frame: number, keys: {at: number; v: RecRect}[], ease: (t: number) => number = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)): RecRect => {
	const ks = [...keys].sort((a, b) => a.at - b.at);
	let v = ks[0].v;
	for (let n = 1; n < ks.length; n++) {
		if (frame <= ks[n - 1].at) break;
		const t = ease(Math.min(1, (frame - ks[n - 1].at) / Math.max(1, ks[n].at - ks[n - 1].at)));
		const p = v;
		const q = ks[n].v;
		v = {x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, w: p.w + (q.w - p.w) * t, h: p.h + (q.h - p.h) * t};
	}
	return v;
};
