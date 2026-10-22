// Frame-accurate renderer: drives index.html's renderAt(t) in headless Chromium
// and pipes PNG frames into ffmpeg.
//   node render.js frames out.mp4          -> silent video (30 fps)
//   node render.js stills outdir 0 9.9 ... -> PNGs at given times
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const FPS = 30;
const [mode, out, ...rest] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(__dirname, "index.html"));
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => window.DURATION);
  const shot = () => page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1080, height: 1920 } });

  if (mode === "stills") {
    for (const t of rest.map(Number)) {
      await page.evaluate(t => window.renderAt(t), t);
      require("fs").writeFileSync(path.join(out, `t${t.toFixed(2).padStart(5, "0")}.png`), await shot());
    }
  } else {
    const n = Math.ceil(dur * FPS);
    const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", out], { stdio: ["pipe", "inherit", "inherit"] });
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.renderAt(t), i / FPS);
      const buf = await shot();
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      if (i % 60 === 0) process.stderr.write(`frame ${i}/${n}\n`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on("close", r));
  }
  await browser.close();
})();
