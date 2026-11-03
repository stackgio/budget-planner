// Stack With Gio — story-video design system (V4).
// Three complementary looks that share one type system and one green:
//   editorial  — warm cream paper, ink type, purposeful green (explainers)
//   cinematic  — matte charcoal, controlled green light (data + drama)
//   Marcus     — the recurring white stickman with a backward black cap (both looks)
import {theme as base} from '../theme';

export type Palette = {
	name: 'editorial' | 'cinematic';
	bg: string;
	bg2: string;
	paper: string; // cards / panels
	ink: string; // headline text
	body: string;
	muted: string;
	line: string; // hairlines, tracks
	accent: string; // brand green
	accentDeep: string;
	accentSoft: string;
	danger: string;
	dangerSoft: string;
	gold: string;
	shadow: string;
};

export const editorial: Palette = {
	name: 'editorial',
	bg: '#F5F0E6',
	bg2: '#ECE5D6',
	paper: '#FFFDF8',
	ink: '#121316',
	body: '#2B2F36',
	muted: '#857D6E',
	line: '#E0D8C7',
	accent: '#1E9E57',
	accentDeep: '#13703C',
	accentSoft: 'rgba(30,158,87,0.14)',
	danger: '#D9472F',
	dangerSoft: 'rgba(217,71,47,0.12)',
	gold: '#E2A72E',
	shadow: 'rgba(60,45,20,0.18)',
};

export const cinematic: Palette = {
	name: 'cinematic',
	bg: '#0B0C0E',
	bg2: '#15171B',
	paper: '#1B1E23',
	ink: '#F5F2EA',
	body: '#C7CBD2',
	muted: '#7C828B',
	line: '#2A2E35',
	accent: '#2CD47A',
	accentDeep: '#1E9E57',
	accentSoft: 'rgba(44,212,122,0.16)',
	danger: '#FF5B48',
	dangerSoft: 'rgba(255,91,72,0.14)',
	gold: '#F0B64A',
	shadow: 'rgba(0,0,0,0.55)',
};

export const story = {
	width: base.width,
	height: base.height,
	fps: base.fps,
	font: base.font,
	safe: base.safe,
	/** Captions live in this band; scene content stays above `contentBottom`. */
	captionTop: 1430,
	contentBottom: 1390,
	ground: 1340, // default floor line for Marcus
	marcus: {body: '#FFFFFF', outline: '#121316', cap: '#141518'},
	type: {
		mega: 220,
		display: 112,
		h1: 84,
		h2: 60,
		label: 30,
		small: 24,
	},
} as const;
