// DMM-002 timing + physics model (frames @30fps). Pure data: imported by the
// episode AND by scripts (audio generator, QC beats), so picture and sound use
// the exact same drop schedule.

export const DAYS = 365;
export const PER_DAY = 20;

/** World geometry (1080×1920 world, camera moves over it). */
export const COL = {cx: 700, top: 520, bottom: 1480, w: 250};
export const SPAWN_Y = 450; // notes enter just above the glass mouth
export const G = 4.6; // px / frame² (gravity)
/** Stack height per note; 365 notes fill ~84% of the column. */
export const THICK = ((COL.bottom - COL.top) * 0.84) / DAYS;

/** Launch frame for day d (1-based): 4 slow, clear drops, then an accelerating time-lapse. */
export const launch = (d: number): number => {
	const first = [-14, 16, 38, 56]; // day 1 is mid-fall on frame 0
	if (d <= first.length) return first[d - 1];
	const u = (d - 5) / (DAYS - 5);
	return 70 + 248 * Math.pow(u, 0.55);
};
/** Where day d's note comes to rest (top of the stack under it). */
export const restY = (d: number) => COL.bottom - (d - 1) * THICK - THICK;
export const fallFrames = (d: number) => Math.sqrt((2 * (restY(d) - SPAWN_Y)) / G);
export const landing = (d: number) => launch(d) + fallFrames(d);

export const LANDINGS = Array.from({length: DAYS}, (_, i) => landing(i + 1));
/** Notes landed by frame f (binary search over monotonic landings). */
export const landedBy = (f: number) => {
	let lo = 0;
	let hi = DAYS;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (LANDINGS[mid] <= f) lo = mid + 1;
		else hi = mid;
	}
	return lo;
};

export const FULL = Math.ceil(LANDINGS[DAYS - 1]); // last note lands

export const T = {
	hook2: 20, // "NOBODY NOTICES." rises
	still: 84, // "STILL LOOKS LIKE NOTHING."
	stillOut: 176,
	payoff: FULL, // 365 landed → light bloom, counter settles
	headOut: 372,
	headIn: 379, // overlaps the exit: no empty-header gap
	sign: 404,
	cam: [0, 150, 290, FULL + 8, 420] as const,
};

/** QC beats (absolute frames). */
export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_first_land', Math.ceil(LANDINGS[0]) + 2],
	['a_1s', 30],
	['a_2s', 60],
	['b_still', T.still + 20],
	['b_5s', 150],
	['c_8s', 240],
	['c_10s', 300],
	['c_payoff', T.payoff + 10],
	['d_takeaway', T.headIn + 24],
	['z_last', 449],
];
