// src/components/WordBubble.tsx
import { useEffect, useRef } from 'react';

interface WordBubbleProps {
  word: string;
  x: number;
  y: number;
  onClose: () => void;
  onPlayTTS: (text: string) => void;
  onFavorite: (text: string) => void;
}

export function WordBubble({ word, x, y, onClose, onPlayTTS, onFavorite }: WordBubbleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={ref} className="word-bubble" style={{ left: x, top: y }}>
      <div className="bubble-word">{word}</div>
      <div className="bubble-definition">
        <div className="bubble-phonetic">/.../</div>
        <div className="bubble-meaning">释义由AI生成，仅供参考</div>
      </div>
      <div className="bubble-actions">
        <button className="bubble-btn" onClick={() => onPlayTTS(word)}>🔊 发音</button>
        <button className="bubble-btn bubble-btn-fav" onClick={() => onFavorite(word)}>⭐ 收藏</button>
      </div>
    </div>
  );
}