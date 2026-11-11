import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Narration} from '../lib/narration';
import {E, kf} from '../lib/motion';
import {story, type Palette} from '../theme';

type Page = {words: {text: string; start: number; end: number}[]; start: number; end: number};

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
export const Captions: React.FC<{
	narration: Narration;
	paletteAt: (frame: number) => Palette;
	/** override the band position (e.g. to clear burned-in text in creator footage) */
	top?: number;
	fontSize?: number;
	/** dark backing for captions over live footage */
	backdrop?: boolean;
	/** excerpt window (narration seconds): pages starting outside it are never shown */
	fromSec?: number | null;
	toSec?: number | null;
}> = ({narration, paletteAt, top = story.captionTop, fontSize = 58, backdrop = false, fromSec = null, toSec = null}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const pages = React.useMemo(
		() => paginate(narration).filter((p) => (fromSec === null || p.start >= fromSec - 0.01) && (toSec === null || p.start < toSec)),
		[narration, fromSec, toSec],
	);
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
				top,
				display: 'flex',
				justifyContent: 'center',
				flexWrap: 'wrap',
				columnGap: 24,
				fontFamily: story.font,
				fontSize,
				fontWeight: 900,
				letterSpacing: -1,
				textTransform: 'uppercase',
				lineHeight: 1.1,
				transform: `translateY(${(1 - pIn) * 14}px)`,
				opacity: pIn * fade,
			}}
		>
			{backdrop && (
				<div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: fontSize * 0.4, background: 'rgba(11,12,14,0.9)', borderRadius: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.25)', padding: `${fontSize * 0.14}px ${fontSize * 0.36}px`}}>
					{renderWords()}
				</div>
			)}
			{!backdrop && renderWords()}
		</div>
	);
	function renderWords() {
		return page.words.map((w, i) => {
			const active = t >= w.start - 0.03;
			const speaking = t >= w.start - 0.03 && t < w.end + 0.08;
			return (
				<span
					key={i}
					style={{
						color: backdrop
							? speaking
								? '#2CD47A'
								: active
									? '#F5F2EA'
									: 'rgba(245,242,234,0.55)'
							: speaking
								? pal.accent
								: active
									? pal.ink
									: pal.name === 'cinematic'
										? 'rgba(245,242,234,0.45)'
										: 'rgba(18,19,22,0.35)',
						transform: `scale(${speaking ? 1.06 : 1})`,
						display: 'inline-block',
						transformOrigin: '50% 60%',
					}}
				>
					{w.text.replace(/[.,]$/, '')}
				</span>
			);
		});
	}
};
