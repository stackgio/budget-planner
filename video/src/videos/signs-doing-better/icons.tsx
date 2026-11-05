import React from 'react';
import {cinematic as P} from '../../story/theme';

/** Minimal line icons for the three signs (palette-aware, no logos). */
export const IconInvest: React.FC<{size: number; color?: string}> = ({size, color = P.accent}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
		<path d="M14,78 L40,52 L56,64 L86,30" />
		<path d="M66,28 H88 V50" />
	</svg>
);
export const IconNoDebt: React.FC<{size: number; color?: string}> = ({size, color = P.accent}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
		<rect x={12} y={26} width={76} height={50} rx={8} />
		<path d="M12,42 H88" />
		<path d="M18,86 L84,14" stroke={color} />
	</svg>
);
export const IconJar: React.FC<{size: number; color?: string}> = ({size, color = P.accent}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
		<rect x={30} y={10} width={40} height={12} rx={3} />
		<path d="M26,26 H74 Q84,26 84,38 V80 Q84,90 74,90 H26 Q16,90 16,80 V38 Q16,26 26,26 Z" />
		<path d="M30,62 H70" />
	</svg>
);
