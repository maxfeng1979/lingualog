export interface WordEntry {
  id: string;
  text: string;
  addedAt: number;
  tags: string[];
  note: string;
  mastery: 'new' | 'learning' | 'familiar' | 'mastered';
  lookupCount: number;
  lastReviewedAt?: number;
  cachedDef?: {
    pos: string;
    definition: string;
    nativeDef: string;
  };
}

export type SortField = 'addedAt' | 'text' | 'lookupCount';
export type SortDir = 'asc' | 'desc';

export const MASTERY_LABELS: Record<WordEntry['mastery'], string> = {
  new: '新词',
  learning: '学习中',
  familiar: '熟悉',
  mastered: '已掌握',
};
