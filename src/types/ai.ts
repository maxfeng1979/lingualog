// src/types/ai.ts
export interface DiaryEntry {
  original: string;
  organized: string;       // 源语言模式：AI整理后的原文
  translated: string;     // 源语言模式：翻译
  polished: string;      // 目标语言模式：润色后
}

export interface AIResponse {
  entries: DiaryEntry[];
}

export type AIProvider = 'openai' | 'anthropic';

export interface AIConfig {
  provider: AIProvider;
  endpoint: string;
  apiKey: string;
  model: string;
}
