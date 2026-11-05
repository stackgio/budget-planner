import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Banknote} from '../../../story/components/Banknote';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, shake, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN} from '../facts';
import {dark as P, FUND, NOTE, NOTE_H, SPLIT, stripX} from '../look';

const ROWS = [
	{key: 'vti', ticker: 'VTI', amount: PLAN.vti.value, color: FUND.vti.dark},
	{key: 'schd', ticker: 'SCHD', amount: PLAN.schd.value, color: FUND.schd.dark},
	{key: 'vxus', ticker: 'VXUS', amount: PLAN.vxus.value, color: FUND.vxus.dark},
] as const;

/**
 * HOOK — "If I had to restart investing with just $100, here's exactly what I'd buy."
 * Frame 0: a big $100 note + the promise. On "$100" it lands with weight; on
 * "here's exactly" it slices into proportional 70 / 20 / 10 strips — the plan.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t100 = cue('L1', '$100');
	const tSplit = cue('L1', "here's") - 2;
	const tBuy = cue('L1', 'buy');

	const arrive = sp(frame, fps, -3, 'heavy');
	const land = shake(frame, 9, 12, 14);
	const pulse = frame >= t100 ? Math.sin(Math.min(1, (frame - t100) / 10) * Math.PI) * 0.035 : 0;
	const hit = shake(frame, t100 + 1, 8, 12);
	const split = sp(frame, fps, tSplit, {damping: 15, stiffness: 90, mass: 1.1});
	const noteLeft = NOTE.cx - NOTE.w / 2;
	const noteTop = NOTE.cy - NOTE_H / 2;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={760} light={1.1} warm={false} />
			{/* the promise — readable on frame 0 */}
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: story.safe.top + 10}}>
				<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted, marginBottom: 14}}>HOW I&apos;D INVEST IT</div>
				<KineticText text="STARTING INVESTING" at={-14} fontSize={104} color={P.ink} />
				<KineticText text="WITH $100" at={-18} fontSize={104} color={P.ink} colors={{'100': P.accent}} marker={{words: ['$100'], color: 'rgba(44,212,122,0.18)', at: t100 - 4}} />
			</div>

			{/* the note: one object, then three strips */}
			<div style={{position: 'absolute', inset: 0, transform: `translate(${hit.x + land.x}px, ${hit.y + land.y}px)`}}>
				{(split < 0.002 ? [[0, 1] as [number, number]] : SPLIT.cuts).map(([a, b], i) => {
					const joinedX = noteLeft + a * NOTE.w;
					const x = split < 0.002 ? noteLeft : mix(joinedX, stripX(i), split);
					const drop = [0, 26, 52][i] * split;
					const rot = mix(-3 * (1 - arrive) + Math.sin(frame / 14) * 1.2 * (1 - split), [0, 2.5, 5][i] * Math.sin(Math.min(1, split) * Math.PI) * 0.6, split);
					const s = (1.3 - 0.3 * arrive) * (1 + pulse) * (1 + 0.05 * kf(frame, [0, tSplit], [0, 1], E.soft) * (1 - split));
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: x,
								top: noteTop + drop,
								transformOrigin: `${NOTE.cx - x}px ${NOTE_H / 2}px`,
								transform: `scale(${s}) rotate(${rot}deg)`,
								opacity: 1,
							}}
						>
							<Banknote w={NOTE.w} slice={[a, b]} shine={kf(frame, [t100 - 2, t100 + 16], [0, 1], E.inOut) || kf(frame, [2, 24], [0, 1], E.inOut)} style={{position: 'relative'}} />
							{/* fund colour band appears on the cut edge */}
							<div style={{position: 'absolute', left: 0, right: 0, top: -14, height: 8, borderRadius: 4, background: ROWS[i].color, opacity: kf(frame, [tSplit + 8, tSplit + 16], [0, 1]), transform: `scaleX(${kf(frame, [tSplit + 8, tSplit + 18], [0, 1], E.out)})`}} />
						</div>
					);
				})}
			</div>

			{/* the plan stays locked: amounts + tickers are revealed in their own chapters */}
			<div style={{position: 'absolute', left: SPLIT.left, top: 1030, right: story.safe.right}}>
				{ROWS.map((r, i) => {
					const p = sp(frame, fps, tSplit + 8 + i * 6, 'snappy');
					const box: React.CSSProperties = {height: 92, borderRadius: 18, border: `3px dashed ${P.muted}`, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 900, color: P.muted};
					return (
						<div key={r.key} style={{display: 'flex', alignItems: 'center', height: 118, opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * -60}px)`}}>
							<div style={{width: 14, height: 84, borderRadius: 7, background: r.color, marginRight: 30}} />
							<div style={{...box, width: 200}}>
								<span style={{color: r.color}}>$</span>??
							</div>
							<div style={{fontSize: 30, fontWeight: 900, color: P.muted, margin: '0 28px', letterSpacing: 2}}>→</div>
							<div style={{...box, width: 300, letterSpacing: 6}}>????</div>
						</div>
					);
				})}
			</div>

			<Sfx at={0} name="whoosh" volume={0.4} />
			<Sfx at={8} name="thud" volume={0.5} />
			<Sfx at={t100} name="cash" volume={0.45} />
			<Sfx at={tSplit} name="whoosh" volume={0.45} />
			<Sfx at={tSplit + 8} name="pop" volume={0.3} />
			<Sfx at={tSplit + 14} name="pop" volume={0.3} />
			<Sfx at={tSplit + 20} name="pop" volume={0.3} />
			<Sfx at={tBuy} name="click" volume={0.25} />
		</AbsoluteFill>
	);
};
