import { createContext, useContext, useState, useEffect } from 'react';
import { load } from '@tauri-apps/plugin-store';
import { AIConfig } from '../types/ai';
import { WordEntry } from '../types/vocabulary';

const STORE_PATH = 'settings.json';

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  endpoint: '',
  apiKey: '',
  model: 'gpt-4o',
};

type StoreData = {
  aiConfig?: AIConfig;
  exportDir?: string;
  favorites?: string[];       // legacy
  wordEntries?: WordEntry[];
};

function migrateToFavoritesToWords(favorites: string[]): WordEntry[] {
  const now = Date.now();
  return favorites.map((text, i) => ({
    id: crypto.randomUUID(),
    text,
    addedAt: now - i * 1000, // stagger by 1s so sort is stable
    tags: [],
    note: '',
    mastery: 'new' as const,
    lookupCount: 0,
  }));
}

interface SettingsContextValue {
  aiConfig: AIConfig;
  setAIConfig: (c: AIConfig) => void;
  exportDir: string;
  setExportDir: (dir: string) => void;
  words: WordEntry[];
  addWord: (text: string, cachedDef?: WordEntry['cachedDef']) => void;
  removeWord: (id: string) => void;
  removeWords: (ids: string[]) => void;
  clearWords: () => void;
  updateWord: (id: string, updates: Partial<WordEntry>) => void;
  isWordFavorited: (text: string) => boolean;
  loaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  aiConfig: DEFAULT_AI_CONFIG,
  setAIConfig: () => {},
  exportDir: '',
  setExportDir: () => {},
  words: [],
  addWord: () => {},
  removeWord: () => {},
  removeWords: () => {},
  clearWords: () => {},
  updateWord: () => {},
  isWordFavorited: () => false,
  loaded: false,
});

async function getStore() {
  return load(STORE_PATH, { autoSave: true });
}

async function readStoreData(): Promise<StoreData> {
  const store = await getStore();
  return (await store.get<StoreData>('settings')) ?? {};
}

async function writeStoreData(data: StoreData) {
  const store = await getStore();
  await store.set('settings', data);
  await store.save();
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [aiConfig, setAIConfigState] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [exportDir, setExportDirState] = useState('');
  const [words, setWords] = useState<WordEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await readStoreData();
        if (saved.aiConfig) setAIConfigState(saved.aiConfig);
        if (saved.exportDir) setExportDirState(saved.exportDir);

        // Migration: old string[] → new WordEntry[]
        if (saved.wordEntries && saved.wordEntries.length > 0) {
          setWords(saved.wordEntries);
        } else if (saved.favorites && saved.favorites.length > 0) {
          const migrated = migrateToFavoritesToWords(saved.favorites);
          setWords(migrated);
          // Save migrated data, remove old key
          await writeStoreData({
            aiConfig: saved.aiConfig ?? DEFAULT_AI_CONFIG,
            exportDir: saved.exportDir ?? '',
            wordEntries: migrated,
          });
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setLoaded(true);
    })();
  }, []);

  const setAIConfig = async (c: AIConfig) => {
    setAIConfigState(c);
    try {
      const saved = await readStoreData();
      await writeStoreData({ ...saved, aiConfig: c });
    } catch (e) {
      console.error('Failed to save AI config:', e);
    }
  };

  const setExportDir = async (dir: string) => {
    setExportDirState(dir);
    try {
      const saved = await readStoreData();
      await writeStoreData({ ...saved, exportDir: dir });
    } catch (e) {
      console.error('Failed to save export dir:', e);
    }
  };

  const persistWords = async (next: WordEntry[]) => {
    setWords(next);
    try {
      const saved = await readStoreData();
      await writeStoreData({ ...saved, wordEntries: next });
    } catch (e) {
      console.error('Failed to save words:', e);
    }
  };

  const addWord = async (text: string, cachedDef?: WordEntry['cachedDef']) => {
    if (words.some(w => w.text === text)) return;
    const entry: WordEntry = {
      id: crypto.randomUUID(),
      text,
      addedAt: Date.now(),
      tags: [],
      note: '',
      mastery: 'new',
      lookupCount: cachedDef ? 1 : 0,
      cachedDef,
    };
    await persistWords([entry, ...words]);
  };

  const removeWord = async (id: string) => {
    await persistWords(words.filter(w => w.id !== id));
  };

  const removeWords = async (ids: string[]) => {
    const idSet = new Set(ids);
    await persistWords(words.filter(w => !idSet.has(w.id)));
  };

  const clearWords = async () => {
    await persistWords([]);
  };

  const updateWord = async (id: string, updates: Partial<WordEntry>) => {
    await persistWords(words.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const isWordFavorited = (text: string) => {
    return words.some(w => w.text === text);
  };

  return (
    <SettingsContext.Provider value={{
      aiConfig, setAIConfig, exportDir, setExportDir,
      words, addWord, removeWord, removeWords, clearWords, updateWord, isWordFavorited,
      loaded,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
