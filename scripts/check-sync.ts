/**
 * Verifies that a rendered video's audio lines up with narration.json.
 * Detects the pauses in the rendered audio and checks that every gap between
 * narration lines sits inside one. Reports drift per line boundary.
 *
 *   node scripts/check-sync.ts out/dividend-1552.mp4 src/videos/dividend-1552/narration.json
 */
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const TOLERANCE_MS = 60; // ~2 frames at 30 fps

const [video, narrationFile] = process.argv.slice(2);
if (!video || !narrationFile) {
	console.error('Usage: node scripts/check-sync.ts <video.mp4> <narration.json>');
	process.exit(1);
}
const narration = JSON.parse(readFileSync(narrationFile, 'utf8')) as {
	lines: {id: string; startMs: number; endMs: number}[];
};

// ffmpeg prints filter results on stderr.
const {stderr} = spawnSync(
	'ffmpeg',
	['-hide_banner', '-nostats', '-i', video, '-af', 'silencedetect=n=-40dB:d=0.15', '-vn', '-f', 'null', '-'],
	{encoding: 'utf8'},
);
const silences: {start: number; end: number}[] = [];
for (const m of stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)) {
	silences.push({start: Number(m[1]) * 1000, end: Number(m[2]) * 1000});
}

let worst = 0;
let failed = false;
console.log(`Sync check: ${video}`);
for (let i = 0; i < narration.lines.length - 1; i++) {
	const a = narration.lines[i];
	const b = narration.lines[i + 1];
	// The silence that best overlaps the expected gap between line a and line b.
	const s = silences
		.map((x) => ({...x, overlap: Math.min(x.end, b.startMs) - Math.max(x.start, a.endMs)}))
		.sort((x, y) => y.overlap - x.overlap)[0];
	if (!s || s.overlap <= 0) {
		console.log(`  FAIL ${a.id}→${b.id}: no pause found near ${a.endMs}-${b.startMs}ms`);
		failed = true;
		continue;
	}
	const endDrift = Math.round(s.start - a.endMs);
	const startDrift = Math.round(s.end - b.startMs);
	const drift = Math.max(Math.abs(endDrift), Math.abs(startDrift));
	worst = Math.max(worst, drift);
	const status = drift <= TOLERANCE_MS ? 'PASS' : 'FAIL';
	if (status === 'FAIL') failed = true;
	console.log(`  ${status} ${a.id}→${b.id}: line end ${endDrift >= 0 ? '+' : ''}${endDrift}ms, next start ${startDrift >= 0 ? '+' : ''}${startDrift}ms`);
}
console.log(failed ? `Sync FAILED (tolerance ${TOLERANCE_MS}ms)` : `Sync OK, worst drift ${worst}ms (tolerance ${TOLERANCE_MS}ms)`);
process.exit(failed ? 1 : 0);
