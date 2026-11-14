// DMM-001 timing grid (frames @30fps). Pure data: no React, no CSS, so scripts can import it.
export const T = {
	chipA: -20, // visible on frame 0
	chipB: -20,
	items: [5, 16, 27], // motion starts in the first 0.2 s
	yearsStart: 50,
	yearsEnd: 345, // 11.5 s — lands on the music's resolve
	keptPulse: 120,
	baseLabel: 345, // only once the full $60,000 has been put in
	gap: 345,
	lift: [330, 352, 400, 440] as const,
	headOut: 378,
	headIn: 390,
	sign: 410,
};

/** QC beats (absolute frames) checked on every render. */
export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['a_2s', 60],
	['b_items_done', 75],
	['b_kept_pulse', T.keptPulse + 4],
	['b_year5', 210],
	['c_year9', 316],
	['c_payoff', T.gap + 24],
	['d_takeaway', T.headIn + 24],
	['z_last', 449],
];
