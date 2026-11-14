#!/usr/bin/env node
// Daily Money Motion pipeline helper. No dependencies. Idempotent by design.
//   node daily-money-motion/scripts/dmm.mjs new <YYYY-MM-DD> <pillar> "<topic>"   → reserves next DMM-NNN for that date (refuses a 2nd episode per date)
//   node daily-money-motion/scripts/dmm.mjs status <DMM-NNN> <STATUS> ["note"]     → append a status transition
//   node daily-money-motion/scripts/dmm.mjs set <DMM-NNN> <field> <value|json>     → hook, hook_pattern, layout, engine, reference_ids, qc_score, final_render…
//   node daily-money-motion/scripts/dmm.mjs check <DMM-NNN>                       → duplicate check vs the previous 30 days (topic, hook, layout, references)
//   node daily-money-motion/scripts/dmm.mjs next-pillar                          → least-recently-used pillar
//   node daily-money-motion/scripts/dmm.mjs unused-refs                          → strong references not yet used
//   node daily-money-motion/scripts/dmm.mjs render <DMM-NNN>                      → versioned render + QC (never overwrites)
//   node daily-money-motion/scripts/dmm.mjs due [YYYY-MM-DD]                      → exit 0 if an episode is due (rolling 72 h cadence), 3 if not
//   node daily-money-motion/scripts/dmm.mjs search <words…>                       → search episode history (topic, hook, metaphor, tags, notes)
//   node daily-money-motion/scripts/dmm.mjs gate <DMM-NNN> <score> <qc_auto.json> → READY_FOR_REVIEW only if auto-QC has 0 FAIL and score ≥ gate; else NEEDS_FIXING
//   node daily-money-motion/scripts/dmm.mjs list
import {readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, appendFileSync} from 'fs';
import {spawnSync} from 'child_process';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG = path.join(root, 'production-log.json');
const CFG = JSON.parse(readFileSync(path.join(root, 'config.json'), 'utf8'));
const REFS = path.join(root, 'research/viral-references.json');
const die = (m) => { console.error('dmm:', m); process.exit(1); };
const load = () => JSON.parse(readFileSync(LOG, 'utf8'));
const save = (d) => { const tmp = LOG + '.tmp'; writeFileSync(tmp, JSON.stringify(d, null, 2) + '\n'); renameSync(tmp, LOG); };
const log = (m) => { mkdirSync(path.join(root, 'logs'), {recursive: true}); appendFileSync(path.join(root, 'logs/pipeline.log'), `${new Date().toISOString()} ${m}\n`); };
const find = (d, id) => d.episodes.find((e) => e.id === id) ?? die(`no episode ${id}`);
const days = (a, b) => Math.abs((new Date(a) - new Date(b)) / 864e5);
const words = (s = '') => new Set(s.toLowerCase().replace(/[^a-z0-9$ ]/g, ' ').split(/\s+/).filter((w) => w.length > 3));
const overlap = (a, b) => { const A = words(a), B = words(b); if (!A.size || !B.size) return 0; let n = 0; for (const w of A) if (B.has(w)) n++; return n / Math.min(A.size, B.size); };

const [cmd, ...a] = process.argv.slice(2);
const d = load();
switch (cmd) {
	case 'new': {
		const [date, pillar, topic] = a;
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) die('date must be YYYY-MM-DD');
		if (!CFG.pillars.includes(pillar)) die(`pillar must be one of ${CFG.pillars.join(', ')}`);
		const same = d.episodes.find((e) => e.date === date && e.status !== 'FAILED');
		if (same) { console.log(`exists: ${same.id} already reserved for ${date} (status ${same.status}) — nothing created`); break; }
		const n = Math.max(0, ...d.episodes.map((e) => Number(e.id.slice(4)))) + 1;
		const id = `DMM-${String(n).padStart(3, '0')}`;
		d.episodes.push({id, date, composition: `DMM${String(n).padStart(3, '0')}`, pillar, topic: topic ?? '', status: 'RESEARCHING', history: [{at: new Date().toISOString(), status: 'RESEARCHING'}], published: []});
		save(d); mkdirSync(path.join(root, 'episodes', id), {recursive: true});
		log(`${id} created for ${date} (${pillar})`); console.log(`created ${id} (composition DMM${String(n).padStart(3, '0')}) → daily-money-motion/episodes/${id}/`);
		break;
	}
	case 'status': {
		const [id, st, note] = a; const e = find(d, id);
		if (!CFG.statuses.includes(st)) die(`status must be one of ${CFG.statuses.join(', ')}`);
		if (e.status === 'PUBLISHED' && st !== 'PUBLISHED') die(`${id} is PUBLISHED — refusing to move it back`);
		if (st === 'READY_FOR_REVIEW') die('use `gate` — READY_FOR_REVIEW requires passing auto-QC and a creative score ≥ the gate');
		if (st === 'QUEUED' && e.status !== 'APPROVED') die(`${id} must be APPROVED by the creator before QUEUED (is ${e.status})`);
		if ((st === 'QUEUED' || st === 'PUBLISHED') && e.history.some((h) => h.status === st)) die(`${id} was already ${st} — refusing to queue/publish twice`);
		e.status = st; e.history.push({at: new Date().toISOString(), status: st, ...(note ? {note} : {})});
		save(d); log(`${id} → ${st}${note ? ` (${note})` : ''}`); console.log(`${id} → ${st}`);
		break;
	}
	case 'set': {
		const [id, field, raw] = a; const e = find(d, id);
		let v = raw; try { v = JSON.parse(raw); } catch {}
		e[field] = v; save(d); log(`${id} set ${field}`); console.log(`${id}.${field} =`, v);
		break;
	}
	case 'check': {
		const e = find(d, a[0]); const win = CFG.rules.duplicate_window_days; const issues = [];
		const prior = d.episodes.filter((p) => p.id !== e.id && p.status !== 'FAILED' && days(p.date, e.date) <= win);
		for (const p of prior) {
			if (overlap(p.topic, e.topic) >= 0.6) issues.push(`topic too close to ${p.id} ("${p.topic}")`);
			if (overlap(p.hook, e.hook) >= 0.5) issues.push(`hook too close to ${p.id} ("${p.hook}")`);
			for (const r of e.reference_ids ?? []) if ((p.reference_ids ?? []).includes(r)) issues.push(`reference ${r} already used by ${p.id}`);
		}
		for (const p of prior) {
			if (e.metaphor && p.metaphor && overlap(p.metaphor, e.metaphor) >= 0.5) issues.push(`metaphor too close to ${p.id} ("${p.metaphor}")`);
			const shared = (e.visual_tags ?? []).filter((t) => (p.visual_tags ?? []).includes(t));
			if (shared.length >= 2) issues.push(`visual tags shared with ${p.id}: ${shared.join(', ')}`);
		}
		const prev = d.episodes.filter((p) => p.date < e.date && p.status !== 'FAILED').sort((x, y) => (x.date < y.date ? 1 : -1))[0];
		if (prev && e.layout && prev.layout === e.layout) issues.push(`same layout as previous episode ${prev.id} (${e.layout})`);
		if (prev && e.engine && prev.engine === e.engine && prev.pillar === e.pillar) issues.push(`same engine and pillar as ${prev.id}`);
		console.log(issues.length ? `DUPLICATE RISK for ${e.id}:\n- ${issues.join('\n- ')}` : `${e.id}: no duplicates in the last ${win} days`);
		process.exitCode = issues.length ? 2 : 0;
		break;
	}
	case 'next-pillar': {
		const last = Object.fromEntries(CFG.pillars.map((p) => [p, '0000-00-00']));
		for (const e of d.episodes) if (e.status !== 'FAILED' && e.date > last[e.pillar]) last[e.pillar] = e.date;
		console.log(CFG.pillars.slice().sort((x, y) => (last[x] < last[y] ? -1 : last[x] > last[y] ? 1 : 0))[0]);
		break;
	}
	case 'unused-refs': {
		const refs = JSON.parse(readFileSync(REFS, 'utf8')).references.filter((r) => !(r.used_in ?? []).length).sort((x, y) => (y.outlier_multiple ?? 0) - (x.outlier_multiple ?? 0));
		for (const r of refs) console.log(`${r.id}  ${String(r.outlier_multiple).padStart(6)}x  ${(r.views / 1e6).toFixed(1)}M  ${r.creator}  ${r.topic}`);
		break;
	}
	case 'render': {
		const e = find(d, a[0]);
		e.status = 'BUILDING'; e.history.push({at: new Date().toISOString(), status: 'BUILDING', note: 'render started'}); save(d);
		const r = spawnSync('bash', ['scripts/daily/render.sh', e.id, e.composition], {cwd: path.join(root, '../video'), stdio: 'inherit'});
		const d2 = load(); const e2 = find(d2, e.id);
		const st = r.status === 0 ? 'REVIEWING' : 'NEEDS_FIXING';
		e2.status = st; e2.history.push({at: new Date().toISOString(), status: st, note: r.status === 0 ? 'render + hard checks passed; visual QC pending' : `render/check failed (exit ${r.status})`});
		save(d2); log(`${e.id} render exit ${r.status} → ${st}`); console.log(`${e.id} → ${st}`);
		process.exitCode = r.status ?? 1;
		break;
	}
	case 'due': {
		const S = CFG.schedule ?? {};
		const date = a[0] ?? new Date().toLocaleDateString('en-CA', {timeZone: S.timezone ?? 'America/New_York'});
		if (!S.active || !S.anchorDate) { console.log(`not due: schedule not activated (config.json schedule.active=${!!S.active}, anchorDate=${S.anchorDate})`); process.exitCode = 3; break; }
		const diff = Math.round((new Date(date + 'T12:00:00Z') - new Date(S.anchorDate + 'T12:00:00Z')) / 864e5);
		const existing = d.episodes.find((e) => e.date === date && e.status !== 'FAILED');
		if (diff < 0 || diff % S.intervalDays !== 0) {
			const next = new Date(new Date(S.anchorDate + 'T12:00:00Z').getTime() + (Math.max(0, Math.ceil(diff / S.intervalDays)) * S.intervalDays) * 864e5).toISOString().slice(0, 10);
			console.log(`not due on ${date} (next: ${next})`); process.exitCode = 3; break;
		}
		if (existing) { console.log(`not due: ${existing.id} already exists for ${date} (${existing.status})`); process.exitCode = 3; break; }
		const last = d.episodes.filter((e) => e.status !== 'FAILED' && e.date < date).sort((x, y) => (x.date < y.date ? 1 : -1))[0];
		if (last && Math.round((new Date(date) - new Date(last.date)) / 864e5) < S.intervalDays) { console.log(`not due: last episode ${last.id} on ${last.date} is less than ${S.intervalDays} days ago`); process.exitCode = 3; break; }
		console.log(`due: produce an episode for ${date} (deliver by ${S.deliverBy} ${S.timezone})`);
		break;
	}
	case 'search': {
		const q = a.join(' ').toLowerCase();
		if (!q) die('usage: search <words>');
		const terms = q.split(/\s+/);
		for (const e of d.episodes) {
			const hay = JSON.stringify([e.topic, e.hook, e.hook_pattern, e.layout, e.metaphor, e.visual_tags, e.pillar, e.history?.map((h) => h.note)]).toLowerCase();
			const hits = terms.filter((t) => hay.includes(t)).length;
			if (hits) console.log(`${e.id}  ${e.date}  ${hits}/${terms.length}  ${e.metaphor ?? e.topic}  [${(e.visual_tags ?? []).join(', ')}]`);
		}
		break;
	}
	case 'gate': {
		const [id, score, qcPath] = a; const e = find(d, id); const G = CFG.gate;
		if (!score || !qcPath) die('usage: gate <ID> <creative score> <qc_auto.json>');
		const qc = JSON.parse(readFileSync(qcPath, 'utf8'));
		const sc = Number(score); const reasons = [];
		if (qc.episode !== id) reasons.push(`qc file is for ${qc.episode}`);
		if (qc.fails > 0) reasons.push(`${qc.fails} automated FAIL(s)`);
		if (!(sc >= G.min_creative_score)) reasons.push(`creative score ${sc} < ${G.min_creative_score}`);
		const st = reasons.length ? 'NEEDS_FIXING' : 'READY_FOR_REVIEW';
		e.status = st; e.qc_score = sc; e.history.push({at: new Date().toISOString(), status: st, note: reasons.length ? reasons.join('; ') : `auto-QC 0 FAIL (${qc.warns} WARN), score ${sc}`});
		save(d); log(`${id} gate → ${st}`);
		console.log(st === 'READY_FOR_REVIEW' ? `${id}: ${G.ready_label}` : `${id}: ${G.fail_label} — ${reasons.join('; ')}`);
		process.exitCode = reasons.length ? 2 : 0;
		break;
	}
	case 'list':
		for (const e of d.episodes) console.log(`${e.id}  ${e.date}  ${e.status.padEnd(13)} ${e.pillar.padEnd(30)} ${e.hook ?? e.topic}`);
		break;
	default:
		die('usage: new | status | set | check | next-pillar | unused-refs | render | list (see header)');
}
