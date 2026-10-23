import type { AppData, NeedWant, TxnKind } from './types';
import { OTHER_CATEGORY_ID } from './defaults';

export function normalizeDescription(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Keyword rules, checked in order — more specific rules come first so that
 * "Walmart groceries" lands in Groceries before the generic Walmart → Shopping
 * rule, and "gas bill" lands in Bills before Gas.
 */
const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/\b(gas|electric|electricity|water|power|phone|internet|cable|utility) bill\b|\b(rent|utilities|insurance|internet|verizon|t mobile|at t|comcast|xfinity)\b/, 'bills'],
  [/\b(loan|student loan|car payment|debt|klarna|affirm|afterpay)\b/, 'debt'],
  [/\bgrocer(y|ies)?\b|\b(kroger|aldi|trader joes?|whole foods|safeway|publix|costco|heb|wegmans|food lion|winco|sprouts|meijer|albertsons|supermarket)\b/, 'groceries'],
  [/\b(uber eats|ubereats|doordash|grubhub|postmates)\b/, 'eating-out'],
  [/\b(mcdonalds?|mcd|burger|burger king|wendys|taco|taco bell|chipotle|pizza|dominos|papa johns|kfc|chick fil a|chickfila|popeyes|subway sandwich|panera|sonic|arbys|five guys|in n out|wingstop|panda express|restaurant|diner|sushi|lunch|dinner|breakfast|brunch|takeout|take out|bbq|grill|cafe|bistro|ihop|dennys|applebees|olive garden|chilis)\b/, 'eating-out'],
  [/\b(coffee|starbucks|dunkin|latte|espresso|boba|tea|soda|snacks?|vending|candy|chips|smoothie|juice|energy drink|red bull|monster|ice cream|donuts?|7 eleven|seven eleven)\b/, 'snacks-drinks'],
  [/\b(gas|fuel|shell|exxon|chevron|bp|sunoco|speedway|mobil|marathon|valero|citgo|arco|circle k|quiktrip|qt|wawa|sheetz|petrol)\b/, 'gas'],
  [/\b(uber|lyft|taxi|cab|bus|train|metro|subway|parking|toll|tolls|transit|amtrak|scooter|car wash|oil change|tires?)\b/, 'transportation'],
  [/\b(netflix|spotify|hulu|disney|hbo|max|apple music|icloud|youtube premium|paramount|peacock|subscription|membership|patreon|chatgpt|adobe|xbox game pass|playstation plus|audible|kindle unlimited)\b/, 'subscriptions'],
  [/\b(haircut|hair cut|barber|salon|nails?|manicure|pedicure|spa|massage|cvs|walgreens|pharmacy|toothpaste|shampoo|makeup|cosmetics|skincare|deodorant|gym)\b/, 'personal-care'],
  [/\b(cleaning|paper towels?|toilet paper|detergent|home depot|lowes|ikea|furniture|bed bath|hardware|light bulbs?|trash bags)\b/, 'household'],
  [/\b(movies?|cinema|theater|theatre|concert|tickets?|games?|steam|bowling|arcade|museum|zoo|bar|drinks|beer|club|party|golf)\b/, 'entertainment'],
  [/\b(amazon|target|walmart|best buy|clothes|clothing|shoes|mall|ebay|etsy|shein|temu|old navy|tj maxx|marshalls|nike|apple store|gift|dollar tree|dollar general)\b/, 'shopping'],
];

const KIND_RULES: Array<[RegExp, TxnKind]> = [
  [/\buncle\b/, 'uncle'],
  [/\b(refund|refunded|returned|return)\b/, 'refund'],
  [/\b(credit card|card) (bill|payment)\b|\bpa(y|id|yment)( off)? (my |the )?(visa|mastercard|amex|discover|capital one|chase|citi|credit card|card)\b/, 'cc_payment'],
  [/\b(savings|invest|investing|investment|401k|ira|roth|brokerage|robinhood|fidelity|vanguard|schwab|hysa|emergency fund)\b/, 'savings'],
  [/\b(transfer|transferred|move money|moved money|zelle to me|venmo to bank)\b/, 'transfer'],
];

export interface Suggestion {
  kind: TxnKind;
  categoryId: string;
  needWant: NeedWant | null;
  paymentMethod: string | null;
  /** Where the suggestion came from, for the UI hint. */
  source: 'history' | 'rule' | 'default';
}

function ruleCategory(norm: string): string | null {
  for (const [re, id] of CATEGORY_RULES) if (re.test(norm)) return id;
  return null;
}

export function suggestKind(description: string): TxnKind {
  const norm = normalizeDescription(description);
  for (const [re, kind] of KIND_RULES) if (re.test(norm)) return kind;
  return 'expense';
}

/**
 * Suggest a category (plus kind / needs-wants / payment method) for a new
 * entry. Previous entries win over keyword rules, so a correction the user
 * made once is remembered next time.
 */
export function suggest(data: AppData, description: string): Suggestion {
  const norm = normalizeDescription(description);
  const validCategory = (id: string | null) =>
    !!id && data.categories.some((c) => c.id === id && !c.archived);

  const fallback: Suggestion = {
    kind: suggestKind(description),
    categoryId: OTHER_CATEGORY_ID,
    needWant: null,
    paymentMethod: null,
    source: 'default',
  };
  if (!norm) return fallback;

  // History: exact description match, most recent first.
  const history = data.transactions
    .filter((t) => !t.deletedAt && (t.kind === 'expense' || t.kind === fallback.kind))
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  const exact = history.find((t) => normalizeDescription(t.description) === norm);
  if (exact && validCategory(exact.categoryId)) {
    return {
      kind: exact.kind === 'expense' ? fallback.kind : exact.kind,
      categoryId: exact.categoryId!,
      needWant: exact.needWant,
      paymentMethod: exact.paymentMethod,
      source: 'history',
    };
  }

  const ruled = ruleCategory(norm);
  if (ruled && validCategory(ruled)) return { ...fallback, categoryId: ruled, source: 'rule' };

  // History: same first word (e.g. "chipotle bowl" after "chipotle").
  const first = norm.split(' ')[0];
  if (first.length >= 4) {
    const counts = new Map<string, number>();
    for (const t of history) {
      if (normalizeDescription(t.description).split(' ')[0] === first && validCategory(t.categoryId)) {
        counts.set(t.categoryId!, (counts.get(t.categoryId!) ?? 0) + 1);
      }
    }
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) return { ...fallback, categoryId: best[0], source: 'history' };
  }

  return fallback;
}

/** Distinct recent descriptions for autocomplete, most recent first. */
export function recentDescriptions(data: AppData, query: string, limit = 6): Array<{ description: string; amountCents: number }> {
  const q = normalizeDescription(query);
  const seen = new Set<string>();
  const out: Array<{ description: string; amountCents: number }> = [];
  const sorted = data.transactions
    .filter((t) => !t.deletedAt && t.kind === 'expense')
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  for (const t of sorted) {
    const n = normalizeDescription(t.description);
    if (seen.has(n)) continue;
    if (q && !n.includes(q)) continue;
    seen.add(n);
    out.push({ description: t.description, amountCents: t.amountCents });
    if (out.length >= limit) break;
  }
  return out;
}
