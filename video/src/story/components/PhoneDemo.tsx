import React from 'react';
import {Freeze, OffthreadVideo, staticFile, useVideoConfig} from 'remotion';
import {cinematic, type Palette} from '../theme';
import type {RecCamera, RecMark, RecTap, TimedRegion} from './ScreenRecording';

/**
 * A large, modern Pro-style iPhone (generic — not a claim of exact hardware
 * accuracy) playing a REAL screen recording, with a camera that moves the
 * whole device. The recording keeps its native aspect ratio (no distortion);
 * the device is cropped by the frame edges like a hand-held demo shot.
 *
 * Coordinates for camera / redact / marks / taps are the recording's natural
 * pixels. Redactions are keyed to SOURCE seconds so they follow the footage.
 */
export const PhoneDemo: React.FC<{
	src: string;
	natural: {w: number; h: number};
	srcSec: number;
	camera: RecCamera;
	/** on-screen width of the device SCREEN at zoom 1 (≈ 68% of 1080) */
	screenW?: number;
	/** frame y where camera.cy is placed */
	focusY?: number;
	/** keep the device covering this vertical window (no empty background inside it) */
	windowTop?: number;
	windowBottom?: number;
	/** never let the screen top rise above this frame y (keeps a headline clear) */
	minTop?: number;
	redact?: TimedRegion[];
	marks?: RecMark[];
	taps?: RecTap[];
	/** 0..1 darkens the screen (for a labelled text step on top) */
	dim?: number;
	/** subtle tilt for life (degrees) */
	tilt?: number;
	palette?: Palette;
}> = ({src, natural, srcSec, camera, screenW = 740, focusY = 840, windowTop = 300, windowBottom = 1380, minTop = -Infinity, redact = [], marks = [], taps = [], dim = 0, tilt = 0, palette = cinematic}) => {
	const {fps} = useVideoConfig();
	const s0 = screenW / natural.w;
	const SH = natural.h * s0;
	const z = camera.zoom;
	const k = s0 * z;
	// screen top-left on the frame
	let x = 540 - camera.cx * k;
	let y = focusY - camera.cy * k;
	const wOn = natural.w * k;
	const hOn = natural.h * k;
	if (wOn <= 1000) x = 540 - wOn / 2;
	else x = Math.min(40, Math.max(1080 - 40 - wOn, x));
	y = Math.max(minTop, Math.min(windowTop, Math.max(windowBottom - hOn, y)));

	const bezel = 15; // black glass border
	const rim = 7; // metal frame
	const rScreen = 0.118 * screenW;
	const active = redact.filter((r) => srcSec >= r.from && srcSec < r.to);
	return (
		<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${z}) rotate(${tilt}deg)`}}>
			{/* metal frame */}
			<div
				style={{
					position: 'absolute',
					left: -bezel - rim,
					top: -bezel - rim,
					width: screenW + 2 * (bezel + rim),
					height: SH + 2 * (bezel + rim),
					borderRadius: rScreen + bezel + rim,
					background: 'linear-gradient(135deg, #5B5F66 0%, #2A2C31 22%, #8A8E95 48%, #2B2D32 70%, #61656C 100%)',
					boxShadow: '0 60px 120px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)',
				}}
			/>
			{/* side buttons */}
			{[
				{side: -1, top: 0.17, h: 0.035},
				{side: -1, top: 0.23, h: 0.07},
				{side: -1, top: 0.32, h: 0.07},
				{side: 1, top: 0.26, h: 0.11},
				{side: 1, top: 0.6, h: 0.06},
			].map((b, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: b.side < 0 ? -bezel - rim - 5 : screenW + bezel + rim - 1,
						top: SH * b.top,
						width: 6,
						height: SH * b.h,
						borderRadius: 3,
						background: 'linear-gradient(90deg, #3A3D42, #7C8087, #3A3D42)',
					}}
				/>
			))}
			{/* glass + bezel */}
			<div style={{position: 'absolute', left: -bezel, top: -bezel, width: screenW + 2 * bezel, height: SH + 2 * bezel, borderRadius: rScreen + bezel, background: '#050506'}} />
			{/* screen */}
			<div style={{position: 'absolute', left: 0, top: 0, width: screenW, height: SH, borderRadius: rScreen, overflow: 'hidden', background: '#000'}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: natural.w, height: natural.h, transformOrigin: '0 0', transform: `scale(${s0})`}}>
					<Freeze frame={Math.max(0, Math.round(srcSec * fps))}>
						<OffthreadVideo src={staticFile(src)} muted style={{width: natural.w, height: natural.h, display: 'block'}} />
					</Freeze>
					{active.map((r, i) => (
						<div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', background: 'rgba(58,60,66,0.6)', borderRadius: 18}} />
					))}
					{marks.map((m, i) => {
						const p = Math.min(1, Math.max(0, m.p));
						if (p <= 0) return null;
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: m.x - 12,
									top: m.y - 12,
									width: m.w + 24,
									height: m.h + 24,
									border: `9px solid ${m.color ?? palette.accent}`,
									borderRadius: 28,
									opacity: p,
									transform: `scale(${1.05 - 0.05 * p})`,
									boxShadow: `0 0 0 3000px rgba(0,0,0,${0.34 * p})`,
								}}
							/>
						);
					})}
					{taps.map((t, i) => {
						if (t.p <= 0 || t.p >= 1) return null;
						const land = Math.min(1, t.p / 0.22);
						const ripple = Math.max(0, (t.p - 0.18) / 0.82);
						const fade = t.p > 0.7 ? 1 - (t.p - 0.7) / 0.3 : 1;
						return (
							<React.Fragment key={i}>
								<div style={{position: 'absolute', left: t.x - 66, top: t.y - 66, width: 132, height: 132, borderRadius: 999, background: 'rgba(255,255,255,0.78)', boxShadow: `0 0 0 7px ${palette.accent}, 0 8px 24px rgba(0,0,0,0.45)`, opacity: fade, transform: `scale(${1.45 - 0.45 * land - 0.08 * Math.sin(Math.min(1, ripple) * Math.PI)})`}} />
								<div style={{position: 'absolute', left: t.x - 66, top: t.y - 66, width: 132, height: 132, borderRadius: 999, border: '6px solid #FFFFFF', opacity: (1 - ripple) * fade * 0.9, transform: `scale(${1 + ripple * 1.5})`}} />
							</React.Fragment>
						);
					})}
				</div>
				{dim > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.8 * dim})`}} />}
				{/* glass reflection — very subtle */}
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 28%, rgba(255,255,255,0) 40%)', pointerEvents: 'none'}} />
			</div>
			{/* Dynamic Island (hardware) */}
			<div style={{position: 'absolute', left: screenW / 2 - 0.15 * screenW, top: 0.0135 * SH, width: 0.3 * screenW, height: 0.04 * SH, borderRadius: 999, background: '#000'}} />
		</div>
	);
};

/** Dark scrims so the header and the caption band stay readable over a full-bleed phone. */
export const DemoScrims: React.FC<{top?: number; bottom?: number}> = ({top = 370, bottom = 1360}) => (
	<>
		<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: top, background: 'linear-gradient(180deg, rgba(11,12,14,0.98) 0%, rgba(11,12,14,0.95) 62%, rgba(11,12,14,0) 100%)'}} />
		<div style={{position: 'absolute', left: 0, right: 0, top: bottom, bottom: 0, background: 'linear-gradient(180deg, rgba(11,12,14,0) 0%, rgba(11,12,14,0.96) 13%, rgba(11,12,14,0.98) 100%)'}} />
	</>
);
