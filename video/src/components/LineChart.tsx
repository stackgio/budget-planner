import React, {useMemo} from 'react';
import {interpolate, Easing} from 'remotion';
import type {Spec} from '../schema';
import type {Timeline} from '../lib/timeline';
import {valueAt} from '../lib/timeline';
import {formatCompact, formatDate, formatMoney, parseISO} from '../lib/format';
import {seriesColor, theme} from '../theme';
import {EventCallout} from './EventCallout';
import {TipTags, investedText, type Tag} from './TipTags';

export const CHART = {x: 56, y: 780, w: 968, h: 690};
// Plot area inside the chart box (room for y labels on the left, years below).
const PAD = {l: 112, r: 34, t: 30, b: 64};
const PW = CHART.w - PAD.l - PAD.r;
const PH = CHART.h - PAD.t - PAD.b;

const niceStep = (range: number, target = 5) => {
	const raw = range / target;
	const mag = Math.pow(10, Math.floor(Math.log10(raw)));
	const m = raw / mag;
	const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
	return nice * mag;
};

const smooth = Easing.bezier(0.45, 0, 0.2, 1);

type Props = {spec: Spec; tl: Timeline; frame: number};

export const LineChart: React.FC<Props> = ({spec, tl, frame}) => {
	const dates = spec.series[0].dates;
	const n = dates.length;
	const t0 = parseISO(dates[0]);
	const t1 = parseISO(dates[n - 1]);
	const xs = useMemo(() => dates.map((d) => PAD.l + ((parseISO(d) - t0) / (t1 - t0)) * PW), [dates, t0, t1]);

	const p = tl.progress[frame];
	const dMax = tl.domainMax[frame];
	const dMin = tl.domainMin[frame];
	const isLog = spec.yScale === 'log';
	const y = (v: number) => {
		if (isLog) {
			const a = Math.log10(Math.max(v, dMin));
			return PAD.t + PH - ((a - Math.log10(dMin)) / (Math.log10(dMax) - Math.log10(dMin))) * PH;
		}
		return PAD.t + PH - ((v - dMin) / (dMax - dMin)) * PH;
	};
	const xAt = (q: number) => valueAt(xs, q);

	const last = Math.floor(p);
	const linePath = (vals: number[]) => {
		let d = `M${xs[0].toFixed(1)},${y(vals[0]).toFixed(1)}`;
		for (let i = 1; i <= last; i++) d += `L${xs[i].toFixed(1)},${y(vals[i]).toFixed(1)}`;
		if (p > last) d += `L${xAt(p).toFixed(1)},${y(valueAt(vals, p)).toFixed(1)}`;
		return d;
	};
	const base = spec.series[0].contributed;
	const baseConst = base.every((v) => v === base[0]);
	// Full-width baseline (for gain/loss clipping)
	let baseFull = `M${xs[0]},${y(base[0])}`;
	for (let i = 1; i < n; i++) baseFull += `L${xs[i].toFixed(1)},${y(base[i]).toFixed(1)}`;
	const right = PAD.l + PW + 40;
	const left = PAD.l - 40;
	const clipAbove = `${baseFull}L${right},${y(base[n - 1])}L${right},-2000L${left},-2000L${left},${y(base[0])}Z`;
	const clipBelow = `${baseFull}L${right},${y(base[n - 1])}L${right},4000L${left},4000L${left},${y(base[0])}Z`;

	// --- y ticks with cross-fade when the step changes (domain grows)
	const stepAt = (fr: number) =>
		isLog ? 0 : niceStep(tl.domainMax[Math.max(0, fr)] - tl.domainMin[Math.max(0, fr)]);
	const fadeWin = 8;
	const stepWeights = new Map<number, number>();
	for (let i = 0; i < fadeWin; i++) {
		const s = stepAt(frame - i);
		stepWeights.set(s, (stepWeights.get(s) ?? 0) + 1 / fadeWin);
	}
	const ticks: {v: number; o: number}[] = [];
	if (isLog) {
		for (let e = Math.floor(Math.log10(dMin)); e <= Math.ceil(Math.log10(dMax)); e++) {
			for (const m of [1, 2, 5]) {
				const v = m * Math.pow(10, e);
				if (v >= dMin && v <= dMax) ticks.push({v, o: m === 1 ? 1 : 0.55});
			}
		}
	} else {
		stepWeights.forEach((w, s) => {
			for (let v = 0; v <= dMax * 1.0001; v += s) {
				const ex = ticks.find((t) => Math.abs(t.v - v) < s * 1e-6);
				if (ex) ex.o = Math.min(1, ex.o + w);
				else ticks.push({v, o: w});
			}
		});
	}

	// --- year ticks
	const y0 = new Date(t0).getUTCFullYear();
	const y1 = new Date(t1).getUTCFullYear();
	const span = y1 - y0;
	const every = span > 24 ? 5 : span > 12 ? 2 : 1;
	const years: {label: string; x: number; t: number}[] = [];
	for (let yr = y0 + 1; yr <= y1; yr++) {
		if ((yr - y0) % every !== 0 && span > 12) continue;
		const t = Date.UTC(yr, 0, 1);
		if (t <= t0 || t > t1) continue;
		years.push({label: String(yr), x: PAD.l + ((t - t0) / (t1 - t0)) * PW, t});
	}
	const tipX = xAt(p);

	// --- camera: subtle drift + push-in on events
	let zoom = interpolate(frame, [0, tl.durationInFrames], [1, 1.025]);
	// drift anchors on the y-axis so its labels never slide out of the chart box
	let focusX = PAD.l;
	let pushIn = 0;
	let focusY = PAD.t + PH / 2;
	for (const ev of tl.events) {
		const env =
			interpolate(frame, [ev.frame - 20, ev.frame, ev.holdEnd, ev.holdEnd + 26], [0, 1, 1, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
				easing: smooth,
			}) || 0;
		if (env > 0) {
			const s = spec.series.find((ss) => ss.id === ev.event.seriesId) ?? spec.series[0];
			zoom *= 1 + (ev.event.zoom - 1) * env;
			pushIn = Math.max(pushIn, env);
			// pull the origin halfway to the nearest edge so axis labels are not cropped
			const px = xs[ev.index];
			focusX = px < CHART.w / 2 ? px * 0.5 : px + (CHART.w - px) * 0.5;
			focusY = 0.5 * y(s.values[ev.index]) + 0.5 * (PAD.t + PH);
		}
	}
	// axis labels fade during a push-in rather than being cropped mid-glyph
	const labelO = 1 - pushIn;
	const endDim = interpolate(frame, [tl.resultFrame - 4, tl.resultFrame + 12], [1, 0.14], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const gainloss = spec.colorMode === 'gainloss';

	// Callout windows (tip tags step aside while a callout is on screen)
	const calloutUntil = tl.events.map((ev, k) => {
		const next = tl.events[k + 1];
		return Math.min(next ? next.frame - 8 : Infinity, tl.resultFrame - 6, ev.holdEnd + 40);
	});
	let tagOpacity = 1;
	tl.events.forEach((ev, k) => {
		const o = interpolate(frame, [ev.frame - 12, ev.frame - 4, calloutUntil[k] + 6, calloutUntil[k] + 14], [1, 0, 0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		tagOpacity = Math.min(tagOpacity, o);
	});
	const tags: Tag[] = spec.series.map((s, i) => {
		const v = valueAt(s.values, p);
		const c = valueAt(s.contributed, p);
		return {
			text: formatMoney(v),
			bg: gainloss && !s.color ? (v >= c ? theme.up : theme.down) : seriesColor(spec, i),
			y: y(v),
		};
	});
	tags.push({text: investedText(valueAt(base, p)), bg: theme.ink, y: y(valueAt(base, p))});
	const colorOf = (i: number) => seriesColor(spec, i);

	return (
		<div
			style={{
				position: 'absolute',
				left: CHART.x,
				top: CHART.y,
				width: CHART.w,
				height: CHART.h,
				overflow: 'hidden',
				opacity: endDim,
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transformOrigin: `${focusX}px ${focusY}px`,
					transform: `scale(${zoom})`,
				}}
			>
				<svg width={CHART.w} height={CHART.h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<defs>
						<clipPath id="above">
							<path d={clipAbove} />
						</clipPath>
						<clipPath id="below">
							<path d={clipBelow} />
						</clipPath>
						<linearGradient id="fill0" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={colorOf(0)} stopOpacity={0.18} />
							<stop offset="100%" stopColor={colorOf(0)} stopOpacity={0} />
						</linearGradient>
					</defs>

					{/* grid */}
					{ticks.map((t) => (
						<g key={`t${t.v}`} opacity={t.o}>
							<line x1={PAD.l} x2={PAD.l + PW} y1={y(t.v)} y2={y(t.v)} stroke={theme.grid} strokeWidth={2} />
							<text
								opacity={labelO}
								x={PAD.l - 20}
								y={y(t.v) + 9}
								textAnchor="end"
								fontSize={26}
								fontWeight={700}
								fill={theme.charcoal}
								style={{fontVariantNumeric: 'tabular-nums'}}
							>
								{formatCompact(t.v)}
							</text>
						</g>
					))}
					{/* L-shaped axes: bold y-axis + x-axis (signature look) */}
					<path
						d={`M${PAD.l},${PAD.t - 18}L${PAD.l},${PAD.t + PH}L${PAD.l + PW},${PAD.t + PH}`}
						fill="none"
						stroke={theme.ink}
						strokeWidth={6}
						strokeLinejoin="miter"
						strokeLinecap="square"
					/>
					{years.map((yr) => (
						<text
							key={yr.label}
							x={yr.x}
							y={PAD.t + PH + 44}
							textAnchor="middle"
							fontSize={26}
							fontWeight={700}
							opacity={labelO}
							fill={yr.x <= tipX ? theme.ink : theme.faint}
						>
							{yr.label}
						</text>
					))}

					{/* baseline: cash invested */}
					<path
						d={(() => {
							let d = `M${xs[0]},${y(base[0])}`;
							const end = baseConst ? n - 1 : last;
							for (let i = 1; i <= end; i++) d += `L${xs[i].toFixed(1)},${y(base[i]).toFixed(1)}`;
							if (!baseConst && p > last) d += `L${tipX.toFixed(1)},${y(valueAt(base, p)).toFixed(1)}`;
							return d;
						})()}
						fill="none"
						stroke={theme.faint}
						strokeWidth={3}
						strokeDasharray="10 10"
					/>

					{/* area + lines */}
					{gainloss ? (
						<>
							<path
								d={`${linePath(spec.series[0].values)}${(() => {
									let d = '';
									if (p > last) d += `L${tipX.toFixed(1)},${y(valueAt(base, p)).toFixed(1)}`;
									for (let i = last; i >= 0; i--) d += `L${xs[i].toFixed(1)},${y(base[i]).toFixed(1)}`;
									return d;
								})()}Z`}
								fill={theme.upSoft}
								clipPath="url(#above)"
							/>
							<path
								d={`${linePath(spec.series[0].values)}${(() => {
									let d = '';
									if (p > last) d += `L${tipX.toFixed(1)},${y(valueAt(base, p)).toFixed(1)}`;
									for (let i = last; i >= 0; i--) d += `L${xs[i].toFixed(1)},${y(base[i]).toFixed(1)}`;
									return d;
								})()}Z`}
								fill={theme.downSoft}
								clipPath="url(#below)"
							/>
							<path d={linePath(spec.series[0].values)} fill="none" stroke={theme.up} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" clipPath="url(#above)" />
							<path d={linePath(spec.series[0].values)} fill="none" stroke={theme.down} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" clipPath="url(#below)" />
						</>
					) : (
						<>
							{spec.series.length === 1 && (
								<path d={`${linePath(spec.series[0].values)}L${tipX},${PAD.t + PH}L${xs[0]},${PAD.t + PH}Z`} fill="url(#fill0)" />
							)}
							{spec.series
								.map((s, i) => ({s, i}))
								.reverse()
								.map(({s, i}) => (
									<path key={s.id} d={linePath(s.values)} fill="none" stroke={colorOf(i)} strokeWidth={i === 0 ? 7 : 6} strokeLinejoin="round" strokeLinecap="round" />
								))}
						</>
					)}

					{/* event markers that have been passed */}
					{tl.events.map((ev, k) =>
						frame >= ev.frame ? (
							<circle
								key={`m${k}`}
								cx={xs[ev.index]}
								cy={y((spec.series.find((s) => s.id === ev.event.seriesId) ?? spec.series[0]).values[ev.index])}
								r={9}
								fill="#fff"
								stroke={theme.ink}
								strokeWidth={4}
							/>
						) : null,
					)}

					{/* tips */}
					{spec.series.map((s, i) => {
						const v = valueAt(s.values, p);
						const c = gainloss ? (v >= valueAt(s.contributed, p) ? theme.up : theme.down) : colorOf(i);
						const pulse = (frame % 30) / 30;
						return (
							<g key={`tip${s.id}`}>
								{frame < tl.drawEnd && <circle cx={tipX} cy={y(v)} r={12 + pulse * 22} fill={c} opacity={0.22 * (1 - pulse)} />}
								<circle cx={tipX} cy={y(v)} r={12} fill={c} stroke="#fff" strokeWidth={5} />
							</g>
						);
					})}

				</svg>

				<TipTags
					tags={tags}
					tipX={tipX}
					chartW={CHART.w}
					plotTop={PAD.t}
					plotBottom={PAD.t + PH}
					opacity={tagOpacity}
				/>

				{tl.events.map((ev, k) => {
					const s = spec.series.find((ss) => ss.id === ev.event.seriesId) ?? spec.series[0];
					const until = calloutUntil[k];
					return (
						<EventCallout
							key={`c${k}`}
							ev={ev}
							frame={frame}
							until={until}
							px={xs[ev.index]}
							py={y(s.values[ev.index])}
							chartW={CHART.w}
							plotTop={PAD.t}
							plotLeft={PAD.l}
							plotBottom={PAD.t + PH}
							dateLabel={formatDate(spec.series[0].dates[ev.index], 'long')}
						/>
					);
				})}
			</div>
		</div>
	);
};
