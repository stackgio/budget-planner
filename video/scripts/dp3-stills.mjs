// Render QC stills for the DebtPayoff3Things composition with one bundle.
// Usage: node scripts/dp3-stills.mjs <outDir> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const inputProps = {voiceover: null, draft: false};
const composition = await selectComposition({serveUrl, id: 'DebtPayoff3Things', browserExecutable, inputProps});
for (const f of frames.map(Number)) {
	await renderStill({serveUrl, composition, frame: f, inputProps, output: path.join(outDir, `f${String(f).padStart(4, '0')}.png`), browserExecutable});
	process.stdout.write(`${f} `);
}
console.log('done');
