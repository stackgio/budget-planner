export const formatMoney = (v: number, decimals = 0) =>
	(v < 0 ? '\u2212$' : '$') +
	Math.abs(v).toLocaleString('en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});

/** Axis labels: $950, $12K, $1.2M, $3.4B */
export const formatCompact = (v: number) => {
	const a = Math.abs(v);
	const sign = v < 0 ? '-' : '';
	const trim = (n: number) => (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(0) : n.toFixed(1)).replace(/\.0$/, '');
	if (a >= 1e9) return `${sign}$${trim(a / 1e9)}B`;
	if (a >= 1e6) return `${sign}$${trim(a / 1e6)}M`;
	if (a >= 1e3) return `${sign}$${trim(a / 1e3)}K`;
	return `${sign}$${a.toFixed(0)}`;
};

export const formatPct = (v: number) =>
	`${v >= 0 ? '+' : '\u2212'}${Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)}%`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const parseISO = (d: string) => {
	const [y, m, day] = d.split('-').map(Number);
	return Date.UTC(y, m - 1, day);
};

export const formatDate = (d: string, style: 'short' | 'long' = 'short') => {
	const [y, m, day] = d.split('-').map(Number);
	return style === 'long' ? `${MONTHS[m - 1]} ${day}, ${y}` : `${MONTHS[m - 1]} ${y}`;
};
