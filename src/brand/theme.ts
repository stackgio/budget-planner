// Stack With Gio brand tokens. Every component reads from here so a palette or
// type change is one edit.

export const colors = {
	// Matte black family
	black: '#0A0A0B',
	matte: '#111113',
	surface: '#18181B',
	raised: '#222226',
	line: '#2C2C31',
	// Whites
	white: '#F6F6F2',
	muted: '#A1A1A8',
	dim: '#6B6B73',
	// Brand green
	green: '#2EE07A',
	greenSoft: '#7CF2AE',
	greenDeep: '#0E7A41',
	// Supporting (use sparingly: debt, warnings, highlights)
	red: '#FF5A5F',
	amber: '#FFC24B',
	blue: '#5AA9FF',
} as const;

export const fonts = {
	display: 'Inter Display, Inter, system-ui, sans-serif',
	body: 'Inter, system-ui, sans-serif',
} as const;

export const VIDEO = {width: 1080, height: 1920, fps: 30} as const;

// Platform-safe area for 1080x1920. Covers TikTok / Reels / Shorts UI: top bar,
// right action rail, bottom caption + username block.
export const SAFE = {
	top: 230,
	bottom: 420,
	left: 80,
	right: 170,
} as const;

// Widest centered box that stays inside SAFE on both sides.
export const SAFE_CENTER_WIDTH = 2 * Math.min(VIDEO.width / 2 - SAFE.left, VIDEO.width / 2 - SAFE.right);

export const type = {
	headline: 96,
	subhead: 56,
	body: 44,
	caption: 64,
	label: 34,
} as const;

export const shadows = {
	card: '0 30px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)',
	glowGreen: `0 0 60px ${colors.green}55`,
} as const;
