export type Track = 'story' | 'novel' | 'nonfiction' | 'poetry' | 'drama';

// One book on the curated shelf, as written by scripts/build-pool.mjs.
export interface PoolBook {
  id: number;
  title: string;
  author: string;
  track: Track;
  level: number;
  copy: boolean;
  words: number;
  minutes: number;
  fk: number | null;
  rare: number | null;
  downloads: number;
  reason: string;
  quote?: string;
  excerpts: string[];
}

// What the APIs send to the pages.
export interface BookSummary {
  id: number;
  title: string;
  author: string;
  url: string;
  downloads: number;
  level?: number;
  words?: number;
  minutes?: number;
  reason?: string;
  copy?: boolean;
  tags?: string[];
}

export interface RecommendationGroup {
  key: string;
  total: number;
  books: BookSummary[];
}

export interface DailyPick extends BookSummary {
  quote: string;
  quoteKind: 'famous' | 'excerpt';
}
