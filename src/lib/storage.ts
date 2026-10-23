/**
 * Local-only persistence in the browser's localStorage.
 *
 * Data never leaves the device unless you export it. Each save also keeps the
 * previous good copy so a corrupted write can be recovered on next launch.
 */
import type { AppData } from './types';
import { emptyData } from './defaults';
import { sanitizeData } from './backup';

export const STORAGE_KEY = 'spend-smarter:data:v1';
export const PREVIOUS_KEY = 'spend-smarter:data:v1:previous';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadResult {
  data: AppData;
  /** Set when the main copy was unreadable and the previous copy was used. */
  recovered: boolean;
  firstRun: boolean;
}

export function loadData(store: KeyValueStore): LoadResult {
  for (const [key, recovered] of [[STORAGE_KEY, false], [PREVIOUS_KEY, true]] as const) {
    const raw = store.getItem(key);
    if (!raw) continue;
    try {
      const { data } = sanitizeData(JSON.parse(raw));
      return { data, recovered, firstRun: false };
    } catch {
      // try the previous copy
    }
  }
  return { data: emptyData(), recovered: false, firstRun: true };
}

/** Writes data and verifies it was stored. Throws if storage is full or blocked. */
export function saveData(store: KeyValueStore, data: AppData): void {
  const json = JSON.stringify(data);
  const current = store.getItem(STORAGE_KEY);
  if (current && current !== json) store.setItem(PREVIOUS_KEY, current);
  store.setItem(STORAGE_KEY, json);
  if (store.getItem(STORAGE_KEY) !== json) throw new Error('Saved data could not be verified.');
}

/** Ask the browser not to evict our storage under pressure (best effort). */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    // unsupported
  }
  return null;
}

export function storageBytes(data: AppData): number {
  return new Blob([JSON.stringify(data)]).size;
}
