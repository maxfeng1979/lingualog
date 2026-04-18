// src/services/exportService.ts
import { DiaryEntry } from '../types/ai';
import { LanguageCode, LANGUAGES } from '../constants/languages';

export function buildDiaryMD(
  content: string,
  entries: DiaryEntry[],
  diaryLang: LanguageCode,
  targetLang: LanguageCode,
): string {
  const date = new Date().toISOString().split('T')[0];
  const diaryLangLabel = LANGUAGES.find(l => l.code === diaryLang)?.label || diaryLang;
  const targetLangLabel = LANGUAGES.find(l => l.code === targetLang)?.label || targetLang;
  const isDiaryMode = entries[0]?.translated !== undefined;

  const lines: string[] = [
    `# 日记：${date}`,
    `日记语言 → 目标语言: ${diaryLangLabel} → ${targetLangLabel}`,
    '',
    '## 原文',
    content,
    '',
  ];

  if (isDiaryMode) {
    // 日记语言模式: 有 organized + translated
    lines.push('## 润色后');
    entries.forEach(e => lines.push(e.organized));
    lines.push('', '## 翻译');
    entries.forEach(e => lines.push(`- ${e.translated}`));
  } else {
    // 目标语言模式: 只有 polished
    lines.push('## 润色后');
    entries.forEach(e => lines.push(e.polished));
  }

  return lines.join('\n');
}