// Timing + QC plan for any /motion video.
// Usage: npx tsx scripts/motion/report.ts <slug> [props.json]  → JSON on stdout
// Resolves narration exactly like the composition does:
//   alignment → 'aligned'; voiceAudio only → 'audio-scaled'; nothing → 'temp'.
import {execFileSync} from 'child_process';
import {existsSync, readFileSync} from 'fs';
import path from 'path';
import {pathToFileURL} from 'url';
import {alignmentReport, cueSec, estimateNarration, narrationFromWords, scaleNarration, wordsFromAlignmentJson, type ScriptLine} from '../../src/story/lib/narration';
import {buildSceneWindows, type SceneDef} from '../../src/story/lib/sceneTimeline';

const fps = 30;
const [slug, propsFile] = process.argv.slice(2);
if (!slug) throw new Error('usage: report.ts <slug> [props.json]');
const dir = path.resolve('src/videos', slug);

const main = async () => {
	const mod = await import(pathToFileURL(path.join(dir, 'script.ts')).href);
	const SCRIPT: ScriptLine[] = mod.SCRIPT;
	const SCENES: SceneDef[] = mod.SCENES;
	const TAIL_SEC: number = mod.TAIL_SEC;
	const META = mod.META ?? null;
	const props = propsFile ? JSON.parse(readFileSync(propsFile, 'utf8')) : {};
	const audioSec = props.voiceAudio
		? Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `public/${props.voiceAudio}`]).toString().trim())
		: undefined;
	let alignment = null;
	let narration;
	if (props.alignment) {
		const words = wordsFromAlignmentJson(JSON.parse(readFileSync(`public/${props.alignment}`, 'utf8')));
		alignment = alignmentReport(SCRIPT, words);
		narration = narrationFromWords(SCRIPT, words, audioSec);
	} else {
		const est = estimateNarration(SCRIPT, {rate: props.tempRate ?? 1.1});
		narration = audioSec ? scaleNarration(est, audioSec) : est;
	}
	const built = buildSceneWindows(SCENES, narration, fps, {tailSec: TAIL_SEC});
	const durationInFrames = Math.max(built.durationInFrames, Math.ceil(narration.durationSec * fps));
	const windows = built.windows;
	const f = (line: string, word?: string, off = 0) => Math.round((cueSec(narration, line, word) + off) * fps);
	const clampF = (x: number) => Math.max(0, Math.min(durationInFrames - 1, x));
	const qc: [string, number][] = [
		['a_frame0', 0],
		['a_0.3s', 9],
		['a_1s', 30],
		['a_2s', 60],
	];
	windows.forEach((w, i) => {
		if (i > 0) qc.push([`t${i}_${w.id}_transition`, w.boundary]);
		qc.push([`s${i + 1}_${w.id}_mid`, Math.round((Math.max(w.boundary, w.start) + w.end) / 2)]);
	});
	for (const l of narration.lines) qc.push([`l_${l.id}`, Math.round((l.start + Math.min(0.5, (l.end - l.start) / 2)) * fps)]);
	const custom = path.join(dir, 'qc.ts');
	if (existsSync(custom)) {
		const q = await import(pathToFileURL(custom).href);
		try {
			for (const [n, fr] of q.qcBeats(f, windows)) qc.push([`c_${n}`, fr]);
		} catch (e) {
			console.error('qc.ts beats failed:', (e as Error).message);
		}
	}
	qc.push(['z_last', durationInFrames - 1]);
	const seen = new Set<string>();
	const beats = qc
		.map(([n, fr]) => [n.replace(/[^A-Za-z0-9_.-]/g, '_'), clampF(fr)] as [string, number])
		.filter(([n]) => (seen.has(n) ? false : (seen.add(n), true)))
		.sort((a, b) => a[1] - b[1]);
	const out = {
		slug,
		meta: META,
		source: narration.source,
		audioSec: audioSec ?? null,
		durationInFrames,
		durationSec: +(durationInFrames / fps).toFixed(3),
		alignment,
		windows,
		lines: narration.lines.map((l) => ({id: l.id, start: +l.start.toFixed(2), end: +l.end.toFixed(2), text: l.text})),
		qc: beats,
	};
	console.log(JSON.stringify(out, null, 1));
};
main();
