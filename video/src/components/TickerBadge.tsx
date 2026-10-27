import React from 'react';
import {Img, staticFile} from 'remotion';
import {theme} from '../theme';

/** Real logo when a verified file exists in public/, otherwise a clean typographic ticker badge. */
export const TickerBadge: React.FC<{ticker: string; logo?: string | null; color: string; size?: number}> = ({
	ticker,
	logo,
	color,
	size = 64,
}) => {
	if (logo) {
		return (
			<div
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
					background: '#fff',
					border: `2px solid ${theme.grid}`,
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
				}}
			>
				<Img src={staticFile(logo)} style={{width: size * 0.7, height: size * 0.7, objectFit: 'contain'}} />
			</div>
		);
	}
	const fs = ticker.length > 4 ? size * 0.26 : size * 0.32;
	return (
		<div
			style={{
				height: size,
				minWidth: size,
				padding: `0 ${size * 0.18}px`,
				borderRadius: size / 2,
				background: color,
				color: '#fff',
				fontWeight: 800,
				fontSize: fs,
				letterSpacing: 0.5,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				boxSizing: 'border-box',
				flexShrink: 0,
			}}
		>
			{ticker}
		</div>
	);
};
