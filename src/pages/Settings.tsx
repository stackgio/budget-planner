import { useRef, useState } from 'react';
import { useStore } from '../store';
import { fromCSV, mergeData, sanitizeData, toBackupJSON, toCSV, type MergeResult } from '../lib/backup';
import { storageBytes } from '../lib/storage';
import { emptyData } from '../lib/defaults';
import { updateSettings } from '../lib/ops';
import { centsToInput, parseCents } from '../lib/money';
import { ConfirmDialog, Segmented } from '../components/ui';
import { ChevronLeft } from '../components/Icons';
import type { AppData } from '../lib/types';

async function deliverFile(name: string, mime: string, content: string, share: boolean) {
  const blob = new Blob([content], { type: mime });
  if (share) {
    const file = new File([blob], name, { type: mime });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function Settings({ onBack }: { onBack: () => void }) {
  const { data, today, apply, toast, persisted, saveError } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ result: MergeResult; replace: AppData; name: string } | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [newMethod, setNewMethod] = useState('');
  const [small, setSmall] = useState(centsToInput(data.settings.smallPurchaseCents));
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare;

  const active = data.transactions.filter((t) => !t.deletedAt).length;
  const kb = (storageBytes(data) / 1024).toFixed(1);

  async function exportFile(kind: 'json' | 'csv', share = false) {
    try {
      if (kind === 'json') await deliverFile(`spend-smarter-backup-${today}.json`, 'application/json', toBackupJSON(data), share);
      else await deliverFile(`spend-smarter-${today}.csv`, 'text/csv', toCSV(data), share);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast('Export failed. Try again.', 'error');
    }
  }

  async function onFile(file: File) {
    try {
      const text = await file.text();
      let incoming: AppData;
      let skipped = 0;
      if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
        ({ data: incoming, skipped } = fromCSV(text, data));
      } else {
        ({ data: incoming, skipped } = sanitizeData(JSON.parse(text)));
      }
      setPending({ result: mergeData(data, incoming, skipped), replace: incoming, name: file.name });
    } catch (e) {
      toast(e instanceof SyntaxError ? 'That file is not valid JSON.' : (e as Error).message || 'Could not read that file.', 'error');
    }
  }

  return (
    <>
      <header className="page-header">
        <div className="row">
          <button className="icon-btn" aria-label="Back" onClick={onBack}><ChevronLeft /></button>
          <h1>Settings</h1>
        </div>
      </header>

      {saveError && <div className="banner">{saveError}</div>}

      <section className="card">
        <h2 className="card-title">Your data</h2>
        <p style={{ marginTop: 0, lineHeight: 1.5 }}>
          Everything is stored <b>only on this device</b>, inside this browser's local storage. Nothing is uploaded and nothing syncs between devices.
        </p>
        <ul className="muted small" style={{ lineHeight: 1.6, paddingLeft: 18 }}>
          <li>{active} entries · {data.paychecks.length} paychecks · {kb} KB used</li>
          <li>Persistent storage: {persisted === true ? 'granted ✓' : persisted === false ? 'not granted by the browser' : 'not supported here'}</li>
          <li>On iPhone, add the app to your Home Screen (Share → Add to Home Screen). Safari may clear website data that hasn't been opened for a while; the Home Screen app is kept.</li>
          <li>Clearing Safari history/website data, private browsing, or deleting the Home Screen app erases the data.</li>
          <li>Export a backup regularly (e.g. every payday) and keep it in Files or iCloud Drive.</li>
        </ul>
      </section>

      <section className="card stack">
        <h2 className="card-title" style={{ margin: 0 }}>Backup & export</h2>
        <div className="grid-2">
          <button className="btn primary" onClick={() => exportFile('json')}>Export backup (JSON)</button>
          <button className="btn" onClick={() => exportFile('csv')}>Export CSV</button>
        </div>
        {canShare && (
          <div className="grid-2">
            <button className="btn small" onClick={() => exportFile('json', true)}>Share backup…</button>
            <button className="btn small" onClick={() => exportFile('csv', true)}>Share CSV…</button>
          </div>
        )}
        <button className="btn" onClick={() => fileRef.current?.click()}>Import backup (JSON or CSV)</button>
        <input ref={fileRef} type="file" accept=".json,.csv,application/json,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
        <div className="small faint">Importing merges by transaction ID, so importing the same backup twice never creates duplicates.</div>
      </section>

      <section className="card stack">
        <h2 className="card-title" style={{ margin: 0 }}>Preferences</h2>
        <div className="field">
          <span className="small muted" style={{ fontWeight: 600 }}>Week starts on</span>
          <Segmented label="Week starts on" value={String(data.settings.weekStartsOn) as '0' | '1'} onChange={(v) => apply((d) => updateSettings(d, { weekStartsOn: v === '0' ? 0 : 1 }))}
            options={[{ value: '1', label: 'Monday' }, { value: '0', label: 'Sunday' }]} />
        </div>
        <label className="field">
          <span>"Small purchase" threshold for insights</span>
          <div className="amount-wrap"><input className="input num" style={{ paddingLeft: 36 }} inputMode="decimal" value={small} onChange={(e) => setSmall(e.target.value)}
            onBlur={() => { const c = parseCents(small); if (c !== null) apply((d) => updateSettings(d, { smallPurchaseCents: c })); else setSmall(centsToInput(data.settings.smallPurchaseCents)); }} /></div>
        </label>
        <div className="field">
          <span className="small muted" style={{ fontWeight: 600 }}>Payment methods</span>
          <div className="chips wrap-chips">
            {data.settings.paymentMethods.map((m) => (
              <button key={m} className="chip" aria-label={`Remove ${m}`} onClick={() => apply((d) => updateSettings(d, { paymentMethods: d.settings.paymentMethods.filter((x) => x !== m) }))}>{m} ✕</button>
            ))}
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); const m = newMethod.trim(); if (m && !data.settings.paymentMethods.includes(m)) apply((d) => updateSettings(d, { paymentMethods: [...d.settings.paymentMethods, m] })); setNewMethod(''); }}>
            <input className="input grow" placeholder="Add payment method" value={newMethod} maxLength={30} onChange={(e) => setNewMethod(e.target.value)} />
            <button className="btn" type="submit">Add</button>
          </form>
        </div>
      </section>

      <section className="card stack">
        <h2 className="card-title" style={{ margin: 0 }}>Money rules</h2>
        <ul className="muted small" style={{ lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
          <li><b>Expenses</b> count as spending — including credit card purchases, on the day you record them.</li>
          <li><b>Credit card payments</b> are not counted again (the purchases already were).</li>
          <li><b>Transfers</b> between your own accounts are not spending.</li>
          <li><b>Savings & investing</b> are tracked separately from spending.</li>
          <li><b>Refunds</b> reduce the original purchase's category.</li>
          <li><b>Uncle's money</b> is never counted as your income or spending.</li>
          <li>All math uses whole cents. Every entry has a permanent ID shared in exports.</li>
        </ul>
      </section>

      <section className="card">
        <button className="btn danger block" onClick={() => setConfirmErase(true)}>Erase all data on this device</button>
      </section>

      <p className="center faint small" style={{ marginTop: 18 }}>Spend Smarter · local-only · v1</p>

      {pending && (
        <ConfirmDialog
          title={`Import ${pending.name}?`}
          message={
            <>
              {pending.result.added} new, {pending.result.updated} updated, {pending.result.unchanged} already here
              {pending.result.duplicates ? `, ${pending.result.duplicates} duplicates skipped` : ''}
              {pending.result.skipped ? `, ${pending.result.skipped} invalid rows skipped` : ''}. Your existing entries are kept.{' '}
              <button className="link" onClick={() => setConfirmReplace(true)}>Replace all data instead…</button>
            </>
          }
          confirmLabel="Merge"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const r = pending.result;
            apply(() => r.data, { toast: `Imported ${r.added} new, ${r.updated} updated` });
            setPending(null);
          }}
        />
      )}
      {pending && confirmReplace && (
        <ConfirmDialog
          title="Replace all data?"
          danger
          message={`Everything on this device will be replaced with the contents of ${pending.name}.`}
          confirmLabel="Replace"
          onCancel={() => setConfirmReplace(false)}
          onConfirm={() => {
            const before = data;
            const next = pending.replace;
            apply(() => next, { toast: `Replaced with ${next.transactions.length} entries`, undo: () => before });
            setConfirmReplace(false);
            setPending(null);
          }}
        />
      )}
      {confirmErase && (
        <ConfirmDialog
          title="Erase everything?"
          danger
          message="All entries, paychecks, categories and settings on this device will be deleted. Export a backup first if you might need it."
          confirmLabel="Erase"
          onCancel={() => setConfirmErase(false)}
          onConfirm={() => {
            const before = data;
            apply(() => emptyData(today), { toast: 'All data erased', undo: () => before });
            setConfirmErase(false);
          }}
        />
      )}
    </>
  );
}
