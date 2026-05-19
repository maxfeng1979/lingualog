import { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { WordEntry, SortField, SortDir } from '../types/vocabulary';
import { lookupWord } from '../services/aiService';

interface FavoritesPageProps {
  onPlayTTS: (text: string, gender?: 'male' | 'female') => void;
  ttsPlayingKey?: string;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(ts).toLocaleDateString();
}

const SORT_OPTIONS: { field: SortField; dir: SortDir; label: string }[] = [
  { field: 'addedAt', dir: 'desc', label: '最近添加' },
  { field: 'addedAt', dir: 'asc', label: '最早添加' },
  { field: 'text', dir: 'asc', label: 'A → Z' },
  { field: 'text', dir: 'desc', label: 'Z → A' },
  { field: 'lookupCount', dir: 'desc', label: '查询最多' },
];

export function FavoritesPage({ onPlayTTS, ttsPlayingKey }: FavoritesPageProps) {
  const { words, removeWord, removeWords, clearWords, updateWord, aiConfig } = useSettings();
  const [sortIdx, setSortIdx] = useState(0);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WordEntry | null>(null);
  const [lookingUp, setLookingUp] = useState<Set<string>>(new Set());

  const handleLookup = async (word: WordEntry) => {
    if (!aiConfig?.endpoint || !aiConfig?.apiKey) return;
    setLookingUp(prev => new Set(prev).add(word.id));
    try {
      const def = await lookupWord(word.text, word.text, aiConfig);
      await updateWord(word.id, {
        cachedDef: { pos: def.pos, definition: def.definition, nativeDef: def.nativeDef },
        lookupCount: word.lookupCount + 1,
      });
    } catch (e) {
      console.error('[FavoritesPage] lookup error:', e);
    } finally {
      setLookingUp(prev => {
        const next = new Set(prev);
        next.delete(word.id);
        return next;
      });
    }
  };

  const sorted = useMemo(() => {
    const { field, dir } = SORT_OPTIONS[sortIdx];
    return [...words].sort((a, b) => {
      let cmp = 0;
      if (field === 'text') cmp = a.text.localeCompare(b.text);
      else cmp = (a[field] as number) - (b[field] as number);
      return dir === 'desc' ? -cmp : cmp;
    });
  }, [words, sortIdx]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === words.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(words.map(w => w.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleBatchDelete = () => {
    removeWords(Array.from(selected));
    exitSelectMode();
  };

  const handleClearAll = () => {
    clearWords();
    setShowClearConfirm(false);
    exitSelectMode();
  };

  return (
    <div className="favorites-page">
      <header className="favorites-page-header">
        <span className="favorites-page-title">我的收藏</span>
        {words.length > 0 && (
          <span className="favorites-page-count">{words.length} 个词条</span>
        )}
      </header>

      {words.length > 0 && (
        <div className="favorites-page-toolbar">
          <div className="favorites-page-sort">
            <select
              className="favorites-sort-select"
              value={sortIdx}
              onChange={e => setSortIdx(Number(e.target.value))}
            >
              {SORT_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="favorites-page-toolbar-actions">
            {selectMode ? (
              <>
                <button className="card-btn" onClick={selectAll}>
                  {selected.size === words.length ? '取消全选' : '全选'}
                </button>
                <button
                  className="card-btn card-btn-danger"
                  onClick={handleBatchDelete}
                  disabled={selected.size === 0}
                >
                  删除 ({selected.size})
                </button>
                <button className="card-btn" onClick={exitSelectMode}>取消</button>
              </>
            ) : (
              <>
                <button className="card-btn" onClick={() => setSelectMode(true)}>批量管理</button>
                <button className="card-btn card-btn-danger" onClick={() => setShowClearConfirm(true)}>清空</button>
              </>
            )}
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="favorites-confirm-overlay">
          <div className="favorites-confirm-dialog">
            <div>确定清空所有 {words.length} 个收藏？</div>
            <div className="favorites-confirm-actions">
              <button className="card-btn" onClick={() => setShowClearConfirm(false)}>取消</button>
              <button className="card-btn card-btn-danger" onClick={handleClearAll}>确定清空</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="favorites-confirm-overlay">
          <div className="favorites-confirm-dialog">
            <div>确定删除「{deleteTarget.text}」？</div>
            <div className="favorites-confirm-actions">
              <button className="card-btn" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="card-btn card-btn-danger" onClick={() => { removeWord(deleteTarget.id); setDeleteTarget(null); }}>删除</button>
            </div>
          </div>
        </div>
      )}

      <div className="favorites-page-content">
        {words.length === 0 ? (
          <div className="favorites-page-empty">
            <div className="favorites-page-empty-icon">☆</div>
            <div>暂无收藏</div>
            <div className="favorites-page-empty-hint">在学习日记时选词收藏</div>
          </div>
        ) : (
          <div className="favorites-page-list">
            {sorted.map(word => {
              const isPlaying = ttsPlayingKey === `${word.text}:male`;
              const isSelected = selected.has(word.id);
              const isLooking = lookingUp.has(word.id);
              return (
                <div key={word.id} className={`favorites-page-item ${isSelected ? 'favorites-page-item-selected' : ''}`}>
                  {selectMode && (
                    <button
                      className={`favorites-checkbox ${isSelected ? 'checked' : ''}`}
                      onClick={() => toggleSelect(word.id)}
                    />
                  )}
                  <div className="favorites-page-item-main">
                    <div className="favorites-page-item-word">
                      <span className="favorites-page-item-text">{word.text}</span>
                      {word.lookupCount > 0 && (
                        <span className="favorites-page-item-lookup" title={`查询 ${word.lookupCount} 次`}>{word.lookupCount}x</span>
                      )}
                    </div>
                    {isLooking ? (
                      <div className="favorites-page-item-def">
                        <span className="favorites-page-item-meaning">查询中...</span>
                      </div>
                    ) : word.cachedDef ? (
                      <div className="favorites-page-item-def">
                        <span className="favorites-page-item-pos">{word.cachedDef.pos}</span>
                        <span className="favorites-page-item-meaning">{word.cachedDef.definition}</span>
                        {word.cachedDef.nativeDef && (
                          <span className="favorites-page-item-native">{word.cachedDef.nativeDef}</span>
                        )}
                      </div>
                    ) : (
                      <button className="favorites-lookup-btn" onClick={() => handleLookup(word)} disabled={!aiConfig?.apiKey}>
                        查询释义
                      </button>
                    )}
                    <div className="favorites-page-item-meta">{relativeTime(word.addedAt)}</div>
                  </div>
                  {!selectMode && (
                    <div className="favorites-page-item-actions">
                      <button
                        className={`card-btn tts-btn ${isPlaying ? 'tts-active' : ''}`}
                        onClick={() => onPlayTTS(word.text, 'male')}
                      >
                        {isPlaying ? '⏹' : '🔊'}
                      </button>
                      <button className="card-btn" onClick={() => setDeleteTarget(word)}>
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
