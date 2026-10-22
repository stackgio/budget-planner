export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  bg: '#101010',
  white: '#F5F5F5',
  green: '#38D979',
  gray: '#8C8C8C',
  line: '#4A4A4A',
  dim: '#2A2A2A',
  ink: '#0A0A0A',
};

// Important content stays inside x 100–900, y 230–1490 (right rail / caption zones left clear).
export const SAFE = {x0: 100, x1: 900, y0: 230, y1: 1490};
export const CX = (SAFE.x0 + SAFE.x1) / 2; // 500
export const SAFE_W = SAFE.x1 - SAFE.x0; // 800

export const FONT = 'GioDisplay';

export const SIZE = {huge: 132, large: 88, medium: 56, small: 34};

// Illustration stroke widths in screen pixels (non-scaling strokes).
export const SW = {hero: 11, art: 9, mini: 6, panel: 3};
