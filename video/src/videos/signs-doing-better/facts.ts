import {fact} from '../../story/lib/meta';

/** Every on-screen number. All are illustrative examples (labelled on screen) or derived. */
export const FACTS = {
	deposit: fact(5, 'hypothetical', 'Script: "even if it’s just five dollars at a time"'),
	deposits: fact(12, 'hypothetical', 'Animation length: 12 example deposits (contributions only, no returns)'),
	cardBalance: fact(1000, 'hypothetical', 'Creator brief: illustrative $1,000 balance'),
	apr: fact(24, 'hypothetical', 'Creator brief: illustrative 24% APR (not a national average)'),
	fundGoal: fact(1000, 'hypothetical', 'Script: "a thousand dollars" — example goal, not a recommendation'),
	fundSaved: fact(500, 'hypothetical', 'Example progress: $0 → $100 → $250 → $500'),
	repair: fact(300, 'hypothetical', 'Creator brief: hypothetical $300 car repair'),
	startAge: fact(21, 'personal', 'Creator script: "I didn’t start taking my finances seriously until I was 21"'),
};

export const MILESTONES = [0, 100, 250, 500, 1000];
/** contributions after n deposits (no growth modelled) */
export const contributions = (n: number) => n * FACTS.deposit.value;
/** simplified first-month interest: balance × APR ÷ 12 */
export const monthlyInterest = (FACTS.cardBalance.value * (FACTS.apr.value / 100)) / 12; // = 20
export const fundAfterRepair = FACTS.fundSaved.value - FACTS.repair.value; // = 200
