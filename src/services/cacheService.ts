import { load } from '@tauri-apps/plugin-store';
import { WordLookupResult } from './aiService';

// Use the same store file as settings — guaranteed to work
const STORE_PATH = 'settings.json';
const CACHE_KEY = 'wordCache';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  data: WordLookupResult;
  ts: number;
}

type WordCache = Record<string, CacheEntry>;

async function getStore() {
  return load(STORE_PATH, { autoSave: true });
}

export async function getCachedWord(word: string): Promise<WordLookupResult | null> {
  try {
    const store = await getStore();
    const cache = await store.get<WordCache>(CACHE_KEY);
    if (!cache) return null;
    const key = word.toLowerCase().trim();
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > SEVEN_DAYS_MS) {
      delete cache[key];
      await store.set(CACHE_KEY, cache);
      await store.save();
      return null;
    }
    return entry.data;
  } catch (e) {
    console.error('[cacheService] getCachedWord failed:', e);
    return null;
  }
}

export async function setCachedWord(word: string, data: WordLookupResult): Promise<void> {
  try {
    const store = await getStore();
    const cache = (await store.get<WordCache>(CACHE_KEY)) ?? {};
    const key = word.toLowerCase().trim();
    cache[key] = { data, ts: Date.now() };
    await store.set(CACHE_KEY, cache);
    await store.save();
  } catch (e) {
    console.error('[cacheService] setCachedWord failed:', e);
  }
}
