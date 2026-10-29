import type {EventSpec, Spec} from '../schema';
import {parseISO} from './format';

export type EventTiming = {
	event: EventSpec;
	index: number; // data index of the event
	frame: number; // frame the line reaches the event
	holdEnd: number; // frame the line starts moving again
};

export type Timeline = {
	durationInFrames: number;
	drawStart: number;
	drawEnd: number;
	resultFrame: number;
	questionFrame: number;
	/** frame from which the live counter/value tag start fading so the result card owns the final value */
	hideFrame: number;
	/** progress[f] = fractional data index drawn at frame f (0..N-1) */
	progress: number[];
	events: EventTiming[];
	/** y-axis max per frame (linear scale) */
	domainMax: number[];
	domainMin: number[];
};

const nearestIndex = (times: number[], t: number) => {
	let lo = 0;
	let hi = times.length - 1;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (times[mid] < t) lo = mid + 1;
		else hi = mid;
	}
	if (lo > 0 && Math.abs(times[lo - 1] - t) < Math.abs(times[lo] - t)) return lo - 1;
	return lo;
};

/** Linear interpolation of a series at a fractional index. */
export const valueAt = (arr: number[], p: number) => {
	const i = Math.max(0, Math.min(arr.length - 1, Math.floor(p)));
	const j = Math.min(arr.length - 1, i + 1);
	const f = p - i;
	return arr[i] + (arr[j] - arr[i]) * f;
};

const DAY = 86400000;

/** Index of the series date nearest to an ISO date. */
export const dateIndex = (dates: string[], iso: string) => nearestIndex(dates.map(parseISO), parseISO(iso));

export const buildTimeline = (spec: Spec, fps: number): Timeline => {
	const durationInFrames = Math.round(spec.durationSec * fps);
	const dates = spec.series[0].dates;
	const n = dates.length;
	const times = dates.map(parseISO);

	const resultFrame = Math.round((spec.timing.resultSec ?? spec.durationSec - 7) * fps);
	const questionFrame = Math.round((spec.timing.questionSec ?? spec.durationSec - 3.4) * fps);
	const drawStart = Math.round(spec.timing.drawStartSec * fps);
	const drawEnd = resultFrame - Math.round(spec.timing.landBeatSec * fps); // beat between landing and the result
	const hideFrame = spec.timing.hideBeforeRevealSec > 0 ? drawEnd - Math.round(spec.timing.hideBeforeRevealSec * fps) : durationInFrames + 1000; // never (finite: interpolate needs finite ranges)
	const paces = spec.pace.map((pc) => ({a: parseISO(pc.from), b: parseISO(pc.to), speed: pc.speed}));

	// --- segment weights: calendar time, slowed around events, eased at the end
	const span = times[n - 1] - times[0];
	const evIdx = spec.events.map((e) => nearestIndex(times, parseISO(e.date)));
	const weights: number[] = [];
	for (let i = 0; i < n - 1; i++) {
		const mid = (times[i] + times[i + 1]) / 2;
		let w = Math.max(1, (times[i + 1] - times[i]) / DAY);
		for (const pc of paces) if (mid >= pc.a && mid <= pc.b) w /= pc.speed;
		spec.events.forEach((e, k) => {
			const d = Math.abs(mid - times[evIdx[k]]) / DAY;
			if (d < e.windowDays) {
				const fall = 0.5 * (1 + Math.cos((Math.PI * d) / e.windowDays));
				w *= 1 + (e.slowdown - 1) * fall;
			}
		});
		const u = (mid - times[0]) / span;
		if (u > 0.96) w *= 1 + 1.4 * ((u - 0.96) / 0.04); // decelerate into the final value
		weights.push(w);
	}

	// --- holds
	let holds = spec.events.map((e) => Math.round(e.holdSec * fps));
	const drawFrames = drawEnd - drawStart;
	const holdTotal = holds.reduce((a, b) => a + b, 0);
	if (holdTotal > drawFrames * 0.3) {
		const s = (drawFrames * 0.3) / holdTotal;
		holds = holds.map((h) => Math.round(h * s));
	}
	const moving = drawFrames - holds.reduce((a, b) => a + b, 0);
	const W = weights.reduce((a, b) => a + b, 0);
	const k = moving / W;

	// --- piecewise nodes (frame, index)
	const nodeF: number[] = [drawStart];
	const nodeI: number[] = [0];
	const holdAt = new Map<number, number>();
	evIdx.forEach((idx, e) => holdAt.set(idx, (holdAt.get(idx) ?? 0) + holds[e]));
	let f = drawStart;
	if (holdAt.has(0)) {
		f += holdAt.get(0)!;
		nodeF.push(f);
		nodeI.push(0);
	}
	for (let i = 0; i < n - 1; i++) {
		f += weights[i] * k;
		nodeF.push(f);
		nodeI.push(i + 1);
		const h = holdAt.get(i + 1);
		if (h && i + 1 < n - 1) {
			f += h;
			nodeF.push(f);
			nodeI.push(i + 1);
		}
	}

	const progress: number[] = new Array(durationInFrames);
	let c = 0;
	for (let fr = 0; fr < durationInFrames; fr++) {
		if (fr <= drawStart) progress[fr] = 0;
		else if (fr >= drawEnd) progress[fr] = n - 1;
		else {
			while (c < nodeF.length - 2 && nodeF[c + 1] < fr) c++;
			const f0 = nodeF[c];
			const f1 = nodeF[c + 1];
			const t = f1 > f0 ? (fr - f0) / (f1 - f0) : 1;
			progress[fr] = Math.min(n - 1, nodeI[c] + (nodeI[c + 1] - nodeI[c]) * Math.max(0, Math.min(1, t)));
		}
	}

	const events: EventTiming[] = spec.events.map((event, e) => {
		const idx = evIdx[e];
		let frame = drawEnd;
		for (let fr = drawStart; fr < durationInFrames; fr++) {
			if (progress[fr] >= idx) {
				frame = fr;
				break;
			}
		}
		return {event, index: idx, frame, holdEnd: frame + holds[e]};
	});

	// --- y domain
	const domainMax: number[] = new Array(durationInFrames);
	const domainMin: number[] = new Array(durationInFrames);
	const allVals = spec.series.flatMap((s) => [...s.values, ...s.contributed]);
	const globalMax = Math.max(...allVals);
	const globalMin = Math.min(...allVals.filter((v) => v > 0));
	const prefixMax = (arr: number[]) => {
		const out: number[] = [];
		let m = -Infinity;
		for (const v of arr) out.push((m = Math.max(m, v)));
		return out;
	};
	const pm = spec.series.map((s) => ({v: prefixMax(s.values), c: prefixMax(s.contributed)}));
	const floor = Math.max(...spec.series.map((s) => s.contributed[s.contributed.length - 1])) * 0.25;
	let cur = 0;
	for (let fr = 0; fr < durationInFrames; fr++) {
		if (spec.yScale === 'log') {
			domainMax[fr] = globalMax * 1.25;
			domainMin[fr] = globalMin * 0.8;
			continue;
		}
		domainMin[fr] = 0;
		if (!spec.dynamicY) {
			domainMax[fr] = globalMax * 1.12;
			continue;
		}
		const p = progress[fr];
		let target = floor;
		spec.series.forEach((s, si) => {
			const i = Math.floor(p);
			target = Math.max(target, pm[si].v[i], pm[si].c[i], valueAt(s.values, p), valueAt(s.contributed, p));
		});
		// Leave headroom; keep the starting value around the lower-middle of the chart.
		target = Math.max(target * 1.15, spec.series[0].values[0] * 1.6);
		cur = fr === 0 ? target : cur + (target - cur) * (target > cur ? 0.2 : 0.06);
		domainMax[fr] = cur;
	}

	return {durationInFrames, drawStart, drawEnd, resultFrame, questionFrame, hideFrame, progress, events, domainMax, domainMin};
};
