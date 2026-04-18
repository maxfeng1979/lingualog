// src/components/Card.tsx
import { useState } from 'react';
import { DiaryEntry } from '../types/ai';

interface CardProps {
  entry: DiaryEntry;
  isOrganized: boolean;     // true = diary mode (has translated), false = target mode
  targetLang: string;
  globalBlur: boolean;
  onPlayTTS: (text: string) => void;
  onFavorite: (text: string, type: 'sentence' | 'word' | 'phrase') => void;
  onWordSelect: (word: string, x: number, y: number) => void;
}

export function Card({ entry, isOrganized, targetLang, globalBlur, onPlayTTS, onFavorite, onWordSelect }: CardProps) {
  const [localBlur, setLocalBlur] = useState(false);
  const isBlurred = globalBlur || localBlur;
  const displayText = isOrganized ? entry.translated : entry.polished;

  const handleTextMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText && selectedText.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      onWordSelect(selectedText, rect.left, rect.bottom + 4);
    }
  };

  return (
    <div className={`card ${isBlurred ? 'card-blurred' : ''}`}>
      <div className="card-toolbar">
        <button className="card-btn" onClick={() => onPlayTTS(displayText)}>🔊 男声</button>
        <button className="card-btn" onClick={() => onPlayTTS(displayText)}>🔊 女声</button>
        <button className="card-btn card-btn-fav" onClick={() => onFavorite(displayText, 'sentence')}>⭐ 收藏</button>
        <div style={{ flex: 1 }} />
        <div className="blur-toggle">
          <span>{isBlurred ? '显示' : '遮盖'}</span>
          <button
            className={`toggle ${isBlurred ? 'toggle-on' : 'toggle-off'}`}
            onClick={() => setLocalBlur(!localBlur)}
          />
        </div>
      </div>
      <div className="card-body">
        <div className="card-left">
          <div className="field">
            <span className="field-label">原文</span>
            <div className="field-text">{entry.original}</div>
          </div>
          {entry.organized && (
            <div className="field">
              <span className="field-label field-label-blue">润色后</span>
              <div className="field-text">{entry.organized}</div>
            </div>
          )}
        </div>
        <div className="card-right">
          <span className="field-label">{targetLang}</span>
          <div
            className={`field-text target-text ${isBlurred ? 'text-blurred' : ''}`}
            onMouseUp={handleTextMouseUp}
            style={{ cursor: 'text', userSelect: 'text' }}
          >
            {displayText}
          </div>
          {isBlurred && <div className="blur-overlay" />}
        </div>
      </div>
    </div>
  );
}