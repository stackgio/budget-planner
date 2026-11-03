/**
 * Illustrative example numbers — computed, not typed in, so every figure on
 * screen is internally consistent. Shown with an "Example" label in the video.
 */
export const EXAMPLE = {
	startBalance: 8400,
	firstPayment: 250,
	apr: 0.229,
	minPayment: 250,
	repair: 480,
	fund: 500,
	extraMonthly: 350, // overtime + cut expenses
	overtime: 200,
	cut: 150,
	sold: 600, // one-time, month 1
};

export const balanceAfterFirst = EXAMPLE.startBalance - EXAMPLE.firstPayment; // 8,150

/** Monthly balances until paid off (interest accrues monthly, then payment). */
export const payoffSchedule = (balance: number, apr: number, payment: number, lumpFirstMonth = 0, maxMonths = 240) => {
	const r = apr / 12;
	const out = [balance];
	let b = balance;
	let interest = 0;
	for (let m = 1; m <= maxMonths && b > 0; m++) {
		const i = b * r;
		interest += i;
		b = b + i - payment - (m === 1 ? lumpFirstMonth : 0);
		out.push(Math.max(0, b));
	}
	return {balances: out, months: out.length - 1, interest};
};

export const minOnly = payoffSchedule(balanceAfterFirst, EXAMPLE.apr, EXAMPLE.minPayment);
export const withExtra = payoffSchedule(balanceAfterFirst, EXAMPLE.apr, EXAMPLE.minPayment + EXAMPLE.extraMonthly, EXAMPLE.sold);
export const monthsSaved = minOnly.months - withExtra.months;
export const interestSaved = minOnly.interest - withExtra.interest;
