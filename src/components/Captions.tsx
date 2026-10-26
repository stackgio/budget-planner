import React, {useMemo} from 'react';
import {createTikTokStyleCaptions, type Caption} from '@remotion/captions';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts, SAFE, SAFE_CENTER_WIDTH, type as typeScale, VIDEO} from '../brand/theme';
import {clamp, ease} from '../lib/motion';

type Props = {
	words: Caption[];
	/** Words (case-insensitive, punctuation ignored) to color in brand green. */
	emphasize?: string[];
	/** Max time span of one caption page. Lower = fewer words on screen. */
	pageMs?: number;
	/** Vertical center of the caption block (px). Defaults to just above the bottom UI. */
	y?: number;
	fontSize?: number;
	/** Hide captions during these frame ranges (e.g. when the visual says it). */
	hideDuring?: [number, number][];
};

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9$']/g, '');

/**
 * Voice-synced captions: pages of 1–4 words, the word being spoken lights up.
 * Timing comes straight from narration.json, so it follows the real audio.
 */
export const Captions: React.FC<Props> = ({
	words,
	emphasize = [],
	pageMs = 1100,
	y = VIDEO.height - SAFE.bottom - 90,
	fontSize = typeScale.caption,
	hideDuring = [],
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ms = (frame / fps) * 1000;
	// Pages never span a sentence end: page each sentence separately.
	const pages = useMemo(() => {
		const sentences: Caption[][] = [[]];
		for (const w of words) {
			sentences[sentences.length - 1].push(w);
			if (/[.!?]["')\]]*$/.test(w.text.trim())) sentences.push([]);
		}
		return sentences
			.filter((s) => s.length)
			.flatMap((s) => createTikTokStyleCaptions({captions: s, combineTokensWithinMilliseconds: pageMs}).pages);
	}, [words, pageMs]);
	const emph = useMemo(() => new Set(emphasize.map(clean)), [emphasize]);

	if (hideDuring.some(([a, b]) => frame >= a && frame < b)) return null;

	// The active page stays up until the next page starts (no flicker in pauses),
	// but not longer than 600ms after its last word.
	const index = pages.findIndex((p, i) => {
		const next = pages[i + 1];
		const lastWordEnd = p.tokens[p.tokens.length - 1]?.toMs ?? p.startMs;
		const end = Math.min(next ? next.startMs : Infinity, lastWordEnd + 600);
		return ms >= p.startMs && ms < end;
	});
	if (index === -1) return null;
	const page = pages[index];
	const pageFrame = ((ms - page.startMs) / 1000) * fps;
	const enter = interpolate(pageFrame, [0, 5], [0, 1], {...clamp, easing: ease.out});

	return (
		<div
			style={{
				position: 'absolute',
				left: (VIDEO.width - SAFE_CENTER_WIDTH) / 2,
				width: SAFE_CENTER_WIDTH,
				top: y,
				translate: `0px ${-50 + (1 - enter) * 18}%`,
				opacity: enter,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				columnGap: fontSize * 0.34,
				fontFamily: fonts.display,
				fontWeight: 800,
				fontSize,
				lineHeight: 1.12,
				textAlign: 'center',
			}}
		>
			{page.tokens.map((t) => {
				const active = ms >= t.fromMs && ms < t.toMs;
				const spoken = ms >= t.fromMs;
				const isEmph = emph.has(clean(t.text));
				const tokenFrame = ((ms - t.fromMs) / 1000) * fps;
				const pop = interpolate(tokenFrame, [0, 3, 7], [1, 1.08, 1], clamp);
				return (
					<span
						key={t.fromMs}
						style={{
							color: isEmph && spoken ? colors.green : colors.white,
							opacity: spoken ? 1 : 0.55,
							scale: active ? pop : 1,
							display: 'inline-block',
							WebkitTextStroke: `${fontSize * 0.1}px rgba(0,0,0,0.85)`,
							paintOrder: 'stroke fill',
							textShadow: '0 6px 24px rgba(0,0,0,0.7)',
						}}
					>
						{t.text.trim()}
					</span>
				);
			})}
		</div>
	);
};
