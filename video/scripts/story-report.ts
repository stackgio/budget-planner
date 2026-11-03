// Prints the narration source, scene windows and QC frames for DebtThreeThings.
// Usage: npx tsx scripts/story-report.ts [props.json]  → JSON on stdout
import {readFileSync} from 'fs';
import {estimateNarration, cueSec, narrationFromWords, wordsFromAlignmentJson} from '../src/story/lib/narration';
import {buildSceneWindows} from '../src/story/lib/sceneTimeline';
import {SCENES as DEBT_SCENES, SCRIPT, TAIL_SEC} from '../src/videos/debt-three-things/script';

const fps = 30;
const props = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], 'utf8')) : {};
const narration = props.alignment
	? narrationFromWords(SCRIPT, wordsFromAlignmentJson(JSON.parse(readFileSync(`public/${props.alignment}`, 'utf8'))))
	: estimateNarration(SCRIPT, {rate: props.tempRate ?? 1.1});
const {windows, durationInFrames} = buildSceneWindows(DEBT_SCENES, narration, fps, {tailSec: TAIL_SEC});
const f = (line: string, word?: string, off = 0) => Math.round((cueSec(narration, line, word) + off) * fps);
const qc: [string, number][] = [
	['s1_frame0', 0],
	['s1_title', 12],
	['s1_debt_looms', f('L1', 'paying', 1.0)],
	['s1_slots', f('L1', 'three', 0.6)],
	['s1_to_card', f('L2', undefined, -0.2)],
	['s2_heading', f('L2', 'emergency', 0.4)],
	['s2_payment', f('L2', 'first', 0.1)],
	['s2_repair_bill', f('L3', 'car', 0.9)],
	['s2_threat', f('L3', 'fixing', 0.6)],
	['s2_jar', f('L4', 'five', 0.5)],
	['s2_flying', f('L4', 'saved', 0.6)],
	['s2_paid', f('L4', 'more', 0.3)],
	['t2_iris', windows[2].boundary],
	['s3_desk', f('L5', 'throw')],
	['s3_chip1', f('L6', 'overtime', 0.9)],
	['s3_chips', f('L6', 'expenses', 0.2)],
	['s3_morph', f('L6', 'can', 0.25)],
	['s3_graph', f('L6', 'faster', 0.6)],
	['t3_sweep', windows[3].boundary],
	['s4_zero', f('L7', 'three', 0.4)],
	['s4_cheer', f('L8', 'paying')],
	['s4_offer', f('L9', 'staying')],
	['s4_push', f('L9', 'debt', 0.25)],
	['s4_stay', f('L9', 'goal', 0.2)],
	['t4_slide', windows[4].boundary],
	['s5_question', f('L10', 'working')],
	['s5_end', durationInFrames - 2],
];
console.log(JSON.stringify({source: narration.source, durationInFrames, durationSec: durationInFrames / fps, windows, lines: narration.lines.map((l) => ({id: l.id, start: +l.start.toFixed(2), end: +l.end.toFixed(2)})), qc}, null, 1));
