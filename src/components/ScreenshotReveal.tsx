import React from 'react';
import {Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors} from '../brand/theme';
import {clamp, ease, springAt, springs} from '../lib/motion';

export type Region = {x: number; y: number; w: number; h: number};

type Props = {
	src: string;
	/** Natural pixel size of the screenshot (regions are in these pixels). */
	imageWidth: number;
	imageHeight: number;
	/** Display width in the video. */
	width?: number;
	enterFrame: number;
	/**
	 * Private areas: names, account numbers, emails, faces, addresses.
	 * Always blurred from the first frame — never animated in.
	 */
	privacy?: Region[];
	privacyStyle?: 'blur' | 'redact';
	/** Area to call out with a drawn green box. */
	highlight?: Region & {at: number};
	/** Push in on the highlight at this frame. */
	focus?: {at: number; zoom?: number};
};

/**
 * Real-life screenshot stories: the screenshot rises in as a floating card,
 * private details stay blurred, and the camera pushes into the part that matters.
 */
export const ScreenshotReveal: React.FC<Props> = ({
	src,
	imageWidth,
	imageHeight,
	width = 820,
	enterFrame,
	privacy = [],
	privacyStyle = 'blur',
	highlight,
	focus,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const k = width / imageWidth;
	const height = imageHeight * k;
	const enter = springAt(frame, fps, enterFrame, springs.heavy);
	const draw = highlight ? interpolate(frame, [highlight.at, highlight.at + 14], [0, 1], {...clamp, easing: ease.inOut}) : 0;
	const push = focus && highlight ? interpolate(frame, [focus.at, focus.at + 20], [0, 1], {...clamp, easing: ease.inOut}) : 0;
	const zoom = 1 + ((focus?.zoom ?? 1.8) - 1) * push;
	const hx = highlight ? (highlight.x + highlight.w / 2) * k : width / 2;
	const hy = highlight ? (highlight.y + highlight.h / 2) * k : height / 2;

	return (
		<div
			style={{
				width,
				height,
				perspective: 1800,
				opacity: Math.min(1, enter * 1.5),
				// Scale is around the card center, so moving point h to the center needs (c - h) * zoom.
				translate: `${(width / 2 - hx) * zoom * push}px ${(1 - enter) * 500 + (height / 2 - hy) * zoom * push}px`,
				scale: zoom,
			}}
		>
			<div
				style={{
					position: 'relative',
					width,
					height,
					borderRadius: 36,
					overflow: 'hidden',
					transform: `rotateX(${(1 - enter) * 18}deg)`,
					boxShadow: '0 50px 120px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.08)',
				}}
			>
				<Img src={src} style={{width, height, display: 'block'}} />
				{privacy.map((r, i) => (
					<div key={i} style={{position: 'absolute', left: r.x * k, top: r.y * k, width: r.w * k, height: r.h * k, overflow: 'hidden', borderRadius: 10}}>
						{privacyStyle === 'blur' ? (
							<>
								<Img
									src={src}
									style={{position: 'absolute', left: -r.x * k, top: -r.y * k, width, height, filter: 'blur(22px)', scale: 1.04}}
								/>
								<div style={{position: 'absolute', inset: 0, background: 'rgba(120,120,120,0.25)'}} />
							</>
						) : (
							<div style={{position: 'absolute', inset: 0, background: '#0B0B0C'}} />
						)}
					</div>
				))}
				{highlight ? (
					<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={width} height={height}>
						<rect
							x={highlight.x * k - 10}
							y={highlight.y * k - 10}
							width={highlight.w * k + 20}
							height={highlight.h * k + 20}
							rx={18}
							fill="none"
							stroke={colors.green}
							strokeWidth={7}
							pathLength={1}
							strokeDasharray={1}
							strokeDashoffset={1 - draw}
							style={{filter: `drop-shadow(0 0 12px ${colors.green})`}}
						/>
					</svg>
				) : null}
			</div>
		</div>
	);
};
