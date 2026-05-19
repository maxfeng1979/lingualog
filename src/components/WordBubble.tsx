import { useEffect, useRef, useState } from 'react';
import { WordLookupResult } from '../services/aiService';

interface WordBubbleProps {
  word: string;
  sentence: string;
  x: number;
  y: number;
  definition?: WordLookupResult | null;
  loading?: boolean;
  onClose: () => void;
  onPlayTTS: (text: string, gender?: 'male' | 'female') => void;
  onFavorite: (text: string) => void;
  isFavorited?: boolean;
  ttsPlayingKey?: string;
}

export function WordBubble({ word, sentence, x, y, definition, loading, onClose, onPlayTTS, onFavorite, isFavorited, ttsPlayingKey }: WordBubbleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [renderKey, setRenderKey] = useState(0);

  console.log('[WordBubble] rendering:', { word, sentence, x, y, definition, loading, renderKey });

  useEffect(() => {
    // Force re-render when word changes
    setRenderKey(k => k + 1);
  }, [word, x, y]);
      const all = speechSynthesis.getVoices();
      setVoices(all.filter(v => v.lang.startsWith('en')));
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const isPlaying = (gender: 'male' | 'female') => {
    return ttsPlayingKey === `${word}:${gender}`;
  };

  const hasTwoVoices = voices.length > 1;

  return (
    <div ref={ref} className="word-bubble" style={{ left: x, top: y }}>
      <div className="bubble-word">{word}</div>
      <div className="bubble-definition">
        {loading ? (
          <div className="bubble-meaning">查询中...</div>
        ) : definition ? (
          <>
            <div className="bubble-pos">{definition.pos}</div>
            <div className="bubble-meaning">{definition.definition}</div>
            {sentence && (
              <div className="bubble-sentence">例: {sentence}</div>
            )}
          </>
        ) : (
          <div className="bubble-meaning">点击发音按钮听读音</div>
        )}
      </div>
      <div className="bubble-actions">
        {hasTwoVoices ? (
          <>
            <button
              className={`bubble-btn tts-btn ${isPlaying('male') ? 'tts-active' : ''}`}
              onClick={() => onPlayTTS(word, 'male')}
            >{isPlaying('male') ? '⏹' : '🔊'} 男</button>
            <button
              className={`bubble-btn tts-btn ${isPlaying('female') ? 'tts-active' : ''}`}
              onClick={() => onPlayTTS(word, 'female')}
            >{isPlaying('female') ? '⏹' : '🔊'} 女</button>
          </>
        ) : (
          <button
            className={`bubble-btn tts-btn ${isPlaying('male') ? 'tts-active' : ''}`}
            onClick={() => onPlayTTS(word)}
          >{isPlaying('male') ? '⏹ 停止' : '🔊 发音'}</button>
        )}
        <button className="bubble-btn bubble-btn-fav" onClick={() => onFavorite(word)}>
          {isFavorited ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}
