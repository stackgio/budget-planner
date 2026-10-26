/**
 * Builds src/videos/<id>/narration.json, the single timing source for a video.
 *
 * Inputs (pick one):
 *   --alignment <file.json>  ElevenLabs /v1/text-to-speech/{voice}/with-timestamps
 *                            response (or our placeholder file in the same shape).
 *                            If it contains audio_base64, the audio is written too.
 *   --transcript <file.json> ElevenLabs Speech-to-Text (Scribe) transcript of the
 *                            narration file. Word-level and exact.
 *   --srt <file.srt>         ElevenLabs Studio / any SRT export. Word times inside
 *                            a cue are estimated.
 *
 * Other flags:
 *   --video <id>             Video folder name, e.g. dividend-1552 (required)
 *   --audio <public path>    Audio path relative to public/ (default videos/<id>/narration.mp3|wav)
 *   --script <file.txt>      Script with one line per cue, used to split words into
 *                            lines L1..Ln when the alignment has no "lines".
 *
 * Usage:
 *   node scripts/align-narration.ts --video dividend-1552 \
 *     --alignment public/videos/dividend-1552/alignment.json
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {parseSrt} from '@remotion/captions';
import {elevenLabsTranscriptToCaptions} from '@remotion/elevenlabs';

type Word = {
	text: string;
	startMs: number;
	endMs: number;
	timestampMs: number | null;
	confidence: number | null;
};
type Line = {id: string; text: string; startMs: number; endMs: number};

const {values: args} = parseArgs({
	options: {
		video: {type: 'string'},
		alignment: {type: 'string'},
		srt: {type: 'string'},
		transcript: {type: 'string'},
		audio: {type: 'string'},
		script: {type: 'string'},
	},
});

if (!args.video || (!args.alignment && !args.srt && !args.transcript)) {
	console.error('Usage: --video <id> (--alignment <json> | --transcript <json> | --srt <file>) [--audio <path>] [--script <txt>]');
	process.exit(1);
}

const videoId = args.video;
const publicDir = path.join('public', 'videos', videoId);
const srcDir = path.join('src', 'videos', videoId);
const scriptPath = args.script ?? path.join(srcDir, 'script.txt');

const readScriptLines = (): string[] | null =>
	existsSync(scriptPath)
		? readFileSync(scriptPath, 'utf8')
				.split('\n')
				.map((l) => l.trim())
				.filter((l) => l && !l.startsWith('#'))
		: null;

const wordsFromAlignment = (a: {
	characters: string[];
	character_start_times_seconds: number[];
	character_end_times_seconds: number[];
}): Word[] => {
	const words: Word[] = [];
	let current: {text: string; start: number; end: number} | null = null;
	a.characters.forEach((c, i) => {
		if (/\s/.test(c)) {
			if (current) words.push(toWord(current));
			current = null;
			return;
		}
		const start = a.character_start_times_seconds[i];
		const end = a.character_end_times_seconds[i];
		if (!current) current = {text: c, start, end};
		else {
			current.text += c;
			current.end = end;
		}
	});
	if (current) words.push(toWord(current));
	return words;
};

const toWord = (w: {text: string; start: number; end: number}): Word => ({
	// Leading space per Remotion caption convention (whitespace-sensitive).
	text: ` ${w.text}`,
	startMs: Math.round(w.start * 1000),
	endMs: Math.round(w.end * 1000),
	timestampMs: Math.round(((w.start + w.end) / 2) * 1000),
	confidence: null,
});

// Split each SRT cue into words with proportional timing.
const wordsFromSrt = (file: string): Word[] => {
	const {captions} = parseSrt({input: readFileSync(file, 'utf8')});
	return captions.flatMap((cue) => {
		const tokens = cue.text.trim().split(/\s+/).filter(Boolean);
		const total = tokens.reduce((s, t) => s + t.length, 0);
		let t = cue.startMs;
		return tokens.map((tok) => {
			const d = ((cue.endMs - cue.startMs) * tok.length) / total;
			const w = toWord({text: tok, start: t / 1000, end: (t + d) / 1000});
			t += d;
			return w;
		});
	});
};

// Group words into lines: script rows first, sentence punctuation as fallback.
const linesFromWords = (words: Word[]): Line[] => {
	const scriptLines = readScriptLines();
	const groups: Word[][] = [];
	if (scriptLines) {
		let i = 0;
		for (const row of scriptLines) {
			const n = row.split(/\s+/).filter(Boolean).length;
			groups.push(words.slice(i, i + n));
			i += n;
		}
		if (i !== words.length) {
			console.warn(`Script has ${i} words but narration has ${words.length}. Check that script.txt matches the audio.`);
		}
	} else {
		let g: Word[] = [];
		for (const w of words) {
			g.push(w);
			if (/[.!?]$/.test(w.text)) {
				groups.push(g);
				g = [];
			}
		}
		if (g.length) groups.push(g);
	}
	return groups
		.filter((g) => g.length)
		.map((g, i) => ({
			id: `L${i + 1}`,
			text: g.map((w) => w.text).join('').trim(),
			startMs: g[0].startMs,
			endMs: g[g.length - 1].endMs,
		}));
};

let words: Word[];
let lines: Line[] | null = null;
let source = 'srt';

if (args.alignment) {
	const raw = JSON.parse(readFileSync(args.alignment, 'utf8'));
	source = raw.source ?? 'elevenlabs-alignment';
	words = wordsFromAlignment(raw.alignment ?? raw.normalized_alignment ?? raw);
	if (raw.audio_base64) {
		const out = path.join(publicDir, 'narration.mp3');
		writeFileSync(out, Buffer.from(raw.audio_base64, 'base64'));
		console.log(`Wrote ${out}`);
	}
	if (Array.isArray(raw.lines)) {
		// Placeholder files carry exact line bounds; keep them, but re-derive text from words.
		lines = raw.lines;
	}
} else if (args.transcript) {
	source = 'elevenlabs-stt';
	const {captions} = elevenLabsTranscriptToCaptions({transcript: JSON.parse(readFileSync(args.transcript, 'utf8'))});
	words = captions
		.filter((c) => c.text.trim())
		.map((c) => ({...c, text: ` ${c.text.trim()}`}));
} else {
	words = wordsFromSrt(args.srt!);
}

lines ??= linesFromWords(words);

const audio =
	args.audio ??
	['narration.mp3', 'narration.wav'].map((f) => `videos/${videoId}/${f}`).find((p) => existsSync(path.join('public', p)));
if (!audio) {
	console.error(`No audio found in ${publicDir}. Pass --audio.`);
	process.exit(1);
}

const durationMs = Math.round(
	Number(
		execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join('public', audio)])
			.toString()
			.trim(),
	) * 1000,
);

const narration = {source, audio, durationMs, lines, words};
const outFile = path.join(srcDir, 'narration.json');
writeFileSync(outFile, JSON.stringify(narration, null, 2) + '\n');
console.log(`Wrote ${outFile}: ${words.length} words, ${lines.length} lines, ${durationMs}ms (${source})`);
for (const l of lines) console.log(`  ${l.id} ${l.startMs}-${l.endMs}  ${l.text}`);
