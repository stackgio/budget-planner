/** Friendly emoji for categories and transaction kinds. A user-chosen emoji always wins. */

const BY_NAME: Array<[RegExp, string]> = [
  [/rent|mortgage|housing|apartment/i, "🏠"],
  [/phone|internet|wi-?fi|mobile/i, "📱"],
  [/car payment|auto loan/i, "🚗"],
  [/insurance/i, "🛡️"],
  [/^gas$|fuel|gas station/i, "⛽"],
  [/maintenance|repair/i, "🔧"],
  [/hair|barber|salon|beauty|nails/i, "💇"],
  [/grocer/i, "🛒"],
  [/utilit|electric|water|power/i, "💡"],
  [/health|pharma|medical|doctor|dental/i, "💊"],
  [/coffee|cafe/i, "☕"],
  [/dining|eating|restaurant|food|takeout/i, "🍔"],
  [/entertain|movie|fun|game/i, "🎬"],
  [/shop|clothes|amazon/i, "🛍️"],
  [/subscri|stream/i, "📺"],
  [/gift|birthday/i, "🎁"],
  [/travel|trip|vacation|flight/i, "✈️"],
  [/fee|interest|bank/i, "🏦"],
  [/transport|uber|lyft|transit|bus/i, "🚌"],
  [/pet/i, "🐶"],
  [/gym|fitness|sport/i, "🏋️"],
  [/education|school|book|course/i, "📚"],
  [/paycheck|salary|payroll|wage/i, "💰"],
  [/income|bonus|refund/i, "💵"],
  [/saving/i, "🐷"],
  [/invest/i, "📈"],
  [/debt|loan|credit/i, "💳"],
  [/uncategor|other|misc/i, "📦"],
];

const BY_BUCKET: Record<string, string> = {
  needs: "🧾",
  guiltfree: "🎉",
  goals: "🎯",
  investing: "📈",
  income: "💰",
  transfer: "🔁",
};

export function categoryEmoji(c: { name: string; bucket?: string; emoji?: string | null } | null | undefined): string {
  if (!c) return "📦";
  if (c.emoji && c.emoji.trim()) return c.emoji.trim();
  for (const [re, e] of BY_NAME) if (re.test(c.name)) return e;
  return BY_BUCKET[c.bucket ?? ""] ?? "📦";
}

export function transferEmoji(kind: string | null | undefined): string {
  switch (kind) {
    case "debt_payment":
      return "💳";
    case "investment":
      return "📈";
    case "savings":
      return "🐷";
    default:
      return "🔁";
  }
}

/**
 * Validate a user-entered category emoji: empty → null (use the automatic one),
 * up to 2 symbols and no letters/digits → the emoji, anything else → false.
 */
export function cleanEmoji(input: string): string | null | false {
  const s = input.trim();
  if (!s) return null;
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)];
  if (graphemes.length > 2 || /[A-Za-z0-9]/.test(s)) return false;
  return s;
}
