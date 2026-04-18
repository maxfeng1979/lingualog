import { useState } from 'react';
import { LanguageSelect } from './LanguageSelect';
import { LANGUAGES, LanguageCode, DEFAULT_DIARY_LANG, DEFAULT_TARGET_LANG } from '../constants/languages';

interface WritePageProps {
  onSubmit: (content: string, diaryLang: LanguageCode, targetLang: LanguageCode) => void;
  onSettings?: () => void;
}

export function WritePage({ onSubmit, onSettings }: WritePageProps) {
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
      <header className="write-header">
        <div style={{ flex: 1 }} />
        <span className="app-title">LinguaLog</span>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="icon-btn" title="历史">📁</button>
          <button className="icon-btn" title="设置" onClick={onSettings}>⚙️</button>
        </div>
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
      />

      <div className="submit-row">
        <button className="submit-btn" onClick={handleSubmit}>
          提交 →
        </button>
      </div>
    </div>
  );
}
