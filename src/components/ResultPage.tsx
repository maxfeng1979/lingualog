// src/components/ResultPage.tsx
import { useState, useEffect } from 'react';
import { Card } from './Card';
import { WordBubble } from './WordBubble';
import { DiaryEntry } from '../types/ai';
import { LanguageCode, LANGUAGES } from '../constants/languages';

interface ResultPageProps {
  content: string;
  entries: DiaryEntry[];
  diaryLang: LanguageCode;
  targetLang: LanguageCode;
  onBack: () => void;
  onPlayTTS: (text: string) => void;
}

interface WordLookup {
  word: string;
  x: number;
  y: number;
}

export function ResultPage({ entries, targetLang, onBack, onPlayTTS }: ResultPageProps) {
  const [globalBlur, setGlobalBlur] = useState(false);
  const [wordLookup, setWordLookup] = useState<WordLookup | null>(null);
  const targetLangLabel = LANGUAGES.find(l => l.code === targetLang)?.label || targetLang;
  const isOrganized = entries[0]?.translated !== undefined;

  useEffect(() => {
    const handler = (e: CustomEvent<{ word: string; x: number; y: number }>) => {
      setWordLookup({ word: e.detail.word, x: e.detail.x, y: e.detail.y });
    };
    window.addEventListener('word-lookup' as any, handler);
    return () => window.removeEventListener('word-lookup' as any, handler);
  }, []);

  return (
    <div className="result-page">
      <header className="result-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <span className="result-date">日记：{new Date().toLocaleDateString()}</span>
        <div className="header-right">
          <span>遮盖翻译</span>
          <button
            className={`toggle ${globalBlur ? 'toggle-on' : 'toggle-off'}`}
            onClick={() => setGlobalBlur(!globalBlur)}
          />
        </div>
      </header>

      <div className="cards-container">
        {entries.map((entry, i) => (
          <Card
            key={i}
            entry={entry}
            isOrganized={isOrganized}
            targetLang={targetLangLabel}
            globalBlur={globalBlur}
            onPlayTTS={onPlayTTS}
            onFavorite={(text, type) => console.log('favorite:', text, type)}
            onWordSelect={(word, x, y) => setWordLookup({ word, x, y })}
          />
        ))}
      </div>

      {wordLookup && (
        <WordBubble
          word={wordLookup.word}
          x={wordLookup.x}
          y={wordLookup.y}
          onClose={() => setWordLookup(null)}
          onPlayTTS={onPlayTTS}
          onFavorite={(word) => console.log('fav word:', word)}
        />
      )}
    </div>
  );
}