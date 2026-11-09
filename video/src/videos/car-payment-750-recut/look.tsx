import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Narration} from '../../story/lib/narration';
import {E, kf} from '../../story/lib/motion';
import {cinematic, editorial, story, type Palette} from '../../story/theme';
import {collapseNumbers} from '../car-payment-750/look';

/** Recut palette: matte black, white, bright green only. */
export const K = {
	black: '#0F0F10',
	panel: '#18181A',
	white: '#FFFFFF',
	paper: '#F5F5F3',
	ink: '#0F0F10',
	green: '#39FF88',
	greenInk: '#0E9F4E', // the same green, darkened for legibility on white
	gray: '#9AA0A6',
};
export const FONT = story.font;
export const DARK: Palette = {...cinematic, bg: K.black, ink: K.white, accent: K.green};
export const WHITE: Palette = {...editorial, bg: K.paper, ink: K.ink, accent: K.greenInk};

/** Matte white studio: soft overhead light and a seamless floor. */
export const WhiteStudioBg: React.FC<{floorY?: number}> = ({floorY = 1200}) => (
	<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #FFFFFF 0%, #F2F2F0 55%, #E3E3E0 100%)', overflow: 'hidden'}}>
		<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 30% at 50% ${floorY}px, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0) 70%)`}} />
		<div style={{position: 'absolute', left: 0, right: 0, top: floorY - 1, height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)'}} />
	</div>
);

// ───────────── captions: big, high-contrast, one spoken phrase at a time ─────────────

type W = {text: string; start: number; end: number};
type Phrase = {words: W[]; start: number; end: number};

/** "seven hundred and fifty dollar car" → "$750 car" (handles singular "dollar" too). */
const collapse = (words: W[]): W[] =>
	collapseNumbers(words.map((w) => (/^dollar[.,?!]?$/i.test(w.text) ? {...w, text: w.text.replace(/dollar/i, 'dollars')} : w)));

/** Break at punctuation, or before the phrase gets longer than ~4 words / 22 chars. */
const phrases = (n: Narration): Phrase[] => {
	const out: Phrase[] = [];
	for (const line of n.lines) {
		let cur: Phrase | null = null;
		for (const w of collapse(line.words)) {
			const len = cur ? cur.words.map((x) => x.text).join(' ').length + 1 + w.text.length : 0;
			const prevStop = cur && /[.,?!]$/.test(cur.words[cur.words.length - 1].text);
			if (!cur || prevStop || len > 22 || cur.words.length >= 4) {
				if (cur) out.push(cur);
				cur = {words: [], start: w.start, end: w.end};
			}
			cur.words.push(w);
			cur.end = w.end;
		}
		if (cur) out.push(cur);
	}
	return out;
};

/**
 * Sits at y 1240–1380: above the TikTok/Reels caption + button area and left of
 * the right-hand action rail (max width 820, centred slightly left).
 */
export const PhraseCaptions: React.FC<{narration: Narration}> = ({narration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const list = React.useMemo(() => phrases(narration), [narration]);
	const i = list.findIndex((p, k) => t >= p.start - 0.05 && t < Math.min((list[k + 1]?.start ?? 999) - 0.05, p.end + 0.45));
	if (i < 0) return null;
	const p = list[i];
	const pIn = kf(frame - Math.round((p.start - 0.05) * fps), [0, 3], [0, 1], E.out);
	return (
		<div style={{position: 'absolute', left: 60, width: 860, top: 1262, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
			<div
				style={{
					padding: '14px 30px 18px',
					borderRadius: 20,
					background: 'rgba(15,15,16,0.92)',
					fontFamily: FONT,
					fontSize: 64,
					fontWeight: 900,
					letterSpacing: -0.5,
					lineHeight: 1.08,
					textAlign: 'center',
					color: K.white,
					opacity: pIn,
					transform: `scale(${0.96 + 0.04 * pIn})`,
				}}
			>
				{p.words.map((w, k) => {
					const isNum = /\$|\d/.test(w.text);
					return (
						<span key={k} style={{color: isNum ? K.green : K.white}}>
							{w.text}
							{k < p.words.length - 1 ? ' ' : ''}
						</span>
					);
				})}
			</div>
		</div>
	);
};
