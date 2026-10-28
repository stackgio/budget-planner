import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeIn, easeOut, pop, tw} from './anim';
import {C, FONT} from './theme';

export type Seg = {t: string; c?: string};
export type CaptionCue = {
	from: number;
	to: number;
	lines: Seg[][];
	/** top of the caption block */
	y?: number;
	size?: number;
	weight?: number;
	color?: string;
	style?: 'rise' | 'slam' | 'quiet';
	letterSpacing?: number;
};

/** "ANOTHER BILL?!" → segments; wrap words in *stars* to highlight with `hl`. */
export const cue = (text: string, hl: string = C.green): Seg[] =>
	text.split(/(\*[^*]+\*)/).filter(Boolean).map((t) => (t.startsWith('*') ? {t: t.slice(1, -1), c: hl} : {t}));

const Word: React.FC<{seg: Seg; i: number; local: number; style: CaptionCue['style']; base: string}> = ({seg, i, local, style, base}) => {
	const d = i * 2.2;
	if (style === 'slam') {
		const p = pop(local, d, 11, 220, 0.7);
		return (
			<span
				style={{
					display: 'inline-block',
					color: seg.c ?? base,
					transform: `scale(${1.9 - 0.9 * p})`,
					opacity: Math.min(1, p * 2),
					filter: `blur(${Math.max(0, (1 - p) * 8)}px)`,
				}}
			>
				{seg.t}
			</span>
		);
	}
	const t = tw(local, d, d + 9, 0, 1, easeOut);
	return (
		<span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em'}}>
			<span style={{display: 'inline-block', color: seg.c ?? base, transform: `translateY(${(1 - t) * 105}%)`}}>{seg.t}</span>
		</span>
	);
};

export const Captions: React.FC<{cues: CaptionCue[]}> = ({cues}) => {
	const frame = useCurrentFrame();
	return (
		<>
			{cues.map((c, k) => {
				if (frame < c.from || frame >= c.to) return null;
				const local = frame - c.from;
				const out = tw(frame, c.to - 6, c.to, 0, 1, easeIn);
				const size = c.size ?? 78;
				let wi = 0;
				return (
					<div
						key={k}
						style={{
							position: 'absolute',
							left: 70,
							right: 70,
							top: c.y ?? 300,
							textAlign: 'center',
							fontFamily: FONT,
							fontWeight: c.weight ?? 900,
							fontSize: size,
							lineHeight: 1.04,
							letterSpacing: c.letterSpacing ?? -1.5,
							color: c.color ?? C.white,
							opacity: 1 - out,
							transform: `translateY(${-out * 18}px)`,
							textShadow: '0 6px 30px rgba(0,0,0,0.65)',
						}}
					>
						{c.lines.map((line, li) => (
							<div key={li}>
								{line.flatMap((seg) =>
									seg.t
										.split(/(\s+)/)
										.filter((w) => w.length)
										.map((w) =>
											/^\s+$/.test(w) ? (
												<span key={`s${wi++}`}> </span>
											) : (
												<Word key={`w${wi}`} seg={{t: w, c: seg.c}} i={wi++} local={local} style={c.style} base={c.color ?? C.white} />
											),
										),
								)}
							</div>
						))}
					</div>
				);
			})}
		</>
	);
};
