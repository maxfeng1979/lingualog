import { useState } from 'react';
import { LanguageSelect } from './LanguageSelect';
import { LANGUAGES, LanguageCode, DEFAULT_DIARY_LANG, DEFAULT_TARGET_LANG } from '../constants/languages';

interface WritePageProps {
  onSubmit: (content: string, diaryLang: LanguageCode, targetLang: LanguageCode) => void;
  loading?: boolean;
}

export function WritePage({ onSubmit, loading }: WritePageProps) {
  const [diaryLang, setDiaryLang] = useState<LanguageCode>(DEFAULT_DIARY_LANG);
  const [targetLang, setTargetLang] = useState<LanguageCode>(DEFAULT_TARGET_LANG);
  const [content, setContent] = useState('');

  const diaryLangLabel = LANGUAGES.find(l => l.code === diaryLang)?.label || diaryLang;
  const placeholder = `Write in ${diaryLangLabel}...`;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content, diaryLang, targetLang);
  };

  return (
    <div className="write-page">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">AI 正在处理...</div>
        </div>
      )}

      <header className="write-header">
        <span className="app-title">LinguaLog</span>
      </header>

      <div className="lang-row">
        <LanguageSelect label="日记语言" value={diaryLang} onChange={setDiaryLang} />
        <span className="lang-arrow">→</span>
        <LanguageSelect label="目标语言" value={targetLang} onChange={setTargetLang} target />
      </div>

      <textarea
        className="diary-input"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
      />

      <div className="submit-row">
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '处理中...' : '提交 →'}
        </button>
      </div>
    </div>
  );
}
