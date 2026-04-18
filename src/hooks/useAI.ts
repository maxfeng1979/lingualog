import { useState, useCallback } from 'react';
import { callAI } from '../services/aiService';
import { AIConfig, DiaryEntry } from '../types/ai';
import { LanguageCode } from '../constants/languages';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async (
    content: string,
    mode: 'diary' | 'target',
    config: AIConfig,
    targetLang: LanguageCode,
    diaryLang: LanguageCode
  ): Promise<DiaryEntry[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAI(content, mode, config, targetLang, diaryLang);
      return response.entries;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, process };
}