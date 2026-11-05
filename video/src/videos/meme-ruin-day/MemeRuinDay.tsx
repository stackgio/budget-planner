import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import '../../fonts';

/**
 * Minimal "ruin your day" meme, 10 s, 1080x1920 @ 30 fps.
 * Static real Robinhood screenshot, one caption, chroma-keyed original meme footage + audio.
 * No zooms, shakes, transitions or added sound.
 *
 * Assets (public/meme-ruin/):
 *  - portfolio.png  screenshot cropped to balance, daily loss and 1D chart (pixels untouched)
 *  - michael.webm   original meme, source 0.0s-8.8s, green removed (VP9 + alpha), TikTok UI cropped away
 *  - michael.wav    original audio for the same window
 */

export const RUIN_FPS = 30;
export const RUIN_FRAMES = 300;
const LEAD_IN = 36; // 1.2 s of just the screenshot before Michael's reaction starts

const IMG_W = 1206;
const IMG_H = 1180;
// Static scale: the chart ends at x≈860 of the crop, so fill the width with x 0–880.
const SCALE = 1080 / 880;
const IMG_TOP = 330;

export const MemeRuinDay: React.FC = () => (
	<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
		{/* screenshot background, fit to width, static */}
		<div style={{position: 'absolute', left: 0, top: IMG_TOP, width: IMG_W * SCALE, height: IMG_H * SCALE}}>
			<Img src={staticFile('meme-ruin/portfolio.png')} style={{width: IMG_W * SCALE, height: IMG_H * SCALE, display: 'block'}} />
			{/* hide the promo pill beside the balance (app chrome, not data) */}
			<div style={{position: 'absolute', left: 740 * SCALE, top: 30 * SCALE, width: 410 * SCALE, height: 108 * SCALE, background: '#000'}} />
		</div>

		{/* Michael, lower half */}
		<Sequence from={LEAD_IN} layout="none">
			<div style={{position: 'absolute', left: 0, bottom: 0, width: 1080, height: 1273}}>
				<OffthreadVideo
					src={staticFile('meme-ruin/michael.webm')}
					transparent
					muted
					style={{width: 1080, height: 1273, display: 'block'}}
				/>
			</div>
			<Audio src={staticFile('meme-ruin/michael.wav')} />
		</Sequence>

		{/* the one caption */}
		<div
			style={{
				position: 'absolute',
				top: 170,
				left: 72,
				right: 72,
				textAlign: 'center',
				color: '#fff',
				fontFamily: "'Inter', 'Noto Color Emoji', system-ui, sans-serif",
				fontWeight: 800,
				fontSize: 58,
				lineHeight: 1.15,
				textShadow: '0 2px 8px rgba(0,0,0,0.6)',
			}}
		>
			POV: You open your investing app just to ruin your day 😭
		</div>
	</AbsoluteFill>
);
