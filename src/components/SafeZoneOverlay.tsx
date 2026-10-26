import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SAFE, SAFE_CENTER_WIDTH, VIDEO} from '../brand/theme';

// Layout-check overlay. Red = covered by platform UI on TikTok/Reels/Shorts.
// Green outline = centered box where key text is always safe.
export const SafeZoneOverlay: React.FC = () => {
	const red = 'rgba(255,40,40,0.28)';
	const label: React.CSSProperties = {
		position: 'absolute',
		color: 'white',
		fontFamily: 'Inter',
		fontSize: 26,
		fontWeight: 700,
		padding: 10,
	};
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: SAFE.top, background: red}}>
				<span style={label}>TOP UI</span>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: SAFE.bottom, background: red}}>
				<span style={label}>CAPTION / USERNAME UI</span>
			</div>
			<div
				style={{position: 'absolute', right: 0, top: SAFE.top, bottom: SAFE.bottom, width: SAFE.right, background: red}}
			>
				<span style={label}>RAIL</span>
			</div>
			<div style={{position: 'absolute', left: 0, top: SAFE.top, bottom: SAFE.bottom, width: SAFE.left, background: red}} />
			<div
				style={{
					position: 'absolute',
					top: SAFE.top,
					bottom: SAFE.bottom,
					left: (VIDEO.width - SAFE_CENTER_WIDTH) / 2,
					width: SAFE_CENTER_WIDTH,
					border: '3px dashed rgba(46,224,122,0.9)',
				}}
			/>
		</AbsoluteFill>
	);
};
