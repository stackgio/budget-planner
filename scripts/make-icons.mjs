// Renders public/icon.svg to the PNG sizes iOS and Android need.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
const out = [
  ['apple-touch-icon.png', 180, false],
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-512-maskable.png', 512, true],
];
for (const [name, size, maskable] of out) {
  await page.setViewportSize({ width: size, height: size });
  // iOS rounds corners itself, and maskable icons need full-bleed backgrounds.
  const body = maskable || name.startsWith('apple')
    ? svg.replace('rx="112" fill="#101214"', 'fill="#3ddc84"').replace('<rect x="56" y="56" width="400" height="400" rx="96" fill="#3ddc84"/>', '')
    : svg;
  await page.setContent(`<html><body style="margin:0;background:transparent">${body.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: !maskable && !name.startsWith('apple'), clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log('icons written');
