// Builds the claude.ai Artifact version: one self-contained HTML file with
// the app's JS and CSS inlined and account storage switched on.
// Usage: node scripts/build-artifact.mjs [out.html]
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';

const outDir = 'dist-artifact';
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', outDir, '--emptyOutDir'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_TARGET: 'artifact' },
});
const assets = readdirSync(`${outDir}/assets`);
const js = readFileSync(`${outDir}/assets/${assets.find((f) => f.endsWith('.js'))}`, 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(`${outDir}/assets/${assets.find((f) => f.endsWith('.css'))}`, 'utf8').replace(/<\/style/gi, '<\\/style');
rmSync(outDir, { recursive: true, force: true });

const html = `<title>Spend Smarter</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#101214">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
const out = process.argv[2] ?? 'spend-smarter.html';
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
