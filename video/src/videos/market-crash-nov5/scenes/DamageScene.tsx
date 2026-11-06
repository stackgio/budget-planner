import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS, SRC} from '../facts';
import {C, Kicker, NewsBg, Pct, ScaleBar, SourceTag} from '../ui';
import {HOOK} from './HookScene';

const X = story.safe.left;
const W = story.width - X * 2;
const CARD1 = {top: 330, h: 450};
const CARD2 = {top: 830, h: 450};

/**
 * DAMAGE — "The Nasdaq dropped five point five percent, and the S&P 500 fell over four percent."
 * The hook's −5.5% settles into card 1 (match cut); S&P swings in as a mirrored card.
 * Both bars use the SAME 0…−10 % scale. Viewer learns: it was broad, not one stock.
 */
export const DamageScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFive = cue('L3', 'five');
	const tSP = cue('L3', 'S&P');
	const tFour = cue('L3', 'four');
	const tFourEnd = cue('L3', -1, 0, 'end'); // last word ("percent" appears twice)
	const nas = Math.abs(FACTS.nasdaqPct.value);
	const spx = Math.abs(FACTS.spxPct.value);

	// hook framing → card 1 framing
	const settle = sp(frame, fps, 2, 'smooth');
	const numTop = mix(HOOK.numTop, CARD1.top + 108, settle);
	const numSize = mix(HOOK.numSize, 180, settle);
	const labTop = mix(HOOK.labelTop, CARD1.top + 40, settle);
	const labSize = mix(64, 36, settle);
	const barTop = mix(HOOK.barTop, CARD1.top + 330, settle);
	const cardIn = kf(frame, [4, 18], [0, 1], E.out);
	const pulse = kf(frame, [tFive, tFive + 6, tFive + 20], [0, 1, 0], E.out);

	const c2 = sp(frame, fps, tSP - 6, 'heavy');
	const v2 = kf(frame, [tSP - 6, tFourEnd], [0, spx], E.out); // rolls from the moment the card appears

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg tint="red" lightY={760} />
			<Camera keys={[{at: 0, zoom: 1}, {at: tSP, zoom: 1, y: 960}, {at: tFour + 20, zoom: 1.03, y: 940}]}>
				<Kicker style={{left: X, top: 250, opacity: cardIn}}>NOV 5, 2026 · CLOSING MOVES</Kicker>

				{/* card 1 — Nasdaq, left-weighted */}
				<div
					style={{
						position: 'absolute',
						left: X,
						top: CARD1.top,
						width: W,
						height: CARD1.h,
						borderRadius: 34,
						background: C.panel,
						border: `2px solid ${C.line}`,
						borderLeft: `10px solid ${C.red}`,
						opacity: cardIn,
						boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 ${80 * pulse}px rgba(255,70,85,${0.35 * pulse})`,
					}}
				/>
				<div style={{position: 'absolute', left: X + 44 * settle, top: labTop, fontSize: labSize, fontWeight: 900, letterSpacing: mix(8, 4, settle), color: C.ink}}>
					NASDAQ{settle > 0.5 && <span style={{color: C.muted, opacity: (settle - 0.5) * 2}}> COMPOSITE</span>}
				</div>
				<div style={{position: 'absolute', left: X - 10 + 50 * settle, top: numTop}}>
					<Pct v={nas} size={numSize} color={C.red} />
				</div>
				<ScaleBar value={nas} w={mix(W, W - 88, settle)} style={{left: X + 44 * settle, top: barTop}} />

				{/* card 2 — S&P 500, mirrored (right-weighted), swings in with depth */}
				<div style={{position: 'absolute', left: X, top: CARD2.top, width: W, height: CARD2.h, perspective: 1400}}>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							borderRadius: 34,
							background: C.panel,
							border: `2px solid ${C.line}`,
							borderRight: `10px solid ${C.red}`,
							transform: `translateX(${(1 - c2) * 260}px) rotateY(${(1 - c2) * -24}deg)`,
							opacity: Math.min(1, c2 * 1.6),
							boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
						}}
					>
						<div style={{position: 'absolute', right: 44, top: 40, fontSize: 36, fontWeight: 900, letterSpacing: 4, color: C.ink}}>S&amp;P 500</div>
						<div style={{position: 'absolute', right: 34, top: 108}}>
							<Pct v={v2} size={180} color={C.red} />
						</div>
						<ScaleBar value={v2} w={W - 88} style={{left: 44, top: 330}} />
					</div>
				</div>
			</Camera>
			<SourceTag text={SRC.close} />
			<Sfx at={tFive} name="tick" volume={0.25} />
			<Sfx at={tSP - 6} name="whoosh-soft" volume={0.25} />
			<Sfx at={tFourEnd} name="tick" volume={0.25} />
		</AbsoluteFill>
	);
};
