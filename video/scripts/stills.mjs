// Render many QC stills from one bundle (much faster than `remotion still` per frame).
// Usage: node scripts/stills.mjs <CompositionId> <outDir> name=frame [name=frame ...] [--props=file.json] [--scale=0.5]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync, readFileSync, existsSync} from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const id = args[0];
const out = args[1];
const opts = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const shots = args.slice(2).filter((a) => !a.startsWith('--')).map((a) => a.split('='));
const inputProps = opts.props ? JSON.parse(readFileSync(opts.props, 'utf8')) : {};
mkdirSync(out, {recursive: true});
const browserExecutable =
	process.env.REMOTION_BROWSER_EXECUTABLE ??
	['/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'].find((p) => existsSync(p)) ??
	null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
for (const [name, frame] of shots) {
	const f = Math.min(Number(frame), composition.durationInFrames - 1);
	await renderStill({composition, serveUrl, output: path.join(out, `${name}.png`), frame: f, inputProps, browserExecutable, scale: Number(opts.scale ?? 0.5)});
	console.log('still', name, f);
}
