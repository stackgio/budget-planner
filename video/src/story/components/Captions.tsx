import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Narration} from '../lib/narration';
import {E, kf} from '../lib/motion';
import {story, type Palette} from '../theme';

type Page = {words: {text: string; start: number; end: number}[]; start: number; end: number};

export type CaptionVariant = 'kinetic' | 'phrase';

const paginate = (n: Narration, maxChars = 20, maxWords = 4): Page[] => {
	const pages: Page[] = [];
	for (const line of n.lines) {
		let cur: Page | null = null;
		for (const w of line.words) {
			const len = cur ? cur.words.map((x) => x.text).join(' ').length + 1 + w.text.length : w.text.length;
			const breakHere = cur && (len > maxChars || cur.words.length >= maxWords || /[.,:?!]$/.test(cur.words[cur.words.length - 1].text));
			if (!cur || breakHere) {
				if (cur) pages.push(cur);
				cur = {words: [], start: w.start, end: w.end};
			}
			cur.words.push(w);
			cur.end = w.end;
		}
		if (cur) pages.push(cur);
	}
	return pages;
};

/**
 * Word-synced captions in the reserved band above the platform UI.
 * The spoken word is highlighted in brand green. `paletteAt(frame)` lets the
 * caption colour follow editorial / cinematic scenes.
 */
export const Captions: React.FC<{narration: Narration; paletteAt: (frame: number) => Palette; variant?: CaptionVariant}> = ({narration, paletteAt, variant = 'kinetic'}) => {
	if (variant === 'phrase') return <PhraseCaptions narration={narration} paletteAt={paletteAt} />;
	return <KineticCaptions narration={narration} paletteAt={paletteAt} />;
};

const BREAK_BEFORE = new Set(['when', 'so', 'for', 'with', 'before', 'until', 'till', 'then', "that's", 'and', 'if', 'because', 'but', 'or']);
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const chars = (ws: Page['words']) => ws.map((w) => w.text).join(' ').length;

/** Split a too-long clause where it reads best: balanced halves, preferring a break before a conjunction. */
const splitClause = (ws: Page['words'], max: number): Page['words'][] => {
	if (chars(ws) <= max || ws.length < 4) return [ws];
	let best = -1;
	let bestScore = Infinity;
	for (let k = 2; k <= ws.length - 2; k++) {
		const a = chars(ws.slice(0, k));
		const b = chars(ws.slice(k));
		const fits = a <= max && b <= max ? 0 : 1000;
		const score = Math.abs(a - b) - (BREAK_BEFORE.has(clean(ws[k].text)) ? 30 : 0) + fits;
		if (score < bestScore) [best, bestScore] = [k, score];
	}
	return [...splitClause(ws.slice(0, best), max), ...splitClause(ws.slice(best), max)];
};

/**
 * Pages = complete thoughts: clauses (split at punctuation) merged while they fit
 * two lines; long clauses split at a natural break; short fragments ("again,",
 * "with.", "account.") are never left alone — they merge into a neighbour.
 */
export const paginateThoughts = (n: Narration, max = 50, hardMax = 60, tiny = 14): Page[] => {
	const pages: Page[] = [];
	for (const line of n.lines) {
		const clauses: Page['words'][] = [];
		let cur: Page['words'] = [];
		for (const w of line.words) {
			cur.push(w);
			if (/[.,:;?!]$/.test(w.text)) [clauses.push(cur), (cur = [])];
		}
		if (cur.length) clauses.push(cur);
		const pieces = clauses.flatMap((c) => splitClause(c, max));
		const merged: Page['words'][] = [];
		for (const p of pieces) {
			const last = merged[merged.length - 1];
			const total = last ? chars([...last, ...p]) : Infinity;
			if (last && (total <= max || ((chars(last) < tiny || chars(p) < tiny) && total <= hardMax))) merged[merged.length - 1] = [...last, ...p];
			else merged.push(p);
		}
		for (const ws of merged) pages.push({words: ws, start: ws[0].start, end: ws[ws.length - 1].end});
	}
	return pages;
};

/**
 * Phrase captions: one complete thought per page (≤ 2 lines), pure white on a
 * dark plate for maximum contrast, shown from the first word of the thought to
 * the start of the next. Sentence case keeps them distinct from uppercase
 * on-screen headlines; no accent colour so green stays reserved for numbers
 * and checkmarks.
 */
const PhraseCaptions: React.FC<{narration: Narration; paletteAt: (frame: number) => Palette}> = ({narration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const pages = React.useMemo(() => paginateThoughts(narration), [narration]);
	const lead = 0.06;
	const idx = pages.findIndex((p, i) => t >= p.start - lead && t < Math.min(pages[i + 1]?.start ?? Infinity, p.end + 0.7) - lead);
	if (idx < 0) return null;
	const page = pages[idx];
	const local = frame - Math.round((page.start - lead) * fps);
	const pIn = kf(local, [0, 3], [0, 1], E.out);
	const next = pages[idx + 1];
	const fade = next && next.start - page.end < 0.7 ? 1 : kf(t, [page.end + 0.45, page.end + 0.62], [1, 0]);
	return (
		<div style={{position: 'absolute', left: story.safe.left, right: story.safe.left, top: story.captionTop, display: 'flex', justifyContent: 'center', opacity: pIn * fade}}>
			<div
				style={{
					maxWidth: 936,
					padding: '14px 28px 16px',
					borderRadius: 20,
					background: 'rgba(0,0,0,0.82)',
					boxShadow: '0 0 0 2px rgba(255,255,255,0.06)',
					fontFamily: story.font,
					fontSize: 54,
					fontWeight: 800,
					letterSpacing: -0.5,
					lineHeight: 1.16,
					textAlign: 'center',
					textWrap: 'balance',
					color: '#FFFFFF',
					transform: `translateY(${(1 - pIn) * 8}px)`,
				}}
			>
				{page.words.map((w) => w.text).join(' ').replace(/[.,]$/, '')}
			</div>
		</div>
	);
};

const KineticCaptions: React.FC<{narration: Narration; paletteAt: (frame: number) => Palette}> = ({narration, paletteAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const pages = React.useMemo(() => paginate(narration), [narration]);
	const idx = pages.findIndex((p, i) => t >= p.start - 0.05 && t < (pages[i + 1]?.start ?? p.end + 0.6) - 0.05);
	if (idx < 0) return null;
	const page = pages[idx];
	const pal = paletteAt(frame);
	const local = frame - Math.round((page.start - 0.05) * fps);
	const pIn = kf(local, [0, 5], [0, 1], E.out);
	const fade = kf(t, [page.end + 0.35, page.end + 0.55], [1, 0]);
	return (
		<div
			style={{
				position: 'absolute',
				left: story.safe.left,
				right: story.safe.right - 48,
				top: story.captionTop,
				display: 'flex',
				justifyContent: 'center',
				flexWrap: 'wrap',
				columnGap: 24,
				fontFamily: story.font,
				fontSize: 58,
				fontWeight: 900,
				letterSpacing: -1,
				textTransform: 'uppercase',
				lineHeight: 1.1,
				transform: `translateY(${(1 - pIn) * 14}px)`,
				opacity: pIn * fade,
			}}
		>
			{page.words.map((w, i) => {
				const active = t >= w.start - 0.03;
				const speaking = t >= w.start - 0.03 && t < w.end + 0.08;
				return (
					<span
						key={i}
						style={{
							color: speaking ? pal.accent : active ? pal.ink : pal.name === 'cinematic' ? 'rgba(245,242,234,0.45)' : 'rgba(18,19,22,0.35)',
							transform: `scale(${speaking ? 1.06 : 1})`,
							display: 'inline-block',
							transformOrigin: '50% 60%',
						}}
					>
						{w.text.replace(/[.,]$/, '')}
					</span>
				);
			})}
		</div>
	);
};
