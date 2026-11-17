/** iPhone Home Screen launch images (portrait). CSS size × device pixel ratio = image size. */
export const SPLASH_SCREENS = [
  { name: "iphone-se", w: 375, h: 667, dpr: 2 },
  { name: "iphone-8-plus", w: 414, h: 736, dpr: 3 },
  { name: "iphone-x", w: 375, h: 812, dpr: 3 },
  { name: "iphone-xr", w: 414, h: 896, dpr: 2 },
  { name: "iphone-xs-max", w: 414, h: 896, dpr: 3 },
  { name: "iphone-13", w: 390, h: 844, dpr: 3 },
  { name: "iphone-13-pro-max", w: 428, h: 926, dpr: 3 },
  { name: "iphone-15", w: 393, h: 852, dpr: 3 },
  { name: "iphone-15-pro-max", w: 430, h: 932, dpr: 3 },
  { name: "iphone-16-pro", w: 402, h: 874, dpr: 3 },
  { name: "iphone-16-pro-max", w: 440, h: 956, dpr: 3 },
] as const;

export const splashMedia = (s: (typeof SPLASH_SCREENS)[number]) =>
  `(device-width: ${s.w}px) and (device-height: ${s.h}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: portrait)`;
