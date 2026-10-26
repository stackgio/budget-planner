/**
 * Renders representative frames of compositions into one contact sheet each,
 * with the platform safe-zone overlay on (if the composition supports it).
 * Bundles once, so checking many compositions is fast.
 *
 *   node scripts/preview-frames.ts DividendMeme:10,52,112,175,290,360 Timeline:20,60,140
 *   node scripts/preview-frames.ts DividendMeme            # 6 evenly spaced frames
 *
 * Output: out/checks/<CompositionId>.jpg
 */
import {spawnSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const targets = process.argv.slice(2);
if (!targets.length) {
	console.error('Usage: node scripts/preview-frames.ts <CompositionId>[:f1,f2,...] ...');
	process.exit(1);
}

const outDir = path.resolve('out/checks');
mkdirSync(outDir, {recursive: true});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;

console.log('Bundling...');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});

for (const target of targets) {
	const [id, list] = target.split(':');
	const inputProps = {showSafeZones: true};
	const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
	const props = {...composition.defaultProps, ...inputProps};
	const last = composition.durationInFrames - 1;
	const frames = list
		? list.split(',').map((f) => Math.min(last, Number(f)))
		: Array.from({length: 6}, (_, i) => Math.round((last * (i + 0.5)) / 6));

	const tmp = path.join(outDir, `.${id}`);
	rmSync(tmp, {recursive: true, force: true});
	mkdirSync(tmp, {recursive: true});
	const files: string[] = [];
	for (const frame of frames) {
		const output = path.join(tmp, `f${String(frame).padStart(4, '0')}.png`);
		await renderStill({serveUrl, composition, frame, output, inputProps: props, browserExecutable});
		files.push(output);
	}

	// Tile into a sheet (3 columns), burning in frame numbers.
	const cols = Math.min(3, files.length);
	const inputs = files.flatMap((f) => ['-i', f]);
	const labeled = files.map((_, i) => `[${i}]scale=360:-1,drawtext=text='f${frames[i]}':x=10:y=10:fontsize=28:fontcolor=yellow:box=1:boxcolor=black[v${i}]`).join(';');
	const layout = files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|');
	const sheet = path.join(outDir, `${id}.jpg`);
	const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', `${labeled};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black[o]`, '-map', '[o]', sheet]);
	if (r.status !== 0) throw new Error(r.stderr.toString());
	rmSync(tmp, {recursive: true, force: true});
	console.log(`${id}: frames ${frames.join(', ')} → ${path.relative(process.cwd(), sheet)}`);
}
