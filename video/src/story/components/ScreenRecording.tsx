import React from 'react';
import {Freeze, OffthreadVideo, staticFile, useVideoConfig} from 'remotion';
import {cinematic, story, type Palette} from '../theme';
import type {Region} from './Screenshot';

/** Redaction that applies while the SOURCE clock is inside [from, to). */
export type TimedRegion = Region & {from: number; to: number};

/** Highlight box drawn in the recording's natural pixel space. */
export type RecMark = Region & {p: number; color?: string};

/** Tap marker: a ring that lands and ripples. `p` 0..1 drives the animation. */
export type RecTap = {x: number; y: number; p: number};

export type RecCamera = {cx: number; cy: number; zoom: number};

/**
 * REAL screen recording (phone capture), retimed to the narration.
 * `srcSec` is the source time to show — scenes map narration cues to source
 * times (play, slow, hold), so every tap lands on the word that names it.
 * Pixels are never altered: we only crop, zoom, highlight and BLUR private
 * regions. Redactions are keyed to SOURCE time so they follow the footage.
 */
export const ScreenRecording: React.FC<{
	src: string;
	natural: {w: number; h: number};
	/** viewport size on screen */
	w: number;
	h: number;
	srcSec: number;
	camera?: RecCamera;
	redact?: TimedRegion[];
	marks?: RecMark[];
	taps?: RecTap[];
	palette?: Palette;
	/** 0..1 dims the footage (to put a text step on top) */
	dim?: number;
	style?: React.CSSProperties;
}> = ({src, natural, w, h, srcSec, camera, redact = [], marks = [], taps = [], palette = cinematic, dim = 0, style}) => {
	const {fps} = useVideoConfig();
	const base = w / natural.w;
	const cam = camera ?? {cx: natural.w / 2, cy: h / base / 2, zoom: 1};
	const k = base * cam.zoom;
	const fullW = natural.w * k;
	const fullH = natural.h * k;
	let tx = w / 2 - cam.cx * k;
	let ty = h / 2 - cam.cy * k;
	tx = Math.min(0, Math.max(w - fullW, tx));
	ty = Math.min(0, Math.max(h - fullH, ty));
	const active = redact.filter((r) => srcSec >= r.from && srcSec < r.to);
	const pad = 14;
	return (
		<div
			style={{
				position: 'absolute',
				width: w + pad * 2,
				height: h + pad * 2,
				padding: pad,
				borderRadius: 56,
				background: '#1A1C20',
				boxShadow: `0 0 0 2px #2E3138, 0 40px 80px rgba(0,0,0,0.6)`,
				boxSizing: 'border-box',
				...style,
			}}
		>
			<div style={{position: 'relative', width: w, height: h, overflow: 'hidden', borderRadius: 44, background: '#000'}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: natural.w, height: natural.h, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${k})`}}>
					<Freeze frame={Math.max(0, Math.round(srcSec * fps))}>
						<OffthreadVideo src={staticFile(src)} muted style={{width: natural.w, height: natural.h, display: 'block'}} />
					</Freeze>
					{active.map((r, i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: r.x,
								top: r.y,
								width: r.w,
								height: r.h,
								backdropFilter: 'blur(26px)',
								WebkitBackdropFilter: 'blur(26px)',
								background: 'rgba(60,62,68,0.55)',
								borderRadius: 18,
							}}
						/>
					))}
					{marks.map((m, i) =>
						m.p <= 0 ? null : (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: m.x - 14,
									top: m.y - 14,
									width: m.w + 28,
									height: m.h + 28,
									border: `${10}px solid ${m.color ?? palette.accent}`,
									borderRadius: 30,
									opacity: Math.min(1, m.p),
									transform: `scale(${1.06 - 0.06 * Math.min(1, m.p)})`,
									boxShadow: `0 0 0 3000px rgba(0,0,0,${0.42 * Math.min(1, m.p)})`,
								}}
							/>
						),
					)}
					{taps.map((t, i) => {
						if (t.p <= 0 || t.p >= 1) return null;
						const land = Math.min(1, t.p / 0.25);
						const ripple = Math.max(0, (t.p - 0.15) / 0.85);
						const fade = t.p > 0.75 ? 1 - (t.p - 0.75) / 0.25 : 1;
						return (
							<React.Fragment key={i}>
								<div style={{position: 'absolute', left: t.x - 70, top: t.y - 70, width: 140, height: 140, borderRadius: 999, background: 'rgba(255,255,255,0.85)', border: `8px solid ${palette.accent}`, boxSizing: 'border-box', opacity: fade * 0.9, transform: `scale(${1.5 - 0.5 * land})`}} />
								<div style={{position: 'absolute', left: t.x - 70, top: t.y - 70, width: 140, height: 140, borderRadius: 999, border: `6px solid #FFFFFF`, opacity: (1 - ripple) * fade, transform: `scale(${1 + ripple * 1.4})`}} />
							</React.Fragment>
						);
					})}
				</div>
				{dim > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.78 * dim})`}} />}
			</div>
		</div>
	);
};

/** Piecewise-linear map from scene frames to source seconds: [[frame, sec], …]. Holds at the ends. */
export const retime = (frame: number, keys: [number, number][]): number => {
	const ks = [...keys].sort((a, b) => a[0] - b[0]);
	if (frame <= ks[0][0]) return ks[0][1];
	for (let i = 1; i < ks.length; i++) {
		const [f0, s0] = ks[i - 1];
		const [f1, s1] = ks[i];
		if (frame < f1) return f1 === f0 ? s1 : s0 + ((frame - f0) / (f1 - f0)) * (s1 - s0);
	}
	return ks[ks.length - 1][1];
};

/** Interpolated camera between keyframes (smoothstep). */
export const camAt = (frame: number, keys: (RecCamera & {at: number})[]): RecCamera => {
	const ks = [...keys].sort((a, b) => a.at - b.at);
	if (frame <= ks[0].at) return ks[0];
	for (let i = 1; i < ks.length; i++) {
		const a = ks[i - 1];
		const b = ks[i];
		if (frame < b.at) {
			const t0 = (frame - a.at) / Math.max(1, b.at - a.at);
			const t = t0 * t0 * (3 - 2 * t0);
			return {cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, zoom: a.zoom + (b.zoom - a.zoom) * t};
		}
	}
	return ks[ks.length - 1];
};

export const recStoryLayout = {top: 300, bottom: story.contentBottom};
