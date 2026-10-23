import { useCallback, useEffect, useState } from 'react';
import { useStore } from './store';
import type { Transaction } from './lib/types';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Reports } from './pages/Reports';
import { Budget } from './pages/Budget';
import { Settings } from './pages/Settings';
import { ExpenseSheet, type FormTarget } from './components/ExpenseForm';
import { Toasts } from './components/ui';
import { ChartIcon, HomeIcon, ListIcon, PlusIcon, WalletIcon } from './components/Icons';

export type Tab = 'home' | 'history' | 'reports' | 'budget' | 'settings';
const TABS: Tab[] = ['home', 'history', 'reports', 'budget', 'settings'];

function tabFromHash(): Tab {
  const h = window.location.hash.replace('#/', '').replace('#', '');
  return (TABS as string[]).includes(h) ? (h as Tab) : 'home';
}

export function App() {
  const { saveError, recovered, toast } = useStore();
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [form, setForm] = useState<FormTarget | null>(null);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    // Home Screen shortcut / ?add=1 opens quick entry directly.
    if (new URLSearchParams(window.location.search).has('add')) setForm({ mode: 'new' });
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (recovered) toast('Your latest save was unreadable, so the previous copy was restored.', 'error');
  }, [recovered, toast]);

  const go = useCallback((t: Tab) => {
    // Plain #tokens so a view can be linked; settings stays out of the URL.
    try {
      if (t === 'settings') history.replaceState(null, '', window.location.pathname + window.location.search);
      else window.location.hash = t;
    } catch {
      // some embedded views refuse URL changes; the tab still switches
    }
    setTab(t);
    window.scrollTo({ top: 0 });
  }, []);
  const openTxn = useCallback((txn: Transaction) => setForm({ mode: 'edit', txn }), []);
  const openAdd = useCallback(() => setForm({ mode: 'new' }), []);

  return (
    <>
      <main className="app">
        {saveError && tab !== 'settings' && <div className="banner" role="alert">{saveError}</div>}
        {tab === 'home' && <Home onAdd={openAdd} onOpen={openTxn} go={go} />}
        {tab === 'history' && <History onOpen={openTxn} />}
        {tab === 'reports' && <Reports onOpen={openTxn} />}
        {tab === 'budget' && <Budget />}
        {tab === 'settings' && <Settings onBack={() => go('home')} />}
      </main>

      <nav className="bottom-nav" aria-label="Main">
        <div className="bottom-nav-inner">
          <NavBtn label="Home" active={tab === 'home' || tab === 'settings'} onClick={() => go('home')} icon={<HomeIcon />} />
          <NavBtn label="History" active={tab === 'history'} onClick={() => go('history')} icon={<ListIcon />} />
          <button className="nav-add" aria-label="Add expense" onClick={openAdd}><PlusIcon /></button>
          <NavBtn label="Reports" active={tab === 'reports'} onClick={() => go('reports')} icon={<ChartIcon />} />
          <NavBtn label="Budget" active={tab === 'budget'} onClick={() => go('budget')} icon={<WalletIcon />} />
        </div>
      </nav>

      {form && <ExpenseSheet key={JSON.stringify([form.mode, 'txn' in form ? form.txn.id : 'of' in form ? form.of.id : ''])} target={form} onClose={() => setForm(null)} onSwitch={setForm} />}
      <Toasts />
    </>
  );
}

function NavBtn({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button className={`nav-btn ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}
