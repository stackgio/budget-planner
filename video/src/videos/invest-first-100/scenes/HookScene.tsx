import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Banknote} from '../../../story/components/Banknote';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, shake, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {dark as P, FUND, NOTE, NOTE_H, SPLIT, stripX} from '../look';

const COLORS = [FUND.vti.dark, FUND.schd.dark, FUND.vxus.dark];

/**
 * HOOK — "If I had to restart investing with just $100, here's exactly what I'd buy."
 * 0.0s  "RESTART WITH ONLY $100" + the note slams in (readable on frame 0)
 * ~2.0s on "$100" the note immediately splits into 70/20/10 strips that fan out;
 *       the title tucks away to the top instead of holding the frame
 * ~3.6s on "exactly" three LOCKED slots: the picks are revealed chapter by chapter
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t100 = cue('L1', '$100');
	const tExactly = cue('L1', 'exactly');
	const tBuy = cue('L1', 'buy');

	const arrive = sp(frame, fps, -3, 'heavy');
	const land = shake(frame, 9, 12, 14);
	const tSplit = t100 + 2;
	const split = sp(frame, fps, tSplit, {damping: 14, stiffness: 110, mass: 1});
	const fan = Math.sin(Math.min(1, split) * Math.PI); // mid-flight lift/rotation
	const tuck = kf(frame, [tSplit, tSplit + 16], [0, 1], E.inOut);
	const noteLeft = NOTE.cx - NOTE.w / 2;
	const noteTop = NOTE.cy - NOTE_H / 2;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={760} light={1.1} warm={false} />
			<Camera
				keys={[
					{at: 0, zoom: 1.04, y: 900},
					{at: tSplit, zoom: 1.0, y: 960},
					{at: tExactly, zoom: 1.0},
					{at: tExactly + 20, zoom: 1.03, y: 1000},
				]}
				shakeX={land.x}
				shakeY={land.y}
			>
				{/* the concept, then it gets out of the way */}
				<div
					style={{
						position: 'absolute',
						left: story.safe.left,
						top: story.safe.top + 10,
						transformOrigin: '0 0',
						transform: `scale(${mix(1, 0.56, tuck)})`,
					}}
				>
					<div style={{fontSize: 34, fontWeight: 900, letterSpacing: 4, color: P.muted, marginBottom: 12, opacity: 1 - tuck}}>IF I HAD TO START OVER…</div>
					<KineticText text="RESTART WITH" at={-14} fontSize={112} color={P.ink} />
					<KineticText text="ONLY $100" at={-18} fontSize={112} color={P.ink} colors={{'100': P.accent}} />
				</div>

				{/* one note → three strips */}
				{(split < 0.002 ? [[0, 1] as [number, number]] : SPLIT.cuts).map(([a, b], i) => {
					const joinedX = noteLeft + a * NOTE.w;
					const x = split < 0.002 ? noteLeft : mix(joinedX, stripX(i), split);
					const lift = [-10, -40, -70][i] * fan * (split < 0.002 ? 0 : 1);
					const top = mix(noteTop, 560, tuck) + [0, 20, 40][i] * split + lift;
					const rot = split < 0.002 ? -3 * (1 - arrive) : [0, -6, 9][i] * fan;
					const s = (1.3 - 0.3 * arrive) * (1 + 0.04 * Math.max(0, 1 - Math.abs(frame - t100) / 6));
					return (
						<div key={`${a}-${b}`} style={{position: 'absolute', left: x, top, transformOrigin: `${NOTE.cx - x}px ${NOTE_H / 2}px`, transform: `scale(${s}) rotate(${rot}deg)`}}>
							<Banknote w={NOTE.w} slice={[a, b]} shine={kf(frame, [2, 24], [0, 1], E.inOut)} style={{position: 'relative'}} />
							{split >= 0.002 && (
								<div style={{position: 'absolute', left: 0, right: 0, top: -14, height: 8, borderRadius: 4, background: COLORS[i], transformOrigin: '0 50%', transform: `scaleX(${kf(frame, [tSplit + 6, tSplit + 16], [0, 1], E.out)})`}} />
							)}
						</div>
					);
				})}

				{/* the picks stay locked — each chapter reveals one */}
				<div style={{position: 'absolute', left: SPLIT.left, top: 1000, right: story.safe.right}}>
					{COLORS.map((c, i) => {
						const p = sp(frame, fps, tExactly + i * 4, 'snappy');
						const box: React.CSSProperties = {height: 92, borderRadius: 18, border: `3px dashed ${P.muted}`, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 900, color: P.muted};
						return (
							<div key={i} style={{display: 'flex', alignItems: 'center', height: 118, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 40}px)`}}>
								<div style={{width: 14, height: 84, borderRadius: 7, background: c, marginRight: 30}} />
								<div style={{...box, width: 200}}>
									<span style={{color: c}}>$</span>??
								</div>
								<div style={{fontSize: 30, fontWeight: 900, color: P.muted, margin: '0 28px'}}>→</div>
								<div style={{...box, width: 300, letterSpacing: 6}}>????</div>
							</div>
						);
					})}
				</div>
			</Camera>

			<Sfx at={0} name="whoosh" volume={0.4} />
			<Sfx at={8} name="thud" volume={0.5} />
			<Sfx at={tSplit} name="whoosh" volume={0.45} />
			<Sfx at={tExactly} name="pop" volume={0.3} />
			<Sfx at={tExactly + 4} name="pop" volume={0.28} />
			<Sfx at={tExactly + 8} name="pop" volume={0.28} />
			<Sfx at={tBuy} name="click" volume={0.25} />
		</AbsoluteFill>
	);
};
