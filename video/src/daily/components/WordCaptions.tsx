import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {E, kf, sp} from '../../story/lib/motion';
import {dmm} from '../theme';

export type TimedWord = {text: string; start: number; end: number}; // seconds (audio clock)
export type CaptionPage = {from: number; to: number; words: {text: string; at: number; key?: boolean}[]}; // frames

/**
 * Group narration words (timestamps from the TTS/STT alignment) into caption
 * pages that break after the given word indices. `offset` = frame where the
 * audio starts. Words whose index is in `keyIdx` are highlighted in accent.
 */
export const buildPages = (words: TimedWord[], fps: number, offset: number, breakAfter: number[], keyIdx: number[] = []): CaptionPage[] => {
	const pages: CaptionPage[] = [];
	let cur: CaptionPage | null = null;
	words.forEach((w, i) => {
		const at = Math.round(w.start * fps) + offset;
		if (!cur) cur = {from: at, to: at, words: []};
		cur.words.push({text: w.text, at, key: keyIdx.includes(i)});
		cur.to = Math.round(w.end * fps) + offset;
		if (i === words.length - 1 || breakAfter.includes(i)) {
			pages.push(cur);
			cur = null;
		}
	});
	// each page stays until the next one starts (no empty gaps)
	for (let i = 0; i < pages.length - 1; i++) pages[i].to = pages[i + 1].from;
	return pages;
};

/**
 * Word-synced kinetic captions: one page at a time, upcoming words dimmed,
 * each word lifts and brightens on its own timestamp, key words turn accent.
 * The first page is fully readable on frame 0 when `hookOnFrame0`.
 */
export const WordCaptions: React.FC<{pages: CaptionPage[]; y: number; size?: number; hookOnFrame0?: boolean; lastHold?: number}> = ({pages, y, size = 78, hookOnFrame0 = true, lastHold = 20}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const idx = pages.findIndex((p, i) => frame >= (i === 0 ? -1e9 : p.from) && (i === pages.length - 1 ? frame < p.to + lastHold : frame < p.to));
	if (idx < 0) return null;
	const p = pages[idx];
	const enter = idx === 0 && hookOnFrame0 ? 1 : sp(frame, fps, p.from - 2, 'snappy');
	const exitAt = idx === pages.length - 1 ? p.to + lastHold - 8 : p.to - 4;
	const exit = kf(frame, [exitAt, exitAt + 6], [0, 1], E.in);
	return (
		<div
			style={{
				position: 'absolute',
				left: dmm.safe.left,
				width: dmm.width - dmm.safe.left - dmm.safe.right,
				top: y,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				columnGap: size * 0.26,
				rowGap: 4,
				fontFamily: dmm.font,
				fontSize: size,
				fontWeight: 900,
				lineHeight: 1.06,
				letterSpacing: -size * 0.025,
				textTransform: 'uppercase',
				opacity: 1 - exit,
				transform: `translateY(${(1 - enter) * 26 - exit * 18}px)`,
			}}
		>
			{p.words.map((w, i) => {
				const said = idx === 0 && hookOnFrame0 && frame < 2 ? 1 : sp(frame, fps, w.at - 1, 'snappy');
				const spoken = frame >= w.at - 1 || (idx === 0 && hookOnFrame0 && i === 0);
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							color: spoken && w.key ? dmm.color.accent : dmm.color.ink,
							opacity: idx === 0 && hookOnFrame0 && frame < w.at ? 1 : 0.38 + 0.62 * said,
							transform: `translateY(${(1 - said) * 6}px)`,
						}}
					>
						{w.text}
					</span>
				);
			})}
		</div>
	);
};
