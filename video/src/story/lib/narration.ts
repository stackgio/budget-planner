import {z} from 'zod';

/**
 * Narration timing model.
 *
 * Every story video is written as script lines with ids. Scenes and animations
 * never hard-code seconds: they ask for cues ("line L3, word 'car'"), which are
 * resolved from one of three sources, best first:
 *
 *   'aligned'      word timestamps from a real recording or ElevenLabs
 *                  (exact sync)
 *   'audio-scaled' audio present but no timestamps: estimated timings are
 *                  stretched to the real audio length (approximate, not final)
 *   'temp'         no audio: estimated timings (TEMPORARY markers only)
 */

export const wordSchema = z.object({text: z.string(), start: z.number(), end: z.number()});
export const lineTimingSchema = z.object({
	id: z.string(),
	text: z.string(),
	start: z.number(),
	end: z.number(),
	words: z.array(wordSchema),
});
export const narrationSchema = z.object({
	source: z.enum(['temp', 'audio-scaled', 'aligned']),
	durationSec: z.number(),
	lines: z.array(lineTimingSchema),
});
export type Word = z.infer<typeof wordSchema>;
export type LineTiming = z.infer<typeof lineTimingSchema>;
export type Narration = z.infer<typeof narrationSchema>;

export type ScriptLine = {id: string; text: string; /** extra silence after the line (sec) */ pauseAfter?: number};

const syllables = (w: string) => {
	const s = w.toLowerCase().replace(/[^a-z]/g, '');
	if (!s) return 1;
	const groups = s.replace(/e$/, '').match(/[aeiouy]+/g);
	return Math.max(1, groups ? groups.length : 1);
};

export const tokenize = (text: string) => text.split(/\s+/).filter(Boolean);
export const norm = (w: string) => w.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']/g, '');

/**
 * Estimated narration (~165 wpm, syllable-weighted, punctuation pauses).
 * These are placeholders for layout and pacing — never final sync.
 */
export const estimateNarration = (script: ScriptLine[], opts: {startSec?: number; rate?: number} = {}): Narration => {
	const rate = opts.rate ?? 1;
	let t = opts.startSec ?? 0.15;
	const lines: LineTiming[] = script.map((ln) => {
		const words: Word[] = [];
		const start = t;
		for (const raw of tokenize(ln.text)) {
			const dur = (0.16 + 0.125 * syllables(raw)) / rate;
			words.push({text: raw, start: t, end: t + dur});
			t += dur;
			if (/[.!?]$/.test(raw)) t += 0.32 / rate;
			else if (/[:;]$/.test(raw)) t += 0.24 / rate;
			else if (/[,]$/.test(raw)) t += 0.14 / rate;
		}
		const end = words[words.length - 1].end;
		t += 0.12 + (ln.pauseAfter ?? 0);
		return {id: ln.id, text: ln.text, start, end, words};
	});
	return {source: 'temp', durationSec: t, lines};
};

/** Stretch an estimate onto a real audio length (keeps relative pacing). */
export const scaleNarration = (n: Narration, audioSec: number): Narration => {
	const k = audioSec / n.durationSec;
	const s = (x: number) => x * k;
	return {
		source: 'audio-scaled',
		durationSec: audioSec,
		lines: n.lines.map((l) => ({...l, start: s(l.start), end: s(l.end), words: l.words.map((w) => ({...w, start: s(w.start), end: s(w.end)}))})),
	};
};

/** Accepts {words:[{text,start,end}]} (ElevenLabs forced alignment / generic) or ElevenLabs TTS character alignment. */
export const wordsFromAlignmentJson = (json: unknown): Word[] => {
	const j = json as Record<string, unknown>;
	if (Array.isArray(j.words)) return (j.words as Word[]).map((w) => ({text: String(w.text), start: Number(w.start), end: Number(w.end)}));
	const a = (j.normalized_alignment ?? j.alignment ?? j) as {
		characters?: string[];
		character_start_times_seconds?: number[];
		character_end_times_seconds?: number[];
	};
	if (!a.characters || !a.character_start_times_seconds || !a.character_end_times_seconds) {
		throw new Error('Alignment JSON must contain "words" or ElevenLabs "alignment.characters" timings');
	}
	const out: Word[] = [];
	let cur: Word | null = null;
	a.characters.forEach((ch, i) => {
		if (/\s/.test(ch)) {
			if (cur) out.push(cur);
			cur = null;
			return;
		}
		if (!cur) cur = {text: '', start: a.character_start_times_seconds![i], end: a.character_end_times_seconds![i]};
		cur.text += ch;
		cur.end = a.character_end_times_seconds![i];
	});
	if (cur) out.push(cur);
	return out;
};

/** Map aligned words onto script lines in order (tolerant of small wording differences). */
export const narrationFromWords = (script: ScriptLine[], words: Word[], audioSec?: number): Narration => {
	const spoken = words.filter((w) => norm(w.text));
	let k = 0;
	const lines: LineTiming[] = script.map((ln) => {
		const toks = tokenize(ln.text);
		const out: Word[] = [];
		for (const tok of toks) {
			// look ahead a few words for a match; fall back to the next spoken word
			let m = -1;
			for (let j = k; j < Math.min(spoken.length, k + 4); j++) if (norm(spoken[j].text) === norm(tok)) { m = j; break; }
			const w = spoken[m >= 0 ? m : Math.min(k, spoken.length - 1)];
			out.push({text: tok, start: w.start, end: w.end});
			k = (m >= 0 ? m : k) + 1;
		}
		return {id: ln.id, text: ln.text, start: out[0].start, end: out[out.length - 1].end, words: out};
	});
	const last = lines[lines.length - 1].end;
	return {source: 'aligned', durationSec: Math.max(audioSec ?? 0, last), lines};
};

/** Cue lookup: seconds of a line's start, or of a word inside it (matched by text or index). */
export const cueSec = (n: Narration, lineId: string, word?: string | number, edge: 'start' | 'end' = 'start') => {
	const ln = n.lines.find((l) => l.id === lineId);
	if (!ln) throw new Error(`Unknown narration line "${lineId}"`);
	if (word === undefined) return edge === 'start' ? ln.start : ln.end;
	let w: Word | undefined;
	if (typeof word === 'number') w = ln.words[word < 0 ? ln.words.length + word : word];
	else {
		const target = tokenize(word).map(norm);
		const idx = ln.words.findIndex((_, i) => target.every((t, k) => ln.words[i + k] && norm(ln.words[i + k].text) === t));
		w = ln.words[idx];
	}
	if (!w) throw new Error(`Word "${word}" not found in line ${lineId}`);
	return edge === 'start' ? w.start : w.end;
};
