import React from 'react';
import {interpolate, Easing, spring} from 'remotion';
import type {Spec} from '../schema';
import {theme, toneColor} from '../theme';

export const ResultCard: React.FC<{spec: Spec; frame: number; fps: number; start: number}> = ({spec, frame, fps, start}) => {
	if (frame < start) return null;
	const s = spring({frame: frame - start, fps, config: {damping: 18, stiffness: 140, mass: 0.8}});
	const r = spec.result;
	const reveal = Boolean(r.value);
	// Final-value reveal: the number lands with a short, controlled overshoot.
	const pop = spring({frame: frame - start - 2, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
	return (
		<div
			style={{
				position: 'absolute',
				left: theme.safe.left - 16,
				right: theme.safe.right - 56,
				top: reveal ? 492 : 820,
				transform: `translateY(${(1 - s) * 140}px)`,
				opacity: interpolate(s, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}),
				background: '#fff',
				borderRadius: 32,
				border: `2px solid ${theme.grid}`,
				boxShadow: '0 24px 60px rgba(15,17,20,0.12)',
				padding: '40px 44px 36px',
				boxSizing: 'border-box',
			}}
		>
			<div style={{fontSize: 28, fontWeight: 800, letterSpacing: 4, color: theme.muted}}>{r.kicker}</div>
			{r.value && (
				<div
					style={{
						fontSize: r.value.length > 9 ? 150 : 170,
						fontWeight: 900,
						letterSpacing: -6,
						color: toneColor(r.headlineTone),
						lineHeight: 1,
						marginTop: 8,
						fontVariantNumeric: 'tabular-nums',
						transform: `scale(${interpolate(pop, [0, 1], [0.82, 1])})`,
						transformOrigin: 'left center',
					}}
				>
					{r.value}
				</div>
			)}
			{r.headline && <div
				style={{
					fontSize: reveal ? 58 : r.headline.length > 16 ? 76 : r.headline.length > 11 ? 96 : 116,
					fontWeight: 900,
					letterSpacing: -3,
					color: reveal ? theme.ink : toneColor(r.headlineTone),
					lineHeight: 1.05,
					marginTop: reveal ? 14 : 6,
					fontVariantNumeric: 'tabular-nums',
				}}
			>
				{r.headline}
			</div>}
			{r.subline && <div style={{fontSize: 34, fontWeight: 600, color: theme.charcoal, marginTop: 8}}>{r.subline}</div>}
			{r.stats.length > 0 && (
				<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 28px', marginTop: 30}}>
					{r.stats.map((st, i) => {
						const a = interpolate(frame - start, [8 + i * 4, 20 + i * 4], [0, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							easing: Easing.out(Easing.cubic),
						});
						return (
							<div key={i} style={{opacity: a, transform: `translateY(${(1 - a) * 16}px)`, borderTop: `2px solid ${theme.grid}`, paddingTop: 16}}>
								<div style={{fontSize: 24, fontWeight: 700, color: theme.muted, letterSpacing: 1, textTransform: 'uppercase'}}>{st.label}</div>
								<div style={{fontSize: 46, fontWeight: 900, color: toneColor(st.tone), marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: -1}}>
									{st.value}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
