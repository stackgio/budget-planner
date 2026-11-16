import {fact} from '../../story/lib/meta';

/**
 * Every number on screen, with provenance. All figures are illustrative
 * examples from the creator's brief (no personal balances). Derived values
 * are computed here, never typed into a scene.
 */
const goal = fact(10000, 'hypothetical', 'script: "your first $10,000"');
const milestone = fact(1000, 'hypothetical', 'script: "your first $1,000"');
const weekly = fact(100, 'hypothetical', 'script: "$100 a week"');
const smallWeekly = fact(25, 'hypothetical', 'script: "Start with $25"');

export const FACTS = {
	goal,
	milestone,
	weekly,
	smallWeekly,
	weeksPerYear: fact(52, 'computed', 'calendar weeks per year'),
	/** $100 × 52 = $5,200 (script) */
	year1: fact(weekly.value * 52, 'computed', 'weekly × 52, $0 start, no interest'),
	/** $10,000 / $100 = 100 weeks (< 2 years = 104 weeks) */
	weeksToGoal: fact(goal.value / weekly.value, 'computed', 'goal ÷ weekly, $0 start, no interest'),
	/** $25 × 52 = $1,300 in a year */
	smallYear1: fact(smallWeekly.value * 52, 'computed', '$25 × 52'),
	/** first week where $25/week reaches $1,000 */
	smallWeeksTo1k: fact(Math.ceil(milestone.value / smallWeekly.value), 'computed', '$1,000 ÷ $25'),
	/** recurring transfer shown in the automation sheet */
	transfer: fact(100, 'hypothetical', 'brief: TRANSFER $100'),
	/** illustrative last-30-days spending (brief categories; amounts are examples) */
	spend: {
		food: fact(420, 'hypothetical', 'example'),
		subscriptions: fact(85, 'hypothetical', 'example'),
		shopping: fact(260, 'hypothetical', 'example'),
		entertainment: fact(140, 'hypothetical', 'example'),
	},
	cuts: {
		shopping: fact(60, 'hypothetical', 'example: fewer impulse purchases'),
		subscriptions: fact(15, 'hypothetical', 'example: cancel an unused subscription'),
		food: fact(45, 'hypothetical', 'example: reduce unnecessary takeout'),
	},
	extra: fact(200, 'hypothetical', 'brief: illustrative $200 extra-income payment'),
	extraSave: fact(100, 'hypothetical', 'brief: $100 → savings'),
	/** illustrative balance on the goal bar before the extra-income deposit */
	exampleBalance: fact(2400, 'hypothetical', 'example balance for the goal bar (not the creator\'s)'),
};

export const CUT_TOTAL = FACTS.cuts.shopping.value + FACTS.cuts.subscriptions.value + FACTS.cuts.food.value; // 120
export const EXTRA_SPEND = FACTS.extra.value - FACTS.extraSave.value; // 100
export const BAL_AFTER_EXTRA = FACTS.exampleBalance.value + FACTS.extraSave.value; // 2,500

// sanity checks at module load (fail the render if the maths drifts)
if (FACTS.year1.value !== 5200) throw new Error('year1 must be 5200');
if (FACTS.weeksToGoal.value !== 100 || FACTS.weeksToGoal.value >= 104) throw new Error('weeksToGoal must be 100 (< 2 years)');
if (FACTS.smallYear1.value !== 1300) throw new Error('smallYear1 must be 1300');
if (CUT_TOTAL !== 120) throw new Error('cut total');
