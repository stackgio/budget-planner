import React from 'react';
import {interpolate, Easing} from 'remotion';
import type {Spec} from '../schema';
import {theme} from '../theme';

const renderLine = (line: string, highlight?: string) => {
	if (!highlight || !line.includes(highlight)) return line;
	const [a, ...rest] = line.split(highlight);
	return (
		<>
			{a}
			<span style={{color: theme.up}}>{highlight}</span>
			{rest.join(highlight)}
		</>
	);
};

/**
 * Hook: fully visible on frame 0 (first-second attention), with a quick
 * settle so it feels alive. Replaced by the closing question at the end.
 */
export const HEADER_H = 318;

export const Header: React.FC<{spec: Spec; frame: number; questionFrame: number}> = ({spec, frame, questionFrame}) => {
	const settle = interpolate(frame, [0, 14], [1.025, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const hookOut = interpolate(frame, [questionFrame - 8, questionFrame + 4], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const qIn = interpolate(frame, [questionFrame, questionFrame + 12], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	// Header must end above the counter (HEADER_H px) — size from line count and length.
	const longest = Math.max(...spec.hook.lines.map((l) => l.length));
	const avail = HEADER_H - (spec.hook.kicker ? 46 : 0);
	const byHeight = avail / (spec.hook.lines.length * 1.06);
	const byWidth = 880 / (longest * 0.56);
	const fs = Math.floor(Math.min(96, byHeight, byWidth));
	// Hero layout: one line (e.g. the amount) dominates; the rest are supporting lines.
	const hero = spec.hook.hero;
	const others = spec.hook.lines.filter((_, i) => i !== hero);
	const supFs = Math.floor(Math.min(62, 880 / (Math.max(...others.map((l) => l.length), 1) * 0.54)));
	const heroLine = hero === undefined ? '' : spec.hook.lines[hero] ?? '';
	const heroFs = Math.floor(Math.min(176, 880 / (Math.max(heroLine.length, 1) * 0.6), avail - others.length * supFs * 1.1));
	const heroIn = interpolate(frame, [0, 10], [0.92, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
	const qLen = spec.question.length;
	const qfs = qLen > 60 ? 58 : qLen > 40 ? 66 : 74;

	return (
		<div style={{position: 'absolute', left: theme.safe.left, right: theme.safe.right - 30, top: theme.safe.top + 6, height: HEADER_H}}>
			{hookOut > 0 && (
				<div style={{opacity: hookOut, transform: `scale(${settle})`, transformOrigin: 'left top'}}>
					{spec.hook.kicker && (
						<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 4, color: theme.up, marginBottom: 12}}>
							{spec.hook.kicker}
						</div>
					)}
					{spec.hook.lines.map((l, i) =>
						hero === undefined ? (
							<div key={i} style={{fontSize: fs, fontWeight: 900, color: theme.ink, lineHeight: 1.04, letterSpacing: -2}}>
								{renderLine(l, spec.hook.highlight)}
							</div>
						) : i === hero ? (
							<div
								key={i}
								style={{
									fontSize: heroFs,
									fontWeight: 900,
									color: theme.up,
									lineHeight: 0.98,
									letterSpacing: -5,
									fontVariantNumeric: 'tabular-nums',
									transform: `scale(${heroIn})`,
									transformOrigin: 'left center',
								}}
							>
								{l}
							</div>
						) : (
							<div key={i} style={{fontSize: supFs, fontWeight: 800, color: theme.ink, lineHeight: 1.1, letterSpacing: -1}}>
								{renderLine(l, spec.hook.highlight)}
							</div>
						),
					)}
				</div>
			)}
			{qIn > 0 && (
				<div style={{position: 'absolute', top: 0, left: 0, right: 0, opacity: qIn, transform: `translateY(${(1 - qIn) * 24}px)`}}>
					<div style={{width: 84, height: 10, borderRadius: 5, background: theme.up, marginBottom: 22}} />
					<div style={{fontSize: qfs, fontWeight: 900, color: theme.ink, lineHeight: 1.08, letterSpacing: -1.5}}>
						{spec.question}
					</div>
				</div>
			)}
		</div>
	);
};
