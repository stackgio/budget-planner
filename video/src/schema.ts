import {z} from 'zod';

/**
 * The spec is the single source of truth for one video. It is produced by
 * scripts/build_spec.py from verified, computed data (scripts/compute.py) plus
 * the creative plan (hook, events, question). Components never invent numbers:
 * every value on screen is read from here.
 */

export const seriesSchema = z.object({
	id: z.string(),
	label: z.string(), // "GameStop"
	ticker: z.string(), // "GME"
	color: z.string().optional(), // overrides theme colour (compare mode)
	logo: z.string().nullable().optional(), // path inside public/, e.g. "logos/gme.png"
	dates: z.array(z.string()), // ISO yyyy-mm-dd, ascending, real trading dates
	values: z.array(z.number()), // portfolio value on each date (USD)
	contributed: z.array(z.number()), // cumulative cash invested on each date
});

export const eventSchema = z.object({
	date: z.string(), // must be one of the series dates (nearest is used)
	title: z.string(), // "Short squeeze"
	subtitle: z.string().optional(), // "Jan 27, 2021 close: $347.51"
	seriesId: z.string().optional(), // which line to anchor to (default: first)
	slowdown: z.number().default(2.5), // time-warp factor around the event
	windowDays: z.number().default(45), // calendar days either side that are slowed
	holdSec: z.number().default(0.6), // freeze time on the event
	zoom: z.number().default(1.18), // camera push-in (1 = none)
	tone: z.enum(['up', 'down', 'neutral']).default('neutral'),
	place: z.enum(['auto', 'above', 'below']).default('auto'), // callout above/below the point when it can't sit beside it
	leadSec: z.number().default(0.67), // how early the push-in starts building before the line reaches the event
});

/** Peak-to-trough marker drawn on the chart (dates are real trading days; label is a verified fact). */
export const drawdownSchema = z.object({
	from: z.string(), // peak date
	to: z.string(), // trough date
	label: z.string(), // "−65.4%"
	sublabel: z.string().optional(), // "Nov 2021 → Oct 2022"
	seriesId: z.string().optional(),
});

/** Speed up (>1) or slow down (<1) calendar time between two dates. */
export const paceSchema = z.object({from: z.string(), to: z.string(), speed: z.number().min(0.2).max(5)});

export const statSchema = z.object({
	label: z.string(),
	value: z.string(), // pre-formatted, verified by compute.py
	tone: z.enum(['up', 'down', 'neutral']).default('neutral'),
});

export const specSchema = z.object({
	slug: z.string(),
	durationSec: z.number().min(8).max(90).default(23),
	background: z.enum(['white', 'offwhite']).default('white'),
	colorMode: z.enum(['gainloss', 'series']).default('gainloss'),
	yScale: z.enum(['linear', 'log']).default('linear'),
	/** If true the y-axis grows with the line (dramatic); if false it is fixed to the full range. */
	dynamicY: z.boolean().default(true),
	hook: z.object({
		lines: z.array(z.string()).min(1).max(3), // big opening text, line by line
		highlight: z.string().optional(), // substring rendered in accent colour
		kicker: z.string().optional(), // small label above, e.g. "WHAT IF..."
		hero: z.number().int().min(0).optional(), // index of the line shown as the dominant, oversized element
	}),
	counterLabel: z.string().default('Your investment'),
	/** Optional age clock, e.g. "invested the day you were born": age on the start date. */
	age: z.object({start: z.number().min(0).max(110), label: z.string().default('AGE')}).optional(),
	series: z.array(seriesSchema).min(1).max(4),
	events: z.array(eventSchema).default([]),
	drawdowns: z.array(drawdownSchema).max(2).default([]),
	pace: z.array(paceSchema).default([]),
	result: z.object({
		kicker: z.string().default('TODAY'),
		value: z.string().optional(), // final-value reveal, shown oversized; the counter steps aside for it
		headline: z.string().optional(), // verdict line, e.g. "41x your money" (counter already shows the value)
		headlineTone: z.enum(['up', 'down', 'neutral']).default('up'),
		subline: z.string().optional(), // "from $10,000 in Jan 2016"
		stats: z.array(statSchema).max(4).default([]),
	}),
	question: z.string(),
	footnote: z.string(), // data source + assumptions, always shown small
	brand: z.string().default('STACK WITH GIO'),
	timing: z
		.object({
			drawStartSec: z.number().default(0.5),
			resultSec: z.number().optional(), // when the result card arrives (default: duration - 7)
			questionSec: z.number().optional(), // when the question arrives (default: duration - 3.4)
			landBeatSec: z.number().default(0.6), // pause between the line landing and the result card
			hideBeforeRevealSec: z.number().default(0), // counter + value tag fade out this long before landing
		})
		.default({}),
});

export type Spec = z.infer<typeof specSchema>;
export type SeriesSpec = z.infer<typeof seriesSchema>;
export type EventSpec = z.infer<typeof eventSchema>;
export type DrawdownSpec = z.infer<typeof drawdownSchema>;
