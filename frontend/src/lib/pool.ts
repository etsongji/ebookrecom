import poolData from '../data/pool.json';
import type { BookSummary, PoolBook } from './types';

export const POOL = poolData.books as unknown as PoolBook[];
export const POOL_BY_ID = new Map(POOL.map((book) => [book.id, book]));

export function gutenbergUrl(id: number): string {
  return `https://www.gutenberg.org/ebooks/${id}`;
}

export function toSummary(book: PoolBook): BookSummary {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    url: gutenbergUrl(book.id),
    downloads: book.downloads,
    level: book.level,
    words: book.words,
    minutes: book.minutes,
    reason: book.reason,
    copy: book.copy,
  };
}

// Recommendations turn over at midnight in Korea, not UTC.
export function todayInKorea(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isIsoDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function dateSeed(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
