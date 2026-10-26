import React from 'react';
import {measureText} from '@remotion/layout-utils';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/theme';
import {clamp, ease, springAt, springs} from '../lib/motion';

export type KineticWord = {
	text: string;
	/** Frame this word lands. Use cues.word(...) to sync it to the voice. */
	at: number;
	color?: string;
	/** Line break after this word. */
	br?: boolean;
};

type Props = {
	words: KineticWord[];
	style?: 'rise' | 'pop' | 'slam';
	fontSize?: number;
	align?: 'left' | 'center';
	/** Frame the whole block exits (fades up and out). */
	exitAt?: number;
	maxWidth?: number;
	weight?: number;
	/** Shrink the type (never grow) so no word is wider than maxWidth and the text fits in maxLines. */
	maxLines?: number;
};

const LETTER_SPACING = '-0.025em';

// Largest size <= wanted where the widest word fits and the whole text fits in maxLines.
const fitSize = (words: KineticWord[], wanted: number, maxWidth: number, weight: number, maxLines: number) => {
	const probe = 100;
	const widths = words.map((w) => measureText({text: w.text, fontFamily: fonts.display, fontSize: probe, fontWeight: weight, letterSpacing: LETTER_SPACING}).width);
	const widest = Math.max(...widths);
	const total = widths.reduce((a, b) => a + b, 0) + probe * 0.24 * (words.length - 1);
	const byWord = (probe * maxWidth * 0.96) / widest;
	const byLines = (probe * maxWidth * maxLines * 0.85) / total;
	return Math.floor(Math.min(wanted, byWord, byLines));
};

/**
 * Word-by-word typography. Each word enters on its own frame, so lines can be
 * timed to the narration instead of revealing on a fixed stagger.
 */
export const KineticText: React.FC<Props> = ({
	words,
	style = 'rise',
	fontSize = 96,
	align = 'center',
	exitAt,
	maxWidth = 720,
	weight = 800,
	maxLines = 3,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const size = fitSize(words, fontSize, maxWidth, weight, maxLines);
	const exit = exitAt === undefined ? 0 : interpolate(frame, [exitAt, exitAt + 8], [0, 1], {...clamp, easing: ease.in});

	const lines: KineticWord[][] = [[]];
	for (const w of words) {
		lines[lines.length - 1].push(w);
		if (w.br) lines.push([]);
	}

	return (
		<div
			style={{
				maxWidth,
				fontFamily: fonts.display,
				fontWeight: weight,
				fontSize: size,
				lineHeight: 1.05,
				letterSpacing: LETTER_SPACING,
				color: colors.white,
				textAlign: align,
				opacity: 1 - exit,
				translate: `0px ${-exit * 40}px`,
			}}
		>
			{lines.map((line, li) => (
				<div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.24}}>
					{line.map((w, wi) => {
						const s = springAt(frame, fps, w.at, style === 'rise' ? springs.soft : springs.pop, style === 'rise' ? 14 : undefined);
						const visible = frame >= w.at;
						const motion: React.CSSProperties =
							style === 'rise'
								? {translate: `0px ${(1 - s) * size * 0.5}px`, filter: `blur(${(1 - s) * 10}px)`}
								: style === 'pop'
									? {scale: interpolate(s, [0, 1], [0.4, 1])}
									: {scale: interpolate(s, [0, 1], [1.8, 1]), filter: `blur(${(1 - Math.min(s, 1)) * 6}px)`};
						return (
							<span key={wi} style={{display: 'inline-block', opacity: visible ? Math.min(1, s * 1.6) : 0, color: w.color, ...motion}}>
								{w.text}
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};
