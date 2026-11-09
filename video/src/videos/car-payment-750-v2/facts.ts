import {fact} from '../../story/lib/meta';

/**
 * Every number on screen. All figures are the hypothetical example from the
 * creator's locked script — not Gio's personal spending, not an average.
 */
const payment = fact(750, 'hypothetical', 'locked script: "$750 a month for a car"');
const insurance = fact(200, 'hypothetical', 'locked script: "$200 for insurance"');
const gas = fact(200, 'hypothetical', 'locked script: "another $200 for gas"');
const monthly = fact(payment.value + insurance.value + gas.value, 'computed', 'payment + insurance + gas');
const yearly = fact(monthly.value * 12, 'computed', 'monthly × 12 (script: "almost $14,000")');
const half = fact(yearly.value / 2, 'computed', 'yearly ÷ 2 (script: "even half of that money")');

export const FACTS = {payment, insurance, gas, monthly, yearly, half};

// guard rails — fail the build if the example math ever drifts from the narration
if (monthly.value !== 1150) throw new Error('monthly must be $1,150');
if (yearly.value !== 13800) throw new Error('yearly must be $13,800');
if (half.value !== 6900) throw new Error('half must be $6,900');
