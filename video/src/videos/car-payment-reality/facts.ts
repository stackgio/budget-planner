import {fact} from '../../story/lib/meta';

/**
 * Every number on screen. All are the script's illustrative EXAMPLE costs —
 * not Gio's bills and not a national average. Labelled "Example" on screen.
 */
const carPayment = fact(750, 'hypothetical', 'locked script: "$750 a month for a car"');
const insurance = fact(200, 'hypothetical', 'locked script: "$200 for insurance"');
const gas = fact(200, 'hypothetical', 'locked script: "another $200 for gas"');
const monthly = fact(carPayment.value + insurance.value + gas.value, 'computed', 'car payment + insurance + gas');
const yearly = fact(monthly.value * 12, 'computed', 'monthly × 12 (spoken as "almost $14,000 a year")');
const half = fact(monthly.value / 2, 'computed', 'half of the monthly example');

export const FACTS = {carPayment, insurance, gas, monthly, yearly, half};

export const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

if (monthly.value !== 1150 || yearly.value !== 13800 || half.value !== 575) {
	throw new Error('car-payment-reality: example math does not match the script ($1,150 / $13,800 / $575)');
}
