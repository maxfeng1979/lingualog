// src/components/ResultPage.tsx
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Card } from './Card';
import { DiaryEntry } from '../types/ai';
import { LanguageCode, LANGUAGES } from '../constants/languages';
import { buildDiaryMD, exportToFile } from '../services/exportService';
import { useSettings } from '../context/SettingsContext';
import { lookupWord, WordLookupResult } from '../services/aiService';
import { getCachedWord, setCachedWord } from '../services/cacheService';

interface ResultPageProps {
  content: string;
  entries: DiaryEntry[];
  diaryLang: LanguageCode;
  targetLang: LanguageCode;
  onBack: () => void;
  onPlayTTS: (text: string, gender?: 'male' | 'female') => void;
  ttsPlayingKey?: string;
}

// Single state to avoid desync between bubble info and definition
interface BubbleState {
  word: string;
  x: number;
  y: number;
  anchorBottom: number;
  status: 'querying' | 'success' | 'failed';
  def: WordLookupResult | null;
}

export function ResultPage({ content, entries, diaryLang, targetLang, onBack, onPlayTTS, ttsPlayingKey }: ResultPageProps) {
  const { exportDir, words, addWord, removeWord, isWordFavorited, aiConfig } = useSettings();
  const [globalBlur, setGlobalBlur] = useState(false);
  const [globalVersion, setGlobalVersion] = useState(0);
  const targetLangLabel = LANGUAGES.find(l => l.code === targetLang)?.label || targetLang;
  const isOrganized = entries[0]?.translated !== undefined;

  const localOverrides = useRef<Record<number, boolean>>({});
  const [, forceUpdate] = useState(0);

  const [bubble, setBubble] = useState<BubbleState | null>(null);
  const isLookingUp = useRef(false);
  const lookupTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Voices for bubble TTS buttons
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const loadVoices = () => {
      const all = speechSynthesis.getVoices();
      setVoices(all.filter(v => v.lang.startsWith('en')));
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const closeBubble = () => {
    if (lookupTimeoutRef.current !== null) {
      clearTimeout(lookupTimeoutRef.current);
      lookupTimeoutRef.current = null;
    }
    setBubble(null);
    isLookingUp.current = false;
  };

  // Flip bubble above selection if it overflows the viewport
  useLayoutEffect(() => {
    if (!bubble || !bubbleRef.current) return;
    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    if (bubbleRect.bottom > window.innerHeight) {
      setBubble(prev => prev ? { ...prev, y: prev.anchorBottom - bubbleRect.height - 4 } : null);
    }
  }, [bubble?.status, bubble?.word]);

  // Single mouseup handler for the entire cards container
  useEffect(() => {
    const handleMouseUp = async (e: MouseEvent) => {
      if (isLookingUp.current) return;
      // Ignore clicks inside the word bubble
      if (bubbleRef.current?.contains(e.target as Node)) return;
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      if (!selectedText || selectedText.length === 0) return;
      const anchor = selection.anchorNode;
      if (!anchor?.parentElement) return;

      // Find which card contains the selection
      const container = containerRef.current;
      if (!container) return;
      let cardIdx = -1;
      const cards = container.querySelectorAll('.card');
      cards.forEach((card, i) => {
        if (card.contains(anchor.parentElement)) cardIdx = i;
      });
      if (cardIdx === -1) return;

      const entry = entries[cardIdx];
      const displayText = isOrganized ? entry.translated : entry.polished;
      const rect = anchor.parentElement.getBoundingClientRect();
      const x = rect.left;
      const anchorBottom = rect.bottom;
      const y = anchorBottom + 4;

      isLookingUp.current = true;
      // Single state update: new word, querying, no old definition
      setBubble({ word: selectedText, x, y, anchorBottom, status: 'querying', def: null });

      const config = aiConfig;
      if (config?.endpoint && config?.apiKey) {
        // Check cache first
        const cached = await getCachedWord(selectedText).catch(() => null);
        if (cached) {
          setBubble(prev => prev ? { ...prev, status: 'success', def: cached } : null);
          isLookingUp.current = false;
          return;
        }

        // Cache miss: query AI
        lookupTimeoutRef.current = window.setTimeout(() => {
          setBubble(prev => prev ? { ...prev, status: 'failed' } : null);
          isLookingUp.current = false;
          lookupTimeoutRef.current = null;
        }, 30000);
        lookupWord(selectedText, displayText, config)
          .then(async def => {
            if (lookupTimeoutRef.current !== null) {
              clearTimeout(lookupTimeoutRef.current);
              lookupTimeoutRef.current = null;
            }
            await setCachedWord(selectedText, def);
            setBubble(prev => prev ? { ...prev, status: 'success', def } : null);
          })
          .catch(e => {
            if (lookupTimeoutRef.current !== null) {
              clearTimeout(lookupTimeoutRef.current);
              lookupTimeoutRef.current = null;
            }
            console.error('[ResultPage] lookup error:', e.message);
            setBubble(prev => prev ? { ...prev, status: 'failed' } : null);
          })
          .finally(() => { isLookingUp.current = false; });
      } else {
        setBubble(prev => prev ? { ...prev, status: 'failed' } : null);
        isLookingUp.current = false;
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [entries, isOrganized, aiConfig]);

  const handleGlobalToggle = () => {
    const next = !globalBlur;
    setGlobalBlur(next);
    localOverrides.current = {};
    setGlobalVersion(v => v + 1);
  };

  const handleCardLocalToggle = (index: number) => {
    const current = localOverrides.current[index] ?? globalBlur;
    localOverrides.current[index] = !current;
    forceUpdate(v => v + 1);
  };

  const getEffectiveBlur = (index: number) => {
    return localOverrides.current[index] ?? globalBlur;
  };

  const handleExport = async () => {
    if (!exportDir) {
      alert('请先在设置中选择导出目录');
      return;
    }
    const md = buildDiaryMD(content, entries, diaryLang, targetLang);
    const date = new Date().toISOString().split('T')[0];
    const fullPath = `${exportDir}/diary-${date}.md`;
    try {
      const savedPath = await exportToFile(fullPath, md);
      alert(`已保存: ${savedPath}`);
    } catch (e: any) {
      alert(`导出失败: ${e.message || e}`);
    }
  };

  const hasTwoVoices = voices.length > 1;
  const isWordPlaying = (gender: 'male' | 'female') => {
    return bubble && ttsPlayingKey === `${bubble.word}:${gender}`;
  };
  const isWordAnyPlaying = hasTwoVoices
    ? (isWordPlaying('male') || isWordPlaying('female'))
    : !!bubble && ttsPlayingKey === `${bubble.word}:male`;

  return (
    <div className="result-page">
      <header className="result-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <button className="icon-btn" title="导出" onClick={handleExport}>📁</button>
        <span className="result-date">日记：{new Date().toLocaleDateString()}</span>
        <div className="header-right">
          <span>遮盖翻译</span>
          <button
            className={`toggle ${globalBlur ? 'toggle-on' : 'toggle-off'}`}
            onClick={handleGlobalToggle}
          />
        </div>
      </header>

      {/* Single global word bubble */}
      {bubble && (
        <div ref={bubbleRef} className="word-bubble" style={{ position: 'fixed', left: bubble.x, top: bubble.y, zIndex: 200 }}>
          <button className="bubble-close" onClick={closeBubble}>✕</button>
          <div className="bubble-word">{bubble.word}</div>
          <div className="bubble-definition">
            {bubble.status === 'querying' ? (
              <div className="bubble-meaning">查询中...</div>
            ) : bubble.status === 'success' && bubble.def ? (
              <>
                <div className="bubble-pos">{bubble.def.pos}</div>
                <div className="bubble-meaning">{bubble.def.definition}</div>
                {bubble.def.nativeDef && <div className="bubble-meaning" style={{ color: '#6B7280', marginTop: 2 }}>{bubble.def.nativeDef}</div>}
              </>
            ) : (
              <div className="bubble-meaning">查询失败</div>
            )}
          </div>
          <div className="bubble-actions">
            {hasTwoVoices ? (
              <>
                <button className={`bubble-btn tts-btn ${isWordPlaying('male') ? 'tts-active' : ''}`} onClick={() => onPlayTTS(bubble.word, 'male')}>{isWordPlaying('male') ? '⏹' : '🔊'} 男</button>
                <button className={`bubble-btn tts-btn ${isWordPlaying('female') ? 'tts-active' : ''}`} onClick={() => onPlayTTS(bubble.word, 'female')}>{isWordPlaying('female') ? '⏹' : '🔊'} 女</button>
              </>
            ) : (
              <button className={`bubble-btn tts-btn ${isWordAnyPlaying ? 'tts-active' : ''}`} onClick={() => onPlayTTS(bubble.word)}>{isWordAnyPlaying ? '⏹ 停止' : '🔊 发音'}</button>
            )}
            <button className="bubble-btn bubble-btn-fav" onClick={() => {
              const entry = words.find(w => w.text === bubble.word);
              if (entry) removeWord(entry.id);
              else addWord(bubble.word, bubble.status === 'success' && bubble.def ? { pos: bubble.def.pos, definition: bubble.def.definition, nativeDef: bubble.def.nativeDef } : undefined);
            }}>{isWordFavorited(bubble.word) ? '★' : '☆'}</button>
          </div>
        </div>
      )}

      <div className="cards-container" ref={containerRef}>
        {entries.map((entry, i) => (
          <Card
            key={i}
            entry={entry}
            isOrganized={isOrganized}
            targetLang={targetLangLabel}
            isBlurred={getEffectiveBlur(i)}
            globalVersion={globalVersion}
            onPlayTTS={onPlayTTS}
            onFavorite={(text) => {
              const entry = words.find(w => w.text === text);
              if (entry) removeWord(entry.id);
              else addWord(text);
            }}
            onBlurToggle={() => handleCardLocalToggle(i)}
            isFavorited={isWordFavorited(entry.translated || entry.polished || '')}
            ttsPlayingKey={ttsPlayingKey}
          />
        ))}
      </div>
    </div>
  );
}
