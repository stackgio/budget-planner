import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData } from './lib/types';
import { loadData, requestPersistentStorage, saveData } from './lib/storage';
import { todayISO } from './lib/dates';
import { ValidationError } from './lib/ops';
import { mergeData } from './lib/backup';
import { connectCloud, type Cloud } from './lib/cloud';
import { IS_ARTIFACT } from './platform';

/** Where data is being kept, for the artifact build. */
export type CloudState = 'off' | 'connecting' | 'saving' | 'saved' | 'unavailable' | 'error';

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'error';
  undo?: () => void;
}

interface StoreValue {
  data: AppData;
  today: string;
  /** Apply a state transition. Returns true on success; shows the error otherwise. */
  apply: (fn: (d: AppData) => AppData, opts?: { toast?: string; undo?: (d: AppData) => AppData }) => boolean;
  toast: (message: string, tone?: Toast['tone'], undo?: () => void) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  saveError: string | null;
  persisted: boolean | null;
  recovered: boolean;
  cloud: CloudState;
  cloudMessage: string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

const browserStore = {
  getItem: (k: string) => window.localStorage.getItem(k),
  setItem: (k: string, v: string) => window.localStorage.setItem(k, v),
};

function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const check = () => setToday((prev) => (prev === todayISO() ? prev : todayISO()));
    const timer = window.setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return today;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => {
    try {
      return loadData(browserStore);
    } catch {
      return null;
    }
  }, []);
  const [data, setData] = useState<AppData>(() => initial?.data ?? loadData({ getItem: () => null, setItem: () => {} }).data);
  const dataRef = useRef(data);
  const [saveError, setSaveError] = useState<string | null>(initial ? null : 'Storage is unavailable in this browser mode. Entries will not be saved.');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToast = useRef(1);
  const today = useToday();
  const [cloud, setCloud] = useState<CloudState>(IS_ARTIFACT ? 'connecting' : 'off');
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const cloudRef = useRef<Cloud | null>(null);
  const changedBeforeCloud = useRef(false);

  const saveLocal = useCallback((next: AppData) => {
    try {
      saveData(browserStore, next);
      setSaveError(null);
    } catch (e) {
      // In the artifact build the account copy is the real one; the browser copy is a cache.
      if (IS_ARTIFACT && cloudRef.current) return;
      setSaveError(
        e instanceof DOMException && e.name === 'QuotaExceededError'
          ? 'Storage is full — your latest change was not saved. Export a backup now.'
          : 'Your latest change could not be saved on this device. Export a backup now.',
      );
    }
  }, []);

  useEffect(() => {
    if (!IS_ARTIFACT) return;
    let off: (() => void) | undefined;
    let cancelled = false;
    connectCloud()
      .then(async (c) => {
        if (cancelled) return;
        if (!c) {
          setCloud('unavailable');
          return;
        }
        c.onStatus((st, msg) => {
          setCloud(st);
          setCloudMessage(msg ?? null);
        });
        const remote = await c.load();
        if (cancelled) return;
        let next = dataRef.current;
        let upload = true;
        if (remote) {
          next = changedBeforeCloud.current ? mergeData(remote, dataRef.current).data : remote;
          upload = changedBeforeCloud.current;
        }
        cloudRef.current = c;
        dataRef.current = next;
        setData(next);
        saveLocal(next);
        if (upload) c.save(next);
        else setCloud('saved');
        off = c.subscribe((fresh) => {
          dataRef.current = fresh;
          setData(fresh);
          saveLocal(fresh);
        });
      })
      .catch(() => !cancelled && setCloud('unavailable'));
    return () => {
      cancelled = true;
      off?.();
    };
  }, [saveLocal]);

  useEffect(() => {
    if (!IS_ARTIFACT) requestPersistentStorage().then(setPersisted);
  }, []);

  // Reload if another tab changed the data.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('spend-smarter:data')) {
        const fresh = loadData(browserStore).data;
        dataRef.current = fresh;
        setData(fresh);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: Toast['tone'] = 'info', undo?: () => void) => {
      const id = nextToast.current++;
      setToasts([{ id, message, tone, undo }]);
      window.setTimeout(() => dismissToast(id), undo ? 6000 : 3500);
    },
    [dismissToast],
  );

  const commit = useCallback(
    (next: AppData) => {
      dataRef.current = next;
      setData(next);
      saveLocal(next);
      if (cloudRef.current) cloudRef.current.save(next);
      else changedBeforeCloud.current = true;
    },
    [saveLocal],
  );

  const apply: StoreValue['apply'] = useCallback<StoreValue['apply']>(
    (fn, opts) => {
      let next: AppData;
      try {
        next = fn(dataRef.current);
      } catch (e) {
        toast(e instanceof ValidationError ? e.message : 'Something went wrong. Nothing was changed.', 'error');
        if (!(e instanceof ValidationError)) console.error(e);
        return false;
      }
      commit(next);
      const undo = opts?.undo;
      if (opts?.toast) toast(opts.toast, 'info', undo ? () => apply(undo) : undefined);
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit, toast],
  );

  const value = useMemo<StoreValue>(
    () => ({ data, today, apply, toast, toasts, dismissToast, saveError, persisted, recovered: initial?.recovered ?? false, cloud, cloudMessage }),
    [data, today, apply, toast, toasts, dismissToast, saveError, persisted, initial, cloud, cloudMessage],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}

export function useCategory(id: string | null) {
  const { data } = useStore();
  return data.categories.find((c) => c.id === id) ?? null;
}
