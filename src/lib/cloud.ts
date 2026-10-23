/**
 * Account storage for the claude.ai Artifact build. Data lives in the
 * artifact's database under the viewer's private subtree
 * (`data/users/<id>/…`), which nobody else can read — not even other people
 * the artifact is shared with. It follows the signed-in person across devices.
 *
 * Layout: one `meta` document (categories, settings, budget plan, debts),
 * paychecks bucketed by year (`pay.YYYY`, each carries its frozen plan), and
 * transaction documents bucketed by month (chunked to stay well under the
 * 256 KiB document limit). Only buckets that changed are written. Older
 * accounts kept paychecks inside `meta`; those are still read.
 */
import type { AppData, Transaction } from './types';
import { sanitizeData } from './backup';

type Snap = { exists: boolean; id: string; data(): Record<string, unknown> | undefined; metadata: { hasPendingWrites: boolean } };
type DocRef = {
  path: string;
  get(): Promise<Snap>;
  set(d: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(next: (s: Snap) => void, err?: (e: { code: string }) => void): () => void;
  collection(p: string): ColRef;
};
type ColRef = {
  doc(id: string): DocRef;
  get(): Promise<{ docs: Snap[] }>;
  onSnapshot(next: (s: { docs: Snap[]; metadata: { hasPendingWrites: boolean } }) => void, err?: (e: { code: string }) => void): () => void;
};
type DB = { doc(path: string): DocRef };
type ClaudeWindow = { claude?: { use(name: string): Promise<unknown> } };

const CHUNK = 400;

export type CloudStatus = 'saving' | 'saved' | 'error';

export interface Cloud {
  load(): Promise<AppData | null>;
  save(data: AppData): void;
  subscribe(onRemote: (data: AppData) => void): () => void;
  onStatus(fn: (s: CloudStatus, message?: string) => void): void;
}

function bucketKey(t: Transaction): string {
  return t.date.slice(0, 7);
}

function toDocs(data: AppData): Map<string, Record<string, unknown>> {
  const docs = new Map<string, Record<string, unknown>>();
  docs.set('meta', { schemaVersion: data.schemaVersion, categories: data.categories, settings: data.settings, budget: data.budget, debts: data.debts });
  const byYear = new Map<string, AppData['paychecks']>();
  for (const p of data.paychecks) {
    const y = p.date.slice(0, 4);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(p);
  }
  for (const [y, list] of byYear) docs.set(`pay.${y}`, { paychecks: [...list].sort((a, b) => a.id.localeCompare(b.id)) });
  const byMonth = new Map<string, Transaction[]>();
  for (const t of data.transactions) {
    const k = bucketKey(t);
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k)!.push(t);
  }
  for (const [month, list] of byMonth) {
    list.sort((a, b) => a.id.localeCompare(b.id));
    for (let i = 0; i * CHUNK < list.length; i++) docs.set(`${month}.${i}`, { transactions: list.slice(i * CHUNK, (i + 1) * CHUNK) });
  }
  return docs;
}

function assemble(meta: Record<string, unknown> | undefined, buckets: Iterable<Record<string, unknown>>): AppData {
  const transactions: unknown[] = [];
  const paychecks: unknown[] = Array.isArray(meta?.paychecks) ? [...meta.paychecks] : [];
  for (const b of buckets) {
    if (Array.isArray(b.transactions)) transactions.push(...b.transactions);
    if (Array.isArray(b.paychecks)) paychecks.push(...b.paychecks);
  }
  return sanitizeData({ ...(meta ?? {}), paychecks, transactions }).data;
}

export async function connectCloud(): Promise<Cloud | null> {
  const w = window as unknown as ClaudeWindow;
  if (!w.claude?.use) return null;
  const [db, user] = (await Promise.all([w.claude.use('db'), w.claude.use('user')])) as [DB | null, { id(): Promise<string | null> } | null];
  if (!db || !user) return null;
  const uid = await user.id();
  if (!uid) return null;

  const metaRef = db.doc(`data/users/${uid}/meta`);
  const months = metaRef.collection('months');
  const refFor = (key: string) => (key === 'meta' ? metaRef : months.doc(key));

  /** JSON of what the server holds, per doc key, as far as we know. */
  const known = new Map<string, string>();
  const bodies = new Map<string, Record<string, unknown>>();
  let pending: AppData | null = null;
  let writing = false;
  let statusFn: (s: CloudStatus, m?: string) => void = () => {};

  async function flush() {
    if (writing) return;
    writing = true;
    try {
      while (pending) {
        const data = pending;
        pending = null;
        statusFn('saving');
        const docs = toDocs(data);
        for (const [key, body] of docs) {
          const json = JSON.stringify(body);
          if (known.get(key) === json) continue;
          await refFor(key).set(body);
          known.set(key, json);
          bodies.set(key, body);
        }
        for (const key of [...known.keys()]) {
          if (!docs.has(key)) {
            await refFor(key).delete();
            known.delete(key);
            bodies.delete(key);
          }
        }
      }
      statusFn('saved');
    } catch (e) {
      const code = (e as { code?: string }).code;
      statusFn('error', code === 'quota_exceeded' ? 'Your account storage for this app is full. Export a backup.' : 'Could not save to your account. Your changes are kept in this browser; they will be retried on your next change.');
    } finally {
      writing = false;
    }
  }

  return {
    async load() {
      const [m, ms] = await Promise.all([metaRef.get(), months.get()]);
      if (m.exists) {
        known.set('meta', JSON.stringify(m.data()));
        bodies.set('meta', m.data()!);
      }
      for (const d of ms.docs) {
        if (!d.exists) continue;
        known.set(d.id, JSON.stringify(d.data()));
        bodies.set(d.id, d.data()!);
      }
      if (!m.exists && ms.docs.length === 0) return null;
      return assemble(bodies.get('meta'), [...bodies].filter(([k]) => k !== 'meta').map(([, v]) => v));
    },
    save(data) {
      pending = data;
      void flush();
    },
    onStatus(fn) {
      statusFn = fn;
    },
    subscribe(onRemote) {
      // Live updates from your other devices. Our own writes are filtered out
      // by comparing against what we know the server holds.
      let timer = 0;
      const changed = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (writing || pending) return;
          onRemote(assemble(bodies.get('meta'), [...bodies].filter(([k]) => k !== 'meta').map(([, v]) => v)));
        }, 300);
      };
      const offMeta = metaRef.onSnapshot((s) => {
        if (s.metadata.hasPendingWrites || !s.exists) return;
        const json = JSON.stringify(s.data());
        if (known.get('meta') === json) return;
        known.set('meta', json);
        bodies.set('meta', s.data()!);
        changed();
      }, () => {});
      const offMonths = months.onSnapshot((snap) => {
        if (snap.metadata.hasPendingWrites) return;
        const seen = new Set<string>();
        let diff = false;
        for (const d of snap.docs) {
          seen.add(d.id);
          const json = JSON.stringify(d.data());
          if (known.get(d.id) !== json) {
            known.set(d.id, json);
            bodies.set(d.id, d.data()!);
            diff = true;
          }
        }
        for (const k of [...known.keys()]) {
          if (k !== 'meta' && !seen.has(k)) {
            known.delete(k);
            bodies.delete(k);
            diff = true;
          }
        }
        if (diff) changed();
      }, () => {});
      return () => {
        offMeta();
        offMonths();
      };
    },
  };
}

/** The downloads capability, for exports inside the Artifact viewer. */
export async function artifactDownload(filename: string, data: string): Promise<'saved' | 'declined' | 'unavailable'> {
  const w = window as unknown as ClaudeWindow;
  const dl = (await w.claude?.use('downloads')) as { save(r: { filename: string; data: string }): Promise<unknown> } | null;
  if (!dl) return 'unavailable';
  try {
    await dl.save({ filename, data });
    return 'saved';
  } catch (e) {
    return (e as { code?: string }).code === 'declined' ? 'declined' : 'unavailable';
  }
}
