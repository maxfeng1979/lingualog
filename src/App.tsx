import './App.css';
import { useState } from 'react';
import { WritePage } from './components/WritePage';
import { ResultPage } from './components/ResultPage';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { LanguageCode } from './constants/languages';
import { DiaryEntry } from './types/ai';
import { useAI } from './hooks/useAI';
import { useTTS } from './hooks/useTTS';

function AppInner() {
  const [resultData, setResultData] = useState<{
    content: string;
    entries: DiaryEntry[];
    diaryLang: LanguageCode;
    targetLang: LanguageCode;
  } | null>(null);
  const { aiConfig } = useSettings();
  const { loading, error, process } = useAI();
  const { play } = useTTS();

  const handleSubmit = async (content: string, diaryLang: LanguageCode, targetLang: LanguageCode) => {
    const mode = diaryLang === targetLang ? 'target' : 'diary';
    const entries = await process(content, mode, aiConfig, targetLang, diaryLang);
    if (entries.length > 0) {
      setResultData({ content, entries, diaryLang, targetLang });
    }
  };

  const handlePlayTTS = (text: string) => {
    play(text, 'male'); // default to male
  };

  if (resultData) {
    return (
      <ResultPage
        content={resultData.content}
        entries={resultData.entries}
        diaryLang={resultData.diaryLang}
        targetLang={resultData.targetLang}
        onBack={() => setResultData(null)}
        onPlayTTS={handlePlayTTS}
      />
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>处理中...</div>;
  }

  if (error) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'red' }}>{error}</div>;
  }

  return <WritePage onSubmit={handleSubmit} />;
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}