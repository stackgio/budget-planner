import React from 'react';

/**
 * Odometer-style rolling number. Pass the live `value` (animate it outside with
 * springs/interpolate); every digit column rolls continuously, leading digits
 * collapse smoothly when the number shrinks (e.g. $8,150 → $950).
 */
export const NumberCounter: React.FC<{
	value: number;
	prefix?: string;
	suffix?: string;
	fontSize: number;
	color: string;
	weight?: number;
	minDigits?: number;
	/** fixed digit count: no collapsing (prevents layout shifts in tight spaces) */
	fixedDigits?: number;
	style?: React.CSSProperties;
	/** roll smoothly (true) or snap to whole numbers like a cash register */
	roll?: boolean;
}> = ({value, prefix = '$', suffix = '', fontSize, color, weight = 900, minDigits = 1, fixedDigits, style, roll = true}) => {
	const v = Math.max(0, roll ? value : Math.round(value));
	const lh = fontSize * 1.08;
	const maxPlaces = fixedDigits ?? Math.max(minDigits, Math.floor(Math.log10(Math.max(1, v))) + 2);
	const cols: React.ReactNode[] = [];
	for (let p = maxPlaces - 1; p >= 0; p--) {
		const place = Math.pow(10, p);
		// visibility of leading digits: fade + collapse width as the number shrinks
		const vis = fixedDigits ? 1 : p === 0 || p < minDigits ? 1 : Math.max(0, Math.min(1, (v - place * 0.9) / (place * 0.1)));
		if (vis <= 0) continue;
		// continuous digit: lower places drive the roll of this one in the last tenth
		const raw = v / place;
		const below = raw - Math.floor(raw);
		const d = Math.floor(raw) % 10;
		const frac = p === 0 ? below : below > 0.9 ? (below - 0.9) * 10 : 0;
		const pos = roll ? d + frac : d;
		cols.push(
			<span key={`d${p}`} style={{display: 'inline-block', width: `${0.62 * vis}em`, height: lh, overflow: 'hidden', opacity: vis, position: 'relative', verticalAlign: 'top'}}>
				<span style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-pos * lh}px)`, textAlign: 'center'}}>
					{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, i) => (
						<span key={i} style={{display: 'block', height: lh, lineHeight: `${lh}px`}}>
							{n}
						</span>
					))}
				</span>
			</span>,
		);
		if (p % 3 === 0 && p > 0) {
			cols.push(
				<span key={`c${p}`} style={{display: 'inline-block', width: `${0.26 * vis}em`, opacity: vis, height: lh, lineHeight: `${lh}px`, verticalAlign: 'top'}}>
					,
				</span>,
			);
		}
	}
	return (
		<span style={{display: 'inline-flex', fontSize, fontWeight: weight, color, letterSpacing: 0, lineHeight: `${lh}px`, height: lh, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', ...style}}>
			{prefix && <span style={{display: 'inline-block', height: lh, lineHeight: `${lh}px`, marginRight: '0.02em'}}>{prefix}</span>}
			{cols}
			{suffix && <span style={{display: 'inline-block', height: lh, lineHeight: `${lh}px`}}>{suffix}</span>}
		</span>
	);
};

export const formatUSD = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
