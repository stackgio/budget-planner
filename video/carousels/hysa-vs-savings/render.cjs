// Renders each .slide in index.html to out/slide-N.png (1080x1350, 4:5).
// Usage: node render.cjs [scale]   (scale 2 = 2160x2700 for extra-crisp uploads)
const {chromium} = require('playwright');
const path = require('path');

(async () => {
	const scale = Number(process.argv[2] || 1);
	const browser = await chromium.launch();
	const page = await browser.newPage({viewport: {width: 1200, height: 1500}, deviceScaleFactor: scale});
	await page.goto('file://' + path.join(__dirname, 'index.html'));
	await page.evaluate(() => document.fonts.ready);
	const slides = await page.$$('.slide');
	for (let i = 0; i < slides.length; i++) {
		await slides[i].screenshot({path: path.join(__dirname, 'out', `slide-${i + 1}.png`)});
	}
	console.log(`rendered ${slides.length} slides at ${scale}x`);
	await browser.close();
})();
