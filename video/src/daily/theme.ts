// Stack With Gio — Daily Money Motion design tokens.
// A separate, darker brand system for the 15-second daily series. It shares
// Inter, the brand mark and the motion presets with the story system, but not
// its palettes (those belong to the narrated Editorial Motion videos).
import {theme as base} from '../theme';

export const dmm = {
	width: 1080,
	height: 1920,
	fps: 30,
	/** Every Daily Money Motion video is exactly this long. */
	durationInFrames: 450,
	font: base.font,
	color: {
		bg: '#080D0A', // near black
		ink: '#FFFFFF',
		accent: '#36D979', // emerald
		muted: '#9CA3AF',
		// derived (alpha only — no new hues)
		panel: 'rgba(255,255,255,0.035)',
		panelLine: 'rgba(255,255,255,0.09)',
		grid: 'rgba(255,255,255,0.07)',
		accentSoft: 'rgba(54,217,121,0.16)',
		accentFaint: 'rgba(54,217,121,0.06)',
		mutedSoft: 'rgba(156,163,175,0.18)',
	},
	/** Platform UI safe area (TikTok / Reels / Shorts / FB Reels). */
	safe: {top: 170, bottom: 330, left: 72, right: 120},
	type: {hero: 132, display: 92, h1: 72, h2: 54, body: 34, label: 26, foot: 24},
} as const;

export const SAFE_RECT = {
	x: dmm.safe.left,
	y: dmm.safe.top,
	w: dmm.width - dmm.safe.left - dmm.safe.right,
	h: dmm.height - dmm.safe.top - dmm.safe.bottom,
};

export const usd = (n: number, decimals = 0) =>
	'$' + n.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
