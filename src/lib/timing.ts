import type {Caption} from '@remotion/captions';

// Shape of src/videos/<id>/narration.json (written by scripts/align-narration.ts).
export type NarrationLine = {id: string; text: string; startMs: number; endMs: number};
export type Narration = {
	source: string;
	audio: string;
	durationMs: number;
	lines: NarrationLine[];
	words: Caption[];
};

export const msToFrames = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9$']/g, '');

/**
 * Frame-accurate cue lookup into the narration. Scenes ask for cues by line id
 * or spoken word, so re-recording the voiceover re-times the whole video.
 */
export const makeCues = (narration: Narration, fps: number) => {
	const toF = (ms: number) => msToFrames(ms, fps);

	const line = (id: string) => {
		const l = narration.lines.find((x) => x.id === id);
		if (!l) throw new Error(`Narration has no line "${id}"`);
		return {from: toF(l.startMs), to: toF(l.endMs), duration: toF(l.endMs) - toF(l.startMs)};
	};

	/** First occurrence of `text` (optionally inside line `inLine`). */
	const word = (text: string, inLine?: string) => {
		const bounds = inLine ? narration.lines.find((l) => l.id === inLine) : undefined;
		const w = narration.words.find(
			(x) =>
				normalize(x.text) === normalize(text) &&
				(!bounds || (x.startMs >= bounds.startMs - 1 && x.endMs <= bounds.endMs + 1)),
		);
		if (!w) throw new Error(`Narration has no word "${text}"${inLine ? ` in ${inLine}` : ''}`);
		return {from: toF(w.startMs), to: toF(w.endMs)};
	};

	return {line, word, end: toF(narration.durationMs)};
};
