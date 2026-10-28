import React from 'react';
import {useCurrentFrame} from 'remotion';
import {easeOut, tw} from './anim';
import {C, FONT} from './theme';
import {s} from './timing';

/**
 * Burned-in subtitles. Word-for-word narration in 3–6 word groups.
 * Start/end come from the measured pauses and RMS dips in the voiceover (see STORYBOARD.md).
 * Wrap a word in *stars* to highlight it in brand green.
 */
type Sub = {t: number; end: number; text: string};
const RAW: Sub[] = [
	{t: 0.0, end: 0.75, text: 'I *swear,*'},
	{t: 1.03, end: 1.84, text: 'the moment you start'},
	{t: 1.84, end: 2.6, text: '*paying off debt,*'},
	{t: 2.92, end: 4.17, text: '*EVERYTHING* decides to break.'},
	{t: 4.69, end: 5.8, text: 'Your *tire* goes bad.'},
	{t: 5.98, end: 6.96, text: 'Your *car* needs work.'},
	{t: 7.28, end: 8.69, text: 'Another random *bill* shows up.'},
	{t: 9.2, end: 10.06, text: 'Like *BRO,*'},
	{t: 10.12, end: 10.78, text: "I'm trying to get"},
	{t: 10.82, end: 11.44, text: '*OUT* of debt,'},
	{t: 11.65, end: 12.84, text: 'not collect *more* of it!'},
	{t: 13.28, end: 14.02, text: "I'm *22,*"},
	{t: 14.23, end: 15.84, text: 'trying to become *debt-free*'},
	{t: 15.86, end: 16.68, text: 'before *2027.*'},
	{t: 17.11, end: 17.91, text: "And one thing I'm learning?"},
	{t: 18.36, end: 19.0, text: "Life doesn't care"},
	{t: 19.02, end: 20.43, text: 'about your debt payoff *plan.*'},
	{t: 20.99, end: 22.36, text: "That's why I'm realizing"},
	{t: 22.45, end: 23.0, text: 'how important'},
	{t: 23.02, end: 24.43, text: 'an *emergency fund* really is.'},
	{t: 24.85, end: 26.3, text: 'Even having *$500*'},
	{t: 26.34, end: 27.9, text: 'or *$1,000* saved'},
	{t: 28.0, end: 28.96, text: 'can help you handle'},
	{t: 29.0, end: 29.76, text: 'an *unexpected expense*'},
	{t: 29.8, end: 31.5, text: 'without reaching for a *credit card.*'},
	{t: 32.0, end: 33.65, text: 'Because *paying off debt* is one thing.'},
	{t: 34.05, end: 34.97, text: '*STAYING* out of debt?'},
	{t: 35.39, end: 36.36, text: "That's the *real goal.*"},
	{t: 36.94, end: 38.48, text: "What's the one *unexpected expense*"},
	{t: 38.5, end: 40.32, text: 'that always messes up your *budget?*'},
];

/** Each group holds until the next starts when the pause is short, otherwise 0.3 s past its last word. */
export const SUBS = RAW.map((x, i) => {
	const next = RAW[i + 1];
	const hold = next && next.t - x.end < 0.6 ? next.t : x.end + 0.3;
	return {from: s(x.t), to: s(hold), text: x.text};
});

export const Subtitles: React.FC = () => {
	const f = useCurrentFrame();
	const cur = SUBS.find((x) => f >= x.from && f < x.to);
	if (!cur) return null;
	const inT = tw(f, cur.from, cur.from + 4, 0, 1, easeOut);
	const outT = tw(f, cur.to - 3, cur.to, 1, 0);
	const parts = cur.text.split(/(\*[^*]+\*)/).filter(Boolean);
	return (
		<div
			style={{
				position: 'absolute',
				left: 90,
				right: 90,
				top: 1346,
				height: 150,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				textAlign: 'center',
				opacity: Math.min(inT, outT),
				transform: `translateY(${(1 - inT) * 8}px)`,
			}}
		>
			<div
				style={{
					fontFamily: FONT,
					fontWeight: 800,
					fontSize: 58,
					lineHeight: 1.22,
					letterSpacing: -0.5,
					textTransform: 'uppercase',
					color: C.white,
					textShadow: '0 3px 10px rgba(0,0,0,0.9)',
					textWrap: 'balance',
				} as React.CSSProperties}
			>
				<span
					style={{
						background: 'rgba(11,13,12,0.72)',
						padding: '2px 18px',
						borderRadius: 16,
						boxDecorationBreak: 'clone',
						WebkitBoxDecorationBreak: 'clone',
					}}
				>
					{parts.flatMap((p, i) => {
						const hl = p.startsWith('*');
						const txt = hl ? p.slice(1, -1) : p;
						// keep each word (incl. hyphenated ones like DEBT-FREE) unbreakable
						return txt.split(/(\s+)/).map((w, k) =>
							/^\s+$/.test(w) ? ' ' : w ? <span key={`${i}-${k}`} style={{whiteSpace: 'nowrap', color: hl ? C.green : undefined}}>{w}</span> : null,
						);
					})}
				</span>
			</div>
		</div>
	);
};
