import { useState, useEffect } from 'react';
import { DiaryEntry } from '../types/ai';

interface CardProps {
  entry: DiaryEntry;
  isOrganized: boolean;
  targetLang: string;
  isBlurred: boolean;
  globalVersion: number;
  onPlayTTS: (text: string, gender?: 'male' | 'female') => void;
  onFavorite: (text: string) => void;
  onBlurToggle: () => void;
  isFavorited?: boolean;
  ttsPlayingKey?: string;
}

export function Card({ entry, isOrganized, targetLang, isBlurred: effectiveBlur, globalVersion, onPlayTTS, onFavorite, onBlurToggle, isFavorited, ttsPlayingKey }: CardProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const displayText = isOrganized ? entry.translated : entry.polished;

  const [localBlur, setLocalBlur] = useState(effectiveBlur);

  useEffect(() => {
    setLocalBlur(effectiveBlur);
  }, [effectiveBlur, globalVersion]);

  useEffect(() => {
    const loadVoices = () => {
      const all = speechSynthesis.getVoices();
      setVoices(all.filter(v => v.lang.startsWith('en')));
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleLocalToggle = () => {
    setLocalBlur(!localBlur);
    onBlurToggle();
  };

  const isPlaying = (gender: 'male' | 'female') => {
    return ttsPlayingKey === `${displayText}:${gender}`;
  };

  const hasTwoVoices = voices.length > 1;
  const isAnyPlaying = hasTwoVoices ? (isPlaying('male') || isPlaying('female')) : isPlaying('male');

  return (
    <div className={`card ${effectiveBlur ? 'card-blurred' : ''}`}>
      <div className="card-toolbar">
        {hasTwoVoices ? (
          <>
            <button className={`card-btn tts-btn ${isPlaying('male') ? 'tts-active' : ''}`} onClick={() => onPlayTTS(displayText, 'male')} style={{ marginLeft: 'auto' }}>{isPlaying('male') ? '⏹ 男声' : '🔊 男声'}</button>
            <button className={`card-btn tts-btn ${isPlaying('female') ? 'tts-active' : ''}`} onClick={() => onPlayTTS(displayText, 'female')}>{isPlaying('female') ? '⏹ 女声' : '🔊 女声'}</button>
          </>
        ) : (
          <button className={`card-btn tts-btn ${isPlaying('male') ? 'tts-active' : ''}`} onClick={() => onPlayTTS(displayText)} style={{ marginLeft: 'auto' }}>{isAnyPlaying ? '⏹ 停止' : '🔊 播放'}</button>
        )}
        <button className="card-btn card-btn-fav" onClick={() => onFavorite(displayText)}>{isFavorited ? '★ 已收藏' : '☆ 收藏'}</button>
        <div className="blur-toggle">
          <span>{effectiveBlur ? '显示' : '遮盖'}</span>
          <button className={`toggle ${effectiveBlur ? 'toggle-on' : 'toggle-off'}`} onClick={handleLocalToggle} />
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
          <div className={`field-text target-text ${effectiveBlur ? 'text-blurred' : ''}`} style={{ cursor: 'text', userSelect: 'text' }}>
            {displayText}
          </div>
          {effectiveBlur && <div className="blur-overlay" />}
        </div>
      </div>
    </div>
  );
}
