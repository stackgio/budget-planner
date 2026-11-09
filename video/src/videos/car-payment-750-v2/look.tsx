import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Narration} from '../../story/lib/narration';
import {E, kf, prog, sp} from '../../story/lib/motion';
import {cinematic, editorial, story, type Palette} from '../../story/theme';

/** Stack With Gio brand palette for this video (from the creator's brief). */
export const C = {
	black: '#101010',
	char: '#16171A',
	white: '#FFFFFF',
	green: '#39FF88',
	greenDeep: '#14B85A',
	gray: '#A7ADB4',
	red: '#FFFFFF', // v2: no red — expenses read in white
	redDeep: '#101010',
	paper: '#F3F2EE',
	ink: '#101010',
	warm: '#F5F5F3',
};
export const FONT = story.font;

/** Palettes handed to NarratedVideo (base background per scene). */
export const DARK: Palette = {...cinematic, bg: C.black, bg2: C.char, ink: C.white, muted: C.gray, accent: C.green, danger: C.red};
export const LIGHT: Palette = {...editorial, bg: C.paper, bg2: '#E6E5E0', ink: C.ink, muted: '#6B7078', accent: C.greenDeep, danger: C.redDeep};
export const WARM: Palette = {...editorial, bg: C.warm, bg2: '#E8E8E5', ink: C.ink, muted: '#6B7078', accent: C.greenDeep, danger: C.ink};

/** Letter-spaced uppercase label. */
export const Label: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({children, color = C.gray, size = 28, style}) => (
	<div style={{fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: size * 0.16, textTransform: 'uppercase', color, ...style}}>{children}</div>
);

/** Small "EXAMPLE" chip for hypothetical numbers. */
export const ExampleTag: React.FC<{dark?: boolean; text?: string; style?: React.CSSProperties; opacity?: number}> = ({dark = true, text = 'Example', style, opacity = 1}) => (
	<div
		style={{
			display: 'inline-block',
			fontFamily: FONT,
			fontWeight: 700,
			fontSize: 24,
			letterSpacing: 4,
			textTransform: 'uppercase',
			padding: '8px 16px',
			borderRadius: 999,
			border: `2px solid ${dark ? 'rgba(167,173,180,0.5)' : 'rgba(16,16,16,0.25)'}`,
			color: dark ? C.gray : '#5A5F66',
			opacity,
			...style,
		}}
	>
		{text}
	</div>
);

/** Dark automotive studio: overhead softbox, falloff, polished floor. */
export const StudioBg: React.FC<{floorY?: number; light?: number; tint?: string; box?: number}> = ({floorY = 1180, light = 1, tint = '255,255,255', box = 1}) => (
	<div style={{position: 'absolute', inset: 0, background: C.black, overflow: 'hidden'}}>
		<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 40% at 50% ${floorY - 260}px, rgba(${tint},${0.13 * light}) 0%, rgba(${tint},0) 70%)`}} />
		{/* softbox strip */}
		<div style={{position: 'absolute', left: 140, right: 140, top: 250, height: 14, borderRadius: 10, background: `rgba(${tint},${0.55 * box * light})`, filter: 'blur(4px)'}} />
		<div style={{position: 'absolute', left: 60, right: 60, top: 160, height: 220, background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(${tint},${0.1 * box * light}) 0%, rgba(${tint},0) 70%)`}} />
		{/* floor */}
		<div style={{position: 'absolute', left: 0, right: 0, top: floorY - 40, bottom: 0, background: `linear-gradient(180deg, rgba(${tint},${0.05 * light}) 0%, rgba(0,0,0,0) 30%, #070707 100%)`}} />
		<div style={{position: 'absolute', left: 0, right: 0, top: floorY - 1, height: 2, background: `linear-gradient(90deg, transparent, rgba(${tint},${0.12 * light}), transparent)`}} />
		<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)'}} />
	</div>
);

/** Subtle precision grid for the financial-interface scenes. */
export const GridBg: React.FC<{color?: string; line?: string; drift?: number}> = ({color = C.black, line = 'rgba(255,255,255,0.045)', drift = 0}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			background: color,
			backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
			backgroundSize: '90px 90px',
			backgroundPosition: `0 ${drift}px`,
		}}
	>
		<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)'}} />
	</div>
);

// ───────────────────────── captions (restrained, secondary) ─────────────────────────

const UNITS: Record<string, number> = {zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19};
const TENS: Record<string, number> = {twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90};
const bare = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
const isNum = (s: string) => bare(s) in UNITS || bare(s) in TENS || bare(s) === 'hundred' || bare(s) === 'thousand';

type W = {text: string; start: number; end: number};
/** "seven hundred and fifty dollars" → "$750" (keeps timing of the whole run). */
export const collapseNumbers = (words: W[]): W[] => {
	const out: W[] = [];
	for (let i = 0; i < words.length; i++) {
		if (!isNum(words[i].text) || bare(words[i].text) === 'hundred' || bare(words[i].text) === 'thousand') {
			out.push(words[i]);
			continue;
		}
		let j = i;
		let total = 0;
		let cur = 0;
		while (j < words.length) {
			const b = bare(words[j].text);
			if (b in UNITS) cur += UNITS[b];
			else if (b in TENS) cur += TENS[b];
			else if (b === 'hundred') cur *= 100;
			else if (b === 'thousand') {
				total += cur * 1000;
				cur = 0;
			} else if (b === 'and' && j + 1 < words.length && isNum(words[j + 1].text) && j > i) {
				// part of the number
			} else break;
			if (/[.,?!]$/.test(words[j].text)) {
				j++;
				break;
			}
			j++;
		}
		const value = total + cur;
		let end = words[j - 1].end;
		let text = value.toLocaleString('en-US');
		let trail = (words[j - 1].text.match(/[.,?!]+$/) ?? [''])[0];
		if (j < words.length && bare(words[j].text) === 'dollars') {
			text = `$${text}`;
			end = words[j].end;
			trail = (words[j].text.match(/[.,?!]+$/) ?? [''])[0];
			j++;
		}
		out.push({text: text + trail, start: words[i].start, end});
		i = j - 1;
	}
	return out;
};

type Page = {words: W[]; start: number; end: number};
const paginate = (n: Narration, maxChars = 30): Page[] => {
	const pages: Page[] = [];
	for (const line of n.lines) {
		let cur: Page | null = null;
		for (const w of collapseNumbers(line.words)) {
			const len = cur ? cur.words.map((x) => x.text).join(' ').length + 1 + w.text.length : 0;
			const prevEnds = cur && /[.,?!]$/.test(cur.words[cur.words.length - 1].text) && cur.words.length >= 2;
			if (!cur || len > maxChars || prevEnds) {
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

export const SoftCaptions: React.FC<{narration: Narration}> = ({narration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const pages = React.useMemo(() => paginate(narration), [narration]);
	const idx = pages.findIndex((p, i) => t >= p.start - 0.06 && t < Math.min((pages[i + 1]?.start ?? 999) - 0.06, p.end + 0.5));
	if (idx < 0) return null;
	const page = pages[idx];
	const local = frame - Math.round((page.start - 0.06) * fps);
	const pIn = kf(local, [0, 4], [0, 1], E.out);
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 1452, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
			<div
				style={{
					maxWidth: 860,
					padding: '12px 26px 14px',
					borderRadius: 18,
					background: 'rgba(12,12,12,0.62)',
					backdropFilter: 'blur(6px)',
					fontFamily: FONT,
					fontSize: 42,
					fontWeight: 700,
					letterSpacing: -0.4,
					lineHeight: 1.18,
					textAlign: 'center',
					color: 'rgba(255,255,255,0.94)',
					opacity: pIn,
					transform: `translateY(${(1 - pIn) * 8}px)`,
				}}
			>
				{page.words.map((w, i) => {
					const said = t >= w.start - 0.04;
					return (
						<span key={i} style={{color: said ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.5)'}}>
							{w.text}
							{i < page.words.length - 1 ? ' ' : ''}
						</span>
					);
				})}
			</div>
		</div>
	);
};

/** Small brand watermark (inside the safe area, top-left). */
export const Watermark: React.FC<{onLight: boolean}> = ({onLight}) => (
	<div
		style={{
			position: 'absolute',
			left: story.safe.left,
			top: 182,
			fontFamily: FONT,
			fontWeight: 800,
			fontSize: 24,
			letterSpacing: 5,
			color: onLight ? 'rgba(16,16,16,0.42)' : 'rgba(255,255,255,0.5)',
			display: 'flex',
			alignItems: 'center',
			gap: 12,
		}}
	>
		<span style={{width: 10, height: 10, borderRadius: 2, background: onLight ? C.greenDeep : C.green, opacity: 0.85}} />
		STACK WITH GIO
	</div>
);

/** Reveal helper: spring-in with a short rise and blur clear. */
export const useRise = (at: number, cfg: 'snappy' | 'heavy' | 'smooth' | 'bouncy' = 'snappy', dist = 40) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, cfg);
	const o = prog(frame, at, 6);
	return {opacity: frame < at ? 0 : o, transform: `translateY(${(1 - p) * dist}px)`};
};
