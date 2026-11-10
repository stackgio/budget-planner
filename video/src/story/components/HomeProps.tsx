import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {springs} from '../lib/motion';
import {editorial, story, type Palette} from '../theme';

/**
 * Home-ownership props for Stack With Gio videos: thermostat, house key,
 * speech bubble, rubber stamp, dotted grid, paycheck and grad cap.
 * All original vector art (no brands, no real UI).
 */

/** Wall thermostat close-up. `power` 1 = display lit, 0 = dead. `dial` rotates the outer ring (deg). */
export const Thermostat: React.FC<{
	w?: number;
	temp?: number | string;
	mode?: string;
	power?: number;
	dial?: number;
	glow?: string;
	style?: React.CSSProperties;
}> = ({w = 520, temp = 72, mode = 'COOL', power = 1, dial = 0, glow = '#8FD3FF', style}) => {
	const ticks = Array.from({length: 48}, (_, i) => i);
	return (
		<div style={{position: 'absolute', width: w, height: w, transform: 'translate(-50%,-50%)', ...style}}>
			<svg viewBox="0 0 400 400" width={w} height={w} style={{overflow: 'visible', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.55))'}}>
				<defs>
					<linearGradient id="thBody" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#2A2D33" />
						<stop offset="1" stopColor="#15171B" />
					</linearGradient>
					<radialGradient id="thFace" cx="0.5" cy="0.4" r="0.6">
						<stop offset="0" stopColor="#1C1F24" />
						<stop offset="1" stopColor="#0C0D10" />
					</radialGradient>
				</defs>
				<rect x="0" y="0" width="400" height="400" rx="70" fill="url(#thBody)" stroke="#3A3E46" strokeWidth="3" />
				<g transform={`rotate(${dial} 200 200)`}>
					<circle cx="200" cy="200" r="168" fill="#202329" stroke="#3A3E46" strokeWidth="3" />
					{ticks.map((i) => (
						<line key={i} x1="200" y1="38" x2="200" y2={i % 4 === 0 ? 56 : 48} stroke={i % 4 === 0 ? '#6B717B' : '#454A52'} strokeWidth={i % 4 === 0 ? 4 : 2} transform={`rotate(${i * 7.5} 200 200)`} />
					))}
					<circle cx="200" cy="52" r="7" fill={power > 0.5 ? glow : '#4A4F57'} />
				</g>
				<circle cx="200" cy="200" r="132" fill="url(#thFace)" />
				<circle cx="200" cy="200" r="132" fill={glow} opacity={0.08 * power} />
				<text x="200" y="146" textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize="22" letterSpacing="5" fill={glow} opacity={0.15 + 0.75 * power}>
					{power > 0.5 ? mode : 'OFF'}
				</text>
				<text
					x="200"
					y="245"
					textAnchor="middle"
					fontFamily="Inter"
					fontWeight={900}
					fontSize="108"
					fill={power > 0.02 ? glow : '#3A3E46'}
					opacity={0.25 + 0.75 * power}
					style={{filter: power > 0.3 ? `drop-shadow(0 0 ${14 * power}px ${glow})` : undefined}}
				>
					{power > 0.02 ? `${temp}°` : '--'}
				</text>
				<circle cx="200" cy="290" r="6" fill={power > 0.5 ? glow : '#2A2E35'} opacity={0.9} />
			</svg>
		</div>
	);
};

/** Brass house key, drawn horizontally (bow on the left). Rotate around the bow with `rot`. */
export const HouseKey: React.FC<{w?: number; rot?: number; style?: React.CSSProperties; tone?: string}> = ({w = 520, rot = 0, style, tone = '#E2B54A'}) => (
	<div style={{position: 'absolute', width: w, height: w * 0.4, transform: `translate(-50%,-50%) rotate(${rot}deg)`, transformOrigin: '22% 50%', ...style}}>
		<svg viewBox="0 0 400 160" width={w} height={w * 0.4} style={{overflow: 'visible', filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.35))'}}>
			<defs>
				<linearGradient id="keyMetal" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#F6D98A" />
					<stop offset="0.5" stopColor={tone} />
					<stop offset="1" stopColor="#A87C1E" />
				</linearGradient>
			</defs>
			<path
				d="M88,18 a62,62 0 1,0 0.1,0 Z M88,58 a22,22 0 1,1 -0.1,0 Z"
				fillRule="evenodd"
				fill="url(#keyMetal)"
				stroke="#8A6516"
				strokeWidth="3"
			/>
			<path
				d="M146,66 H382 a8,8 0 0 1 8,8 V94 H372 V112 H356 V98 H340 V118 H322 V98 H306 V110 H290 V94 H146 Z"
				fill="url(#keyMetal)"
				stroke="#8A6516"
				strokeWidth="3"
				strokeLinejoin="round"
			/>
			<line x1="160" y1="80" x2="376" y2="80" stroke="#8A6516" strokeWidth="2" opacity="0.5" />
		</svg>
	</div>
);

/** Rounded speech bubble with a tail. Children are the words. */
export const SpeechBubble: React.FC<{
	w: number;
	tail?: 'bottom-left' | 'bottom-right' | 'left';
	dashed?: boolean;
	palette?: Palette;
	fill?: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({w, tail = 'bottom-left', dashed = false, palette = editorial, fill, style, children}) => {
	const border = `6px ${dashed ? 'dashed' : 'solid'} ${palette.ink}`;
	return (
		<div style={{position: 'absolute', width: w, ...style}}>
			<div style={{position: 'relative', background: fill ?? palette.paper, border, borderRadius: 44, padding: '34px 42px', boxShadow: dashed ? 'none' : `0 22px 40px ${palette.shadow}`, fontFamily: story.font}}>
				{children}
				{!dashed && (
					<svg
						width="70"
						height="64"
						viewBox="0 0 70 64"
						style={{
							position: 'absolute',
							...(tail === 'left' ? {left: -58, top: '45%', transform: 'rotate(90deg)'} : tail === 'bottom-right' ? {right: 70, bottom: -58, transform: 'scaleX(-1)'} : {left: 70, bottom: -58}),
						}}
					>
						<path d="M0,0 L60,0 L6,58 Z" fill={fill ?? palette.paper} />
						<path d="M60,3 L6,58 L4,3" fill="none" stroke={palette.ink} strokeWidth="6" strokeLinejoin="round" />
					</svg>
				)}
			</div>
		</div>
	);
};

/** Rubber stamp that slams in at `at` (scene frame). */
export const Stamp: React.FC<{text: string; at: number; color: string; rot?: number; fontSize?: number; style?: React.CSSProperties}> = ({text, at, color, rot = -8, fontSize = 64, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame: frame - at, fps, config: springs.heavy});
	if (frame < at) return null;
	return (
		<div
			style={{
				position: 'absolute',
				transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1 + (1 - p) * 0.9})`,
				opacity: Math.min(1, p * 2.2),
				border: `${Math.max(6, fontSize * 0.1)}px solid ${color}`,
				borderRadius: fontSize * 0.28,
				padding: `${fontSize * 0.18}px ${fontSize * 0.4}px`,
				color,
				fontFamily: story.font,
				fontWeight: 900,
				fontSize,
				letterSpacing: fontSize * 0.06,
				whiteSpace: 'nowrap',
				lineHeight: 1,
				...style,
			}}
		>
			{text}
		</div>
	);
};

/** Matte black board with a fine dotted grid (ending layouts). */
export const DotGrid: React.FC<{dot?: string; gap?: number; bg?: string}> = ({dot = 'rgba(245,242,234,0.16)', gap = 40, bg = '#0B0C0E'}) => (
	<AbsoluteFill style={{background: bg}}>
		<AbsoluteFill style={{backgroundImage: `radial-gradient(${dot} 2.2px, transparent 2.6px)`, backgroundSize: `${gap}px ${gap}px`, backgroundPosition: `${gap / 2}px ${gap / 2}px`}} />
		<AbsoluteFill style={{background: 'radial-gradient(110% 75% at 50% 42%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
	</AbsoluteFill>
);

/** Plain paycheck stub — deliberately no amount, employer or name. */
export const Paycheck: React.FC<{w?: number; palette?: Palette; label?: string; style?: React.CSSProperties}> = ({w = 380, palette = editorial, label = 'PAYCHECK', style}) => (
	<div style={{position: 'absolute', width: w, height: w * 0.5, transform: 'translate(-50%,-50%)', background: '#FFFFFF', borderRadius: 18, boxShadow: `0 18px 30px ${palette.shadow}`, overflow: 'hidden', fontFamily: story.font, ...style}}>
		<div style={{height: w * 0.1, background: palette.accent}} />
		<div style={{padding: w * 0.06}}>
			<div style={{fontSize: Math.max(24, w * 0.07), fontWeight: 900, letterSpacing: 3, color: palette.ink}}>{label}</div>
			{[0.9, 0.62, 0.75].map((f, i) => (
				<div key={i} style={{height: w * 0.022, width: `${f * 100}%`, background: palette.line, borderRadius: 4, marginTop: w * 0.05}} />
			))}
		</div>
	</div>
);

/** Graduation cap (mortarboard). */
export const GradCap: React.FC<{w?: number; color?: string; tassel?: string; style?: React.CSSProperties}> = ({w = 220, color = '#121316', tassel = '#E2A72E', style}) => (
	<svg viewBox="0 0 200 140" width={w} height={w * 0.7} style={{position: 'absolute', transform: 'translate(-50%,-50%)', overflow: 'visible', ...style}}>
		<path d="M100,10 L195,50 L100,90 L5,50 Z" fill={color} />
		<path d="M45,68 V105 Q100,135 155,105 V68 L100,90 Z" fill={color} />
		<path d="M100,50 L170,62 V100" stroke={tassel} strokeWidth="6" fill="none" strokeLinecap="round" />
		<circle cx="170" cy="106" r="9" fill={tassel} />
	</svg>
);
