import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../../brand/theme';
import {clamp, ease, springAt, springs} from '../../lib/motion';

export type Point = {x: number; y: number};
export type Series = {
	label: string;
	color?: string;
	points: Point[];
	/** Live value label: follow the head (default), only at the end, or never. */
	valueLabel?: 'head' | 'end' | 'none';
};

// Round an axis maximum up to 1, 2, 2.5 or 5 x 10^n so ticks are clean numbers.
const niceCeil = (v: number) => {
	const p = Math.pow(10, Math.floor(Math.log10(v)));
	const m = [1, 2, 2.5, 5, 10].find((x) => x * p >= v) ?? 10;
	return m * p;
};

type Props = {
	series: Series[];
	/** Frame the line starts drawing, and frame it reaches the last point. */
	startFrame: number;
	endFrame: number;
	width?: number;
	height?: number;
	yMin?: number;
	yMax?: number;
	formatY?: (v: number) => string;
	formatX?: (v: number) => string;
	/** X values to label on the axis (default: first, middle, last). */
	xTicks?: number[];
	yTicks?: number;
	/** Required: where the numbers come from. Shown under the chart. */
	source: string;
	/** Moments to call out as the line passes them. */
	annotations?: {x: number; label: string}[];
	log?: boolean;
};

const money = (v: number) =>
	v >= 1e6 ? `$${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K` : `$${v.toFixed(0)}`;

/**
 * Line chart that draws itself left to right, with a glowing head that carries
 * the live value. Every series must come with a source.
 */
export const GrowthChart: React.FC<Props> = ({
	series,
	startFrame,
	endFrame,
	width = 860,
	height = 820,
	yMin,
	yMax,
	formatY = money,
	formatX = (v) => String(Math.round(v)),
	xTicks,
	yTicks = 4,
	source,
	annotations = [],
	log = false,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pad = {l: 130, r: 120, t: 40, b: 80};
	const all = series.flatMap((s) => s.points);
	const x0 = Math.min(...all.map((p) => p.x));
	const x1 = Math.max(...all.map((p) => p.x));
	const lo = yMin ?? (log ? Math.min(...all.map((p) => p.y)) : 0);
	const hi = yMax ?? (log ? Math.max(...all.map((p) => p.y)) * 1.08 : niceCeil(Math.max(...all.map((p) => p.y)) * 1.05));
	const tf = (v: number) => (log ? Math.log10(v) : v);
	const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * (width - pad.l - pad.r);
	const sy = (y: number) => height - pad.b - ((tf(y) - tf(lo)) / (tf(hi) - tf(lo))) * (height - pad.t - pad.b);

	const p = interpolate(frame, [startFrame, endFrame], [0, 1], {...clamp, easing: ease.inOut});
	const headX = x0 + (x1 - x0) * p;
	const gridIn = interpolate(frame, [startFrame - 15, startFrame], [0, 1], clamp);

	// Points up to the head, with the head interpolated between samples.
	const visible = (pts: Point[]) => {
		const out: Point[] = [];
		for (let i = 0; i < pts.length; i++) {
			if (pts[i].x <= headX) out.push(pts[i]);
			else {
				const a = pts[i - 1];
				if (a) {
					const t = (headX - a.x) / (pts[i].x - a.x);
					out.push({x: headX, y: log ? Math.pow(10, tf(a.y) + (tf(pts[i].y) - tf(a.y)) * t) : a.y + (pts[i].y - a.y) * t});
				}
				break;
			}
		}
		return out;
	};

	const ticksX = xTicks ?? [x0, Math.round((x0 + x1) / 2), x1];
	const ticksY = Array.from({length: yTicks + 1}, (_, i) =>
		log ? Math.pow(10, tf(lo) + ((tf(hi) - tf(lo)) * i) / yTicks) : lo + ((hi - lo) * i) / yTicks,
	);

	return (
		<div style={{width, fontFamily: fonts.body}}>
			<svg width={width} height={height} style={{overflow: 'visible'}}>
				<defs>
					{series.map((s, i) => (
						<linearGradient key={i} id={`area-${i}`} x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stopColor={s.color ?? colors.green} stopOpacity={0.28} />
							<stop offset="100%" stopColor={s.color ?? colors.green} stopOpacity={0} />
						</linearGradient>
					))}
				</defs>
				<g opacity={gridIn}>
					{ticksY.map((v, i) => (
						<g key={i}>
							<line x1={pad.l} x2={width - pad.r} y1={sy(v)} y2={sy(v)} stroke={colors.line} strokeWidth={2} strokeDasharray={i === 0 ? undefined : '4 10'} />
							<text x={pad.l - 20} y={sy(v) + 10} textAnchor="end" fill={colors.dim} fontSize={30} fontWeight={600}>
								{formatY(v)}
							</text>
						</g>
					))}
				</g>
				{ticksX.map((v) => (
					<text
						key={v}
						x={sx(v)}
						y={height - pad.b + 52}
						textAnchor="middle"
						fill={colors.muted}
						fontSize={32}
						fontWeight={700}
						opacity={interpolate(headX, [v - (x1 - x0) * 0.04, v], [0.25, 1], clamp)}
					>
						{formatX(v)}
					</text>
				))}
				{series.map((s, i) => {
					const pts = visible(s.points);
					if (pts.length < 2) return null;
					const d = pts.map((q, k) => `${k ? 'L' : 'M'} ${sx(q.x)} ${sy(q.y)}`).join(' ');
					const head = pts[pts.length - 1];
					const c = s.color ?? colors.green;
					return (
						<g key={i}>
							<path d={`${d} L ${sx(head.x)} ${sy(lo)} L ${sx(pts[0].x)} ${sy(lo)} Z`} fill={`url(#area-${i})`} />
							<path d={d} fill="none" stroke={c} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" style={{filter: `drop-shadow(0 0 14px ${c}88)`}} />
							<circle cx={sx(head.x)} cy={sy(head.y)} r={16} fill={c} />
							<circle cx={sx(head.x)} cy={sy(head.y)} r={30} fill={c} opacity={0.18 + 0.1 * Math.sin(frame / 4)} />
							{(s.valueLabel ?? 'head') === 'head' || ((s.valueLabel === 'end') && p >= 1) ? (
								<text x={sx(head.x)} y={sy(head.y) - 48} textAnchor="middle" fill={colors.white} fontSize={40} fontWeight={800} fontFamily={fonts.display}>
									{formatY(head.y)}
								</text>
							) : null}
							<text
								x={sx(head.x) - 40}
								y={sy(head.y) - 20}
								textAnchor="end"
								fill={c}
								fontSize={30}
								fontWeight={700}
								opacity={interpolate(frame, [endFrame, endFrame + 10], [0, 1], clamp)}
							>
								{s.label}
							</text>
						</g>
					);
				})}
				{annotations.map((a) => {
					const ap = springAt(frame, fps, startFrame + (endFrame - startFrame) * ((a.x - x0) / (x1 - x0)), springs.pop);
					if (ap <= 0) return null;
					return (
						<g key={a.x} opacity={Math.min(1, ap)}>
							<line x1={sx(a.x)} x2={sx(a.x)} y1={pad.t} y2={height - pad.b} stroke={colors.white} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 8" />
							<text x={sx(a.x) + 12} y={pad.t + 30} fill={colors.white} fontSize={30} fontWeight={700}>
								{a.label}
							</text>
						</g>
					);
				})}
			</svg>
			<div style={{fontSize: 24, color: colors.dim, marginTop: 8, paddingLeft: pad.l - 110, opacity: gridIn}}>Source: {source}</div>
		</div>
	);
};
