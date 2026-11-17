/** Generates iOS launch images into public/splash/ with the local Chromium. Run: npx tsx scripts/generate-splash.ts */
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { SPLASH_SCREENS } from "../src/domain/splash";

const root = path.resolve(__dirname, "..");
const icon = readFileSync(path.join(root, "public/icon-512.png")).toString("base64");
const html = `<!doctype html><html><body style="margin:0;background:#08090A;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,Inter,sans-serif">
<img src="data:image/png;base64,${icon}" style="width:28vw;max-width:128px;border-radius:22%" alt="">
<p style="margin-top:20px;color:#fff;font-weight:800;letter-spacing:-.02em;font-size:22px">LEVEL UP <span style="color:#2BEA7A">2027</span></p></body></html>`;

(async () => {
  mkdirSync(path.join(root, "public/splash"), { recursive: true });
  const browser = await chromium.launch();
  for (const s of SPLASH_SCREENS) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr });
    await page.setContent(html);
    await page.screenshot({ path: path.join(root, `public/splash/${s.name}-portrait.png`) });
    await page.close();
  }
  await browser.close();
  console.log(`Generated ${SPLASH_SCREENS.length} launch images.`);
})();
