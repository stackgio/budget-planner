import {fact} from '../../story/lib/meta';

/** Hypothetical example from the creator's script — not Gio's spending, not an average. */
const payment = fact(750, 'hypothetical', 'script: "$750 car payment"');
const insurance = fact(200, 'hypothetical', 'creator brief: "+$200 insurance"');
const gas = fact(200, 'hypothetical', 'creator brief: "+$200 gas"');
const extra = fact(insurance.value + gas.value, 'computed', 'insurance + gas (script: "the extra $400")');
const monthly = fact(payment.value + extra.value, 'computed', 'payment + insurance + gas (script: "$1,150 a month")');
const yearly = fact(monthly.value * 12, 'computed', 'monthly × 12 (script: "$13,800 a year")');

export const FACTS = {payment, insurance, gas, extra, monthly, yearly};

if (extra.value !== 400) throw new Error('extra must be $400');
if (monthly.value !== 1150) throw new Error('monthly must be $1,150');
if (yearly.value !== 13800) throw new Error('yearly must be $13,800');
