import React from 'react';

export type MapCountry = {id: string; d: string};

/**
 * Flat world map from pre-projected country paths (e.g. Natural Earth via
 * world-atlas + d3-geo, generated offline). `fills` colours countries by id;
 * everything else uses `base`. Size the map with `w` (height keeps ratio).
 */
export const WorldMap: React.FC<{
	countries: readonly MapCountry[];
	vw: number;
	vh: number;
	w: number;
	base: string;
	stroke: string;
	fills?: Record<string, string>;
	opacity?: Record<string, number>;
	/** per-country colour by index (wins over `fills`) — e.g. a sweeping reveal */
	colorAt?: (index: number) => string | undefined;
	style?: React.CSSProperties;
	children?: React.ReactNode;
}> = ({countries, vw, vh, w, base, stroke, fills = {}, opacity = {}, colorAt, style, children}) => (
	<div style={{position: 'absolute', width: w, height: (w * vh) / vw, ...style}}>
		<svg width={w} height={(w * vh) / vw} viewBox={`0 0 ${vw} ${vh}`} style={{position: 'absolute', inset: 0}}>
			{countries.map((c, i) => (
				<path key={i} d={c.d} fill={colorAt?.(i) ?? fills[c.id] ?? base} fillOpacity={opacity[c.id] ?? 1} stroke={stroke} strokeWidth={0.6} strokeLinejoin="round" />
			))}
		</svg>
		{children}
	</div>
);
