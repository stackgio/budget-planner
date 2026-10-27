// Prints the exact frame plan for a spec so QC can grab the right frames from the MP4.
// Usage: npx tsx scripts/timeline-report.ts projects/<slug>/spec.json
import {readFileSync} from 'node:fs';
import {specSchema} from '../src/schema';
import {buildTimeline, valueAt} from '../src/lib/timeline';

const spec = specSchema.parse(JSON.parse(readFileSync(process.argv[2], 'utf8')));
const fps = 30;
const tl = buildTimeline(spec, fps);
const at = (f: number) => {
	const p = tl.progress[Math.min(f, tl.durationInFrames - 1)];
	const i = Math.round(p);
	return {
		date: spec.series[0].dates[i],
		values: spec.series.map((s) => `${s.id}=$${Math.round(valueAt(s.values, p)).toLocaleString('en-US')}`).join(' '),
	};
};
const marks: {name: string; frame: number}[] = [
	{name: 'first_frame', frame: 0},
	{name: 'hook_0.3s', frame: 9},
	{name: 'draw_start', frame: tl.drawStart},
	{name: 'at_1s', frame: 30},
	{name: 'at_2s', frame: 60},
	...tl.events.map((e, k) => ({name: `event${k + 1}_hold`, frame: Math.min(tl.durationInFrames - 1, e.frame + Math.max(1, Math.floor((e.holdEnd - e.frame) / 2)))})),
	{name: 'draw_end', frame: tl.drawEnd},
	{name: 'result_card', frame: tl.resultFrame + 24},
	{name: 'question', frame: Math.min(tl.durationInFrames - 1, tl.questionFrame + 20)},
	{name: 'last_frame', frame: tl.durationInFrames - 1},
];
console.log(JSON.stringify({
	durationInFrames: tl.durationInFrames,
	durationSec: tl.durationInFrames / fps,
	marks: marks.map((m) => ({...m, t: +(m.frame / fps).toFixed(3), ...at(m.frame)})),
	final: spec.series.map((s) => ({id: s.id, finalValue: s.values[s.values.length - 1], lastDate: s.dates[s.dates.length - 1]})),
}, null, 1));
