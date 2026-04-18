import './App.css';
import { useState } from 'react';
import { WritePage } from './components/WritePage';
import { ResultPage } from './components/ResultPage';
import { LanguageCode } from './constants/languages';
import { DiaryEntry } from './types/ai';

function App() {
  const [resultData, setResultData] = useState<{
    content: string;
    entries: DiaryEntry[];
    diaryLang: LanguageCode;
    targetLang: LanguageCode;
  } | null>(null);

  const handleSubmit = (content: string, diaryLang: LanguageCode, targetLang: LanguageCode) => {
    // Mock data for now — will wire to AI in Task 6
    const mockEntries: DiaryEntry[] = content.split('\n').filter(Boolean).map(s => ({
      original: s.trim(),
      organized: s.trim(),
      translated: `[翻译结果 — 待接入 AI服务]`,
      polished: '',
    }));
    setResultData({ content, entries: mockEntries, diaryLang, targetLang });
  };

  const handlePlayTTS = (text: string) => {
    console.log('TTS:', text);
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

  return <WritePage onSubmit={handleSubmit} />;
}

export default App;