import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {ScreenshotCrop} from '../../../story/components/Screenshot';
import {cinematic as P, story} from '../../../story/theme';
import {HOLDINGS} from '../assets';

const W = 888;

/**
 * The real VOO row from the creator's holdings screenshot (IMG_0756), labelled
 * "An ETF I already own." Rendered identically by RedeemScene (cut on "more ETFs")
 * and PlanScene (continues across the line break), so the shot never jumps.
 */
export const HoldingsShot: React.FC<{opacity?: number; y?: number}> = ({opacity = 1, y = 0}) => {
	const h = HOLDINGS.src ? (HOLDINGS.row.h / HOLDINGS.row.w) * W : 260;
	return (
		<AbsoluteFill style={{fontFamily: story.font, opacity, transform: `translateY(${y}px)`}}>
			<CinematicBg lightX={540} lightY={760} light={0.9} warm={false} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 520, textAlign: 'center', fontSize: 66, fontWeight: 900, letterSpacing: -1.5, color: P.ink}}>
				An ETF I already own.
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: 640, width: W, height: h}}>
				{HOLDINGS.src ? (
					<ScreenshotCrop src={HOLDINGS.src} natural={HOLDINGS.natural} region={HOLDINGS.row} w={W} radius={24} style={{position: 'relative', border: `2px solid ${P.line}`}} />
				) : (
					<div
						style={{
							width: W,
							height: h,
							boxSizing: 'border-box',
							border: `4px dashed ${P.danger}`,
							borderRadius: 24,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							textAlign: 'center',
							color: P.danger,
							fontSize: 36,
							fontWeight: 900,
							lineHeight: 1.3,
						}}
					>
						PLACEHOLDER
						<br />
						IMG_0756 VOO row needed
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};
