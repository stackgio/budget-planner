import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {ScreenshotCrop} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {DASH} from '../assets';

/** Final panel scale (natural px → screen px), shared by the card and the heading crop. */
export const PANEL_S = 820 / DASH.card.w;
export const CARD_W = DASH.card.w * PANEL_S; // 820
export const CARD_H = DASH.card.h * PANEL_S; // ~522
export const CARD_CY = 966;

/**
 * HOOK — frame 0: the real gold card + the locked headline.
 * "and I finally got approved for it" → pull back to reveal the real "Gold Card" heading.
 * Balance and available credit are never in frame (two separate crops of the same screenshot).
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tApproved = cue('L1', 'and', -0.05);
	const tGold = cue('L2', 'gold');
	const tL3 = cue('L3');
	const tBest = cue('L3', 'best');

	const pull = sp(frame, fps, tApproved, 'smooth');
	const push = kf(frame, [tL3, tL3 + 4.8 * fps], [0, 1], E.inOut);
	const cardScale = mix(1.17, 1, pull) * (1 + 0.035 * push);
	const cardCy = mix(940, CARD_CY, pull);

	const headW = DASH.heading.w * PANEL_S;
	const headH = DASH.heading.h * PANEL_S;
	const headTop = 598;
	const underline = sp(frame, fps, tGold, 'snappy');
	const shine = kf(frame, [tBest - 4, tBest + 22], [0, 1], E.inOut);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={960} light={1.15} />
			<div style={{position: 'absolute', left: story.safe.left - 12, right: story.safe.right - 36, top: story.safe.top + 14}}>
				<KineticText text="THIS CREDIT CARD PAYS ME TO INVEST 💳" at={-14} mode="none" fontSize={92} color={P.ink} colors={{invest: P.accent}} align="center" lineHeight={1.04} />
			</div>

			{/* real "Gold Card" heading crop */}
			<div style={{position: 'absolute', left: 540 - headW / 2, top: headTop + (1 - pull) * 40, width: headW, height: headH, opacity: pull}}>
				<ScreenshotCrop src={DASH.src} natural={DASH.natural} region={DASH.heading} w={headW} radius={10} />
				<div style={{position: 'absolute', left: headW * 0.18, top: headH + 4, height: 6, borderRadius: 3, width: headW * 0.64 * underline, background: P.accent}} />
			</div>

			{/* real gold card crop */}
			<div
				style={{
					position: 'absolute',
					left: 540 - CARD_W / 2,
					top: cardCy - CARD_H / 2,
					width: CARD_W,
					height: CARD_H,
					transform: `scale(${cardScale})`,
					borderRadius: 30,
					boxShadow: '0 40px 90px rgba(0,0,0,0.7), 0 0 120px rgba(240,182,74,0.12)',
				}}
			>
				<ScreenshotCrop src={DASH.src} natural={DASH.natural} region={DASH.card} w={CARD_W} radius={30}>
					{shine > 0 && shine < 1 && (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: `linear-gradient(105deg, rgba(255,255,255,0) ${shine * 140 - 40}%, rgba(255,255,255,0.22) ${shine * 140 - 25}%, rgba(255,255,255,0) ${shine * 140 - 10}%)`,
							}}
						/>
					)}
				</ScreenshotCrop>
			</div>
			<Sfx at={tApproved} name="whoosh-soft" volume={0.3} />
			<Sfx at={tBest} name="chime" volume={0.22} />
		</AbsoluteFill>
	);
};
