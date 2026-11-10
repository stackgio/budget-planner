import React from 'react';
import {AbsoluteFill} from 'remotion';

/** Tracking-shot environment: sky, layered hills, roadside posts, asphalt with moving lane dashes. */
export const Road: React.FC<{frame: number; mood: 'dusk' | 'day'; speed?: number; horizon?: number}> = ({frame, mood, speed = 14, horizon = 1060}) => {
	const dusk = mood === 'dusk';
	const sky = dusk
		? 'linear-gradient(180deg, #141A30 0%, #2C2D4F 30%, #8A4E6A 62%, #E98E5A 86%, #F6B676 100%)'
		: 'linear-gradient(180deg, #6FA8DC 0%, #A9CDEB 45%, #E6EFF4 82%, #F6EEDF 100%)';
	const far = dusk ? '#2A2338' : '#9DB3A6';
	const near = dusk ? '#18151F' : '#6E8E6C';
	const asphalt = dusk ? 'linear-gradient(180deg, #1A191E 0%, #0D0D10 100%)' : 'linear-gradient(180deg, #8E8D8A 0%, #6E6D6A 100%)';
	const x = frame * speed;
	const hill = (amp: number, base: number, period: number, off: number) => {
		let d = `M0 ${horizon}`;
		for (let px = 0; px <= 1080; px += 30) {
			const u = (px + off) / period;
			d += ` L${px} ${base - amp * (0.55 + 0.45 * Math.sin(u * 2.1) * Math.cos(u * 0.7 + 1))}`;
		}
		return `${d} L1080 ${horizon} Z`;
	};
	return (
		<AbsoluteFill style={{background: sky, overflow: 'hidden'}}>
			{dusk ? (
				<div style={{position: 'absolute', left: 640, top: horizon - 210, width: 220, height: 220, borderRadius: 110, background: 'radial-gradient(circle, rgba(255,226,170,0.95) 0%, rgba(255,190,120,0.5) 45%, rgba(255,170,100,0) 70%)'}} />
			) : (
				<div style={{position: 'absolute', left: 760, top: 160, width: 520, height: 520, borderRadius: 260, background: 'radial-gradient(circle, rgba(255,250,225,0.95) 0%, rgba(255,240,200,0.4) 35%, rgba(255,240,200,0) 70%)'}} />
			)}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d={hill(120, horizon - 40, 420, x * 0.08)} fill={far} opacity={0.85} />
				<path d={hill(70, horizon, 260, x * 0.2)} fill={near} />
			</svg>
			{/* road */}
			<div style={{position: 'absolute', left: 0, right: 0, top: horizon, bottom: 0, background: asphalt}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: horizon, height: 6, background: dusk ? 'rgba(255,190,140,0.35)' : 'rgba(255,255,255,0.6)'}} />
			{/* lane dashes in front of the car */}
			{Array.from({length: 6}).map((_, i) => {
				const px = ((i * 260 - x * 1.0) % 1560 + 1560) % 1560 - 240;
				return <div key={i} style={{position: 'absolute', left: px, top: 1500, width: 150, height: 14, borderRadius: 4, background: dusk ? 'rgba(255,220,180,0.55)' : 'rgba(255,255,255,0.85)'}} />;
			})}
			{/* roadside posts (parallax) */}
			{Array.from({length: 4}).map((_, i) => {
				const px = ((i * 420 - x * 0.55) % 1680 + 1680) % 1680 - 300;
				return (
					<div key={i} style={{position: 'absolute', left: px, top: horizon - 260, width: 10, height: 268, background: dusk ? '#0E0D12' : '#5E6A70'}}>
						{dusk && <div style={{position: 'absolute', left: -20, top: -14, width: 50, height: 22, borderRadius: 11, background: 'rgba(255,214,150,0.9)', boxShadow: '0 0 40px 14px rgba(255,190,110,0.45)'}} />}
					</div>
				);
			})}
			{/* warm atmosphere */}
			<div style={{position: 'absolute', inset: 0, background: dusk ? 'radial-gradient(ellipse 80% 40% at 60% 55%, rgba(255,170,110,0.18) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(ellipse 80% 50% at 80% 10%, rgba(255,240,210,0.35) 0%, rgba(0,0,0,0) 70%)'}} />
		</AbsoluteFill>
	);
};
