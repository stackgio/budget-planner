import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Narration} from '../lib/narration';
import {E, kf} from '../lib/motion';
import {story, type Palette} from '../theme';

type W = {text: string; start: number; end: number};
type Page = {words: W[]; start: number; end: number};

export type CaptionOptions = {
	/**
	 * 'chunk' (default): short pages, broken at every punctuation mark (≤ maxWords).
	 * 'phrase': whole phrases on one or two lines — short fragments ("First, VOO.")
	 *           are grouped with the neighbouring words when the pause between them
	 *           is short, and long sentences are split into balanced pages.
	 */
	mode?: 'chunk' | 'phrase';
	/** max characters per page (phrase mode: two lines' worth) */
	maxChars?: number;
	maxWords?: number;
	/** phrase mode: a pause longer than this (sec) always starts a new page */
	maxGap?: number;
	/** phrase mode: pages shorter than this (chars) merge with a neighbour */
	minChars?: number;
	/** opacity of words not yet spoken (0..1) */
	upcomingOpacity?: number;
	/** keep punctuation exactly as written (verbatim captions) */
	keepPunctuation?: boolean;
	fontSize?: number;
	/** caption band side margins (keep clear of right-side platform buttons) */
	left?: number;
	right?: number;
	uppercase?: boolean;
	/** dark halo behind the words for legibility over busy scenes */
	shadow?: boolean;
};

/** sentence end — but not abbreviations like "U.S." */
const endsSentence = (t: string) => /[.?!]['"’”]?$/.test(t) && !/^([A-Za-z]\.){2,}[,]?$/.test(t);
const len = (ws: W[]) => ws.map((w) => w.text).join(' ').length;
const page = (ws: W[]): Page => ({words: ws, start: ws[0].start, end: ws[ws.length - 1].end});

const paginateChunk = (n: Narration, maxChars: number, maxWords: number): Page[] => {
	const pages: Page[] = [];
	for (const line of n.lines) {
		let cur: Page | null = null;
		for (const w of line.words) {
			const l = cur ? len(cur.words) + 1 + w.text.length : w.text.length;
			const breakHere = cur && (l > maxChars || cur.words.length >= maxWords || /[.,:?!]$/.test(cur.words[cur.words.length - 1].text));
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

/** Split one phrase into the fewest pages that fit, balancing lengths and preferring breaks after commas. */
const splitBalanced = (ws: W[], maxChars: number, maxWords: number): W[][] => {
	if (len(ws) <= maxChars && ws.length <= maxWords) return [ws];
	const k = Math.max(Math.ceil(len(ws) / maxChars), Math.ceil(ws.length / maxWords));
	const target = len(ws) / k;
	let best = -1;
	let bestScore = Infinity;
	for (let i = 1; i < ws.length; i++) {
		const a = ws.slice(0, i);
		if (len(a) > maxChars || a.length > maxWords) break;
		const score = Math.abs(len(a) - target) - (/,$/.test(ws[i - 1].text) ? 8 : 0) + (i === 1 || i === ws.length - 1 ? 12 : 0);
		if (score < bestScore) {
			bestScore = score;
			best = i;
		}
	}
	if (best < 0) best = 1;
	return [ws.slice(0, best), ...splitBalanced(ws.slice(best), maxChars, maxWords)];
};

export const paginatePhrase = (n: Narration, o: Required<Pick<CaptionOptions, 'maxChars' | 'maxWords' | 'maxGap' | 'minChars'>>): Page[] => {
	const all = n.lines.flatMap((l) => l.words);
	// 1) phrases end at sentence punctuation or at a long pause
	const phrases: W[][] = [];
	let cur: W[] = [];
	all.forEach((w, i) => {
		cur.push(w);
		const next = all[i + 1];
		if (!next || endsSentence(w.text) || next.start - w.end > o.maxGap) {
			phrases.push(cur);
			cur = [];
		}
	});
	// 2) group short fragments with the following (or preceding) phrase when the pause allows
	const merged: W[][] = [];
	for (let i = 0; i < phrases.length; i++) {
		let p = phrases[i];
		while (i + 1 < phrases.length && len(p) < o.minChars) {
			const nx = phrases[i + 1];
			if (nx[0].start - p[p.length - 1].end > o.maxGap || len(p) + 1 + len(nx) > o.maxChars * 1.6) break;
			p = [...p, ...nx];
			i++;
		}
		const prev = merged[merged.length - 1];
		if (len(p) < o.minChars && prev && p[0].start - prev[prev.length - 1].end <= o.maxGap && len(prev) + 1 + len(p) <= o.maxChars) {
			merged[merged.length - 1] = [...prev, ...p];
		} else merged.push(p);
	}
	// 3) long phrases → balanced pages
	return merged.flatMap((p) => splitBalanced(p, o.maxChars, o.maxWords)).map(page);
};

/**
 * Word-synced captions in the reserved band above the platform UI.
 * The spoken word is highlighted in brand green. `paletteAt(frame)` lets the
 * caption colour follow editorial / cinematic scenes.
 */
export const Captions: React.FC<{narration: Narration; paletteAt: (frame: number) => Palette; options?: CaptionOptions}> = ({narration, paletteAt, options = {}}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const mode = options.mode ?? 'chunk';
	const pages = React.useMemo(
		() =>
			mode === 'phrase'
				? paginatePhrase(narration, {maxChars: options.maxChars ?? 30, maxWords: options.maxWords ?? 7, maxGap: options.maxGap ?? 0.6, minChars: options.minChars ?? 14})
				: paginateChunk(narration, options.maxChars ?? 20, options.maxWords ?? 4),
		[narration, mode, options.maxChars, options.maxWords, options.maxGap, options.minChars],
	);
	const idx = pages.findIndex((p, i) => t >= p.start - 0.05 && t < (pages[i + 1]?.start ?? p.end + 0.6) - 0.05);
	if (idx < 0) return null;
	const pg = pages[idx];
	const pal = paletteAt(frame);
	const local = frame - Math.round((pg.start - 0.05) * fps);
	const pIn = kf(local, [0, 5], [0, 1], E.out);
	const fade = kf(t, [pg.end + 0.35, pg.end + 0.55], [1, 0]);
	const up = options.upcomingOpacity ?? 0.45;
	const dark = pal.name === 'cinematic';
	const upcoming = dark ? `rgba(245,242,234,${up})` : `rgba(18,19,22,${up * 0.78})`;
	return (
		<div
			style={{
				position: 'absolute',
				left: options.left ?? story.safe.left,
				right: options.right ?? story.safe.right - 48,
				top: story.captionTop,
				...(mode === 'phrase'
					? // balanced lines: no one-word orphan on the second line
						{display: 'block', textAlign: 'center', textWrap: 'balance', wordSpacing: (options.fontSize ?? 58) * 0.24}
					: {display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: options.fontSize ? options.fontSize * 0.36 : 24}),
				fontFamily: story.font,
				fontSize: options.fontSize ?? 58,
				fontWeight: 900,
				letterSpacing: -1,
				textTransform: options.uppercase === false ? undefined : 'uppercase',
				lineHeight: mode === 'phrase' ? 1.12 : 1.1,
				textShadow: options.shadow ? (dark ? '0 3px 14px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.9)' : '0 2px 10px rgba(255,255,255,0.9)') : undefined,
				transform: `translateY(${(1 - pIn) * 14}px)`,
				opacity: pIn * fade,
			} as React.CSSProperties}
		>
			{pg.words.map((w, i) => {
				const active = t >= w.start - 0.03;
				const speaking = t >= w.start - 0.03 && t < w.end + 0.08;
				return (
					<React.Fragment key={i}>
						{i > 0 && mode === 'phrase' ? ' ' : null}
						<span
							style={{
								color: speaking ? pal.accent : active ? pal.ink : upcoming,
								transform: `scale(${speaking ? 1.06 : 1})`,
								display: 'inline-block',
								transformOrigin: '50% 60%',
							}}
						>
							{options.keepPunctuation ? w.text : w.text.replace(/[.,]$/, '')}
						</span>
					</React.Fragment>
				);
			})}
		</div>
	);
};
