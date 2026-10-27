// Stack With Gio — premium white financial-editorial design system.
export const theme = {
	width: 1080,
	height: 1920,
	fps: 30,
	bg: {white: '#FFFFFF', offwhite: '#FAFAF7'},
	ink: '#0E0F12', // headlines
	charcoal: '#2B2F36', // body
	muted: '#6B7280', // labels
	faint: '#9CA3AF',
	grid: '#ECEDEF',
	gridStrong: '#D9DBDF',
	up: '#16A34A', // growth green
	upSoft: 'rgba(22,163,74,0.14)',
	down: '#DC2626', // loss red
	downSoft: 'rgba(220,38,38,0.12)',
	neutral: '#111827',
	// compare-mode palette (first is brand green)
	seriesColors: ['#16A34A', '#111827', '#2563EB', '#D97706'],
	font: "'Inter', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
	// Safe zone for TikTok / Reels / Shorts UI overlays.
	safe: {top: 170, bottom: 330, left: 72, right: 120},
} as const;

export const toneColor = (tone: 'up' | 'down' | 'neutral') =>
	tone === 'up' ? theme.up : tone === 'down' ? theme.down : theme.ink;

/** Series colour: explicit > gain/loss mode green > compare mode (winner = brand green). */
export const seriesColor = (
	spec: {colorMode: 'gainloss' | 'series'; series: {color?: string; values: number[]}[]},
	i: number,
) => {
	const s = spec.series[i];
	if (s.color) return s.color;
	if (spec.colorMode === 'gainloss') return theme.up;
	const order = spec.series
		.map((ss, k) => ({k, v: ss.values[ss.values.length - 1]}))
		.sort((a, b) => b.v - a.v)
		.map((o) => o.k);
	return theme.seriesColors[order.indexOf(i) % theme.seriesColors.length];
};
