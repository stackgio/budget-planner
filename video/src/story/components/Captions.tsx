import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Narration} from '../lib/narration';
import {E, kf} from '../lib/motion';
import {norm} from '../lib/narration';
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
	/** optional selective emphasis: only these words (normalised) turn green; others stay ink while spoken */
	emphasis?: string[];
}> = ({narration, paletteAt, emphasis}) => {
	const emph = React.useMemo(() => (emphasis ? new Set(emphasis.map(norm)) : null), [emphasis]);
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
							color: emph ? (active ? (emph.has(norm(w.text)) ? pal.accent : pal.ink) : pal.name === 'cinematic' ? 'rgba(245,242,234,0.45)' : 'rgba(18,19,22,0.35)') : speaking ? pal.accent : active ? pal.ink : pal.name === 'cinematic' ? 'rgba(245,242,234,0.45)' : 'rgba(18,19,22,0.35)',
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
