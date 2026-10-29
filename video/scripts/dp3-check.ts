// Financial + timing checks for DebtPayoff3Things. Usage: npx tsx scripts/dp3-check.ts
import {FUND_GOAL, FUND_TARGET} from '../src/debt-payoff-3/scenes/S2Fund';
import {ALT_PER_WEEK, ALT_TOTAL, PER_WEEK, TOTAL, WEEKS} from '../src/debt-payoff-3/scenes/S6Weeks';
import {AFTER_PAYMENT, AFTER_PURCHASE, PAYMENT, PURCHASE, START} from '../src/debt-payoff-3/scenes/S7Card';
import {PHRASES, SCENES, TOTAL_FRAMES, VO_END} from '../src/debt-payoff-3/timing';
import {count, money} from '../src/debt-payoff-3/ui';
import * as V2 from '../src/debt-payoff-3-v2/numbers';

let fails = 0;
const ok = (cond: boolean, msg: string) => {
	console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
	if (!cond) fails++;
};

// script figures (narration): $500, $1,000, $50, $100, $300, $300
ok(FUND_TARGET === 500 && FUND_GOAL === 1000, `emergency fund meter $0 → ${money(FUND_TARGET)}, goal range ${money(FUND_TARGET)}–${money(FUND_GOAL)}`);
ok(PER_WEEK === 50 && WEEKS === 4 && TOTAL === 200, `${money(PER_WEEK)}/week × ${WEEKS} weeks = ${money(TOTAL)}`);
ok(ALT_PER_WEEK === 100 && ALT_TOTAL === 400, `${money(ALT_PER_WEEK)}/week × ${WEEKS} weeks = ${money(ALT_TOTAL)}`);
ok([1, 2, 3, 4].map((k) => k * PER_WEEK).join() === '50,100,150,200', 'staircase columns read $50, $100, $150, $200');
ok(START === 1000 && PAYMENT === 300 && AFTER_PAYMENT === 700, `${money(START)} − ${money(PAYMENT)} = ${money(AFTER_PAYMENT)}`);
ok(PURCHASE === 300 && AFTER_PURCHASE === 1000 && AFTER_PURCHASE === START, `${money(AFTER_PAYMENT)} + ${money(PURCHASE)} = ${money(AFTER_PURCHASE)} (back to start)`);

// every animated counter must land exactly on its final value and never overshoot
const ranges: [number, number][] = [[0, 500], [7350, 12480], [1000, 700], [700, 1000], [0, 50], [150, 200]];
for (const [a, b] of ranges) {
	const vals = Array.from({length: 40}, (_, i) => count(i, 5, 25, a, b));
	const lo = Math.min(a, b);
	const hi = Math.max(a, b);
	ok(vals[39] === b && vals.every((v) => v >= lo && v <= hi && Number.isInteger(v)), `counter ${money(a)} → ${money(b)} settles exactly, no overshoot`);
}

// timing sanity
ok(PHRASES.every((p, i) => i === 0 || p.start >= PHRASES[i - 1].end), 'narration phrases do not overlap');
ok(TOTAL_FRAMES > VO_END, `video (${(TOTAL_FRAMES / 30).toFixed(2)} s) outlasts the narration (${(VO_END / 30).toFixed(2)} s)`);
const sc = Object.values(SCENES);
ok(sc.every((w, i) => i === 0 || w[0] < sc[i - 1][1]), 'every scene overlaps the previous one (no black gaps)');
ok(sc[sc.length - 1][1] === TOTAL_FRAMES, 'last scene runs to the final frame');

// V2 must tell the same numbers as V1
ok(V2.FUND === FUND_TARGET && V2.FUND_GOAL === FUND_GOAL, 'V2 emergency fund matches V1 ($500, goal $1,000)');
ok(V2.PER_WEEK * V2.WEEKS === TOTAL && V2.ALT_PER_WEEK * V2.WEEKS === ALT_TOTAL, `V2 weekly figures match V1 (+${money(TOTAL)} in 4 weeks, ${money(ALT_TOTAL)} at $100/wk)`);
ok(V2.CARD_START - V2.CARD_PAYMENT === AFTER_PAYMENT && V2.CARD_START - V2.CARD_PAYMENT + V2.CARD_PURCHASE === AFTER_PURCHASE, 'V2 card balance matches V1 ($1,000 → $700 → $1,000)');
ok(V2.HOOK_BALANCE === 12480 && V2.ENDING_BALANCE < V2.HOOK_BALANCE, `V2 ending example balance decreases (${money(V2.HOOK_BALANCE)} → ${money(V2.ENDING_BALANCE)})`);

console.log(fails ? `\n${fails} check(s) failed` : '\nall checks passed');
process.exit(fails ? 1 : 0);
