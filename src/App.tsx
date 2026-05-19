import './App.css';
import { useState, useRef } from 'react';
import { WritePage } from './components/WritePage';
import { ResultPage } from './components/ResultPage';
import { SettingsPage } from './components/SettingsPage';
import { FavoritesPage } from './components/FavoritesPage';
import { Sidebar } from './components/Sidebar';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { LanguageCode } from './constants/languages';
import { DiaryEntry } from './types/ai';
import { useAI } from './hooks/useAI';
import { useTTS } from './hooks/useTTS';

function AppInner() {
  const [page, setPage] = useState<'write' | 'result' | 'settings' | 'favorites'>('write');
  const [resultData, setResultData] = useState<{
    content: string;
    entries: DiaryEntry[];
    diaryLang: LanguageCode;
    targetLang: LanguageCode;
  } | null>(null);
  const [ttsPlayingKey, setTtsPlayingKey] = useState<string>('');
  const { aiConfig, words } = useSettings();
  const { loading, error, process } = useAI();
  const { play } = useTTS();
  const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNavigate = (p: 'write' | 'settings' | 'favorites') => {
    setPage(p);
    if (p === 'write') setResultData(null);
  };

  const handleSubmit = async (content: string, diaryLang: LanguageCode, targetLang: LanguageCode) => {
    const mode = diaryLang === targetLang ? 'target' : 'diary';
    const entries = await process(content, mode, aiConfig, targetLang, diaryLang);
    if (entries.length > 0) {
      setResultData({ content, entries, diaryLang, targetLang });
      setPage('result');
    }
  };

  const handlePlayTTS = (text: string, gender?: 'male' | 'female') => {
    const key = `${text}:${gender || 'male'}`;
    if (ttsPlayingKey === key) {
      speechSynthesis.cancel();
      setTtsPlayingKey('');
      return;
    }
    if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current);
    setTtsPlayingKey(key);
    play(text, gender || 'male').then(() => {
      setTtsPlayingKey(prev => prev === key ? '' : prev);
    });
    ttsTimerRef.current = setTimeout(() => setTtsPlayingKey(''), text.length * 100 + 500);
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={page}
        onNavigate={handleNavigate}
        favoritesCount={words.length}
      />
      <main className="main-content">
        {page === 'favorites' ? (
          <FavoritesPage onPlayTTS={handlePlayTTS} ttsPlayingKey={ttsPlayingKey} />
        ) : page === 'settings' ? (
          <SettingsPage />
        ) : page === 'result' && resultData ? (
          <ResultPage
            content={resultData.content}
            entries={resultData.entries}
            diaryLang={resultData.diaryLang}
            targetLang={resultData.targetLang}
            onBack={() => { setResultData(null); setPage('write'); }}
            onPlayTTS={handlePlayTTS}
            ttsPlayingKey={ttsPlayingKey}
          />
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
            <div style={{ color: '#EF4444', fontSize: 14 }}>{error}</div>
            <button className="submit-btn" onClick={() => setPage('write')}>返回</button>
          </div>
        ) : (
          <WritePage onSubmit={handleSubmit} loading={loading} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}
