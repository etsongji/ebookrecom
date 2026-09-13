import { NextRequest, NextResponse } from 'next/server';
import catalogData from '../../../data/catalog.json';
import { POOL, POOL_BY_ID, gutenbergUrl } from '../../../lib/pool';
import type { BookSummary } from '../../../lib/types';

// Rows written by scripts/build-catalog.mjs: [id, title, author, downloads, tag bitmask].
type CatalogRow = [number, string, string, number, number];

interface IndexEntry {
  id: number;
  title: string;
  author: string;
  downloads: number;
  tagMask: number;
  titleKey: string;
  authorKey: string;
}

const TAG_KEYS = catalogData.tags;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    // Drop possessives so "alice" matches "Alice's Adventures", then join contractions ("don't" -> "dont").
    .replace(/['’]s\b/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

let index: IndexEntry[] | null = null;

function getIndex(): IndexEntry[] {
  if (index) return index;

  const toEntry = (id: number, title: string, author: string, downloads: number, tagMask: number): IndexEntry => ({
    id,
    title,
    author,
    downloads,
    tagMask,
    titleKey: ` ${normalize(title)} `,
    authorKey: ` ${normalize(author)} `,
  });

  const entries = (catalogData.books as unknown as CatalogRow[]).map((row) => toEntry(...row));
  const known = new Set(entries.map((entry) => entry.id));
  for (const book of POOL) {
    if (!known.has(book.id)) entries.push(toEntry(book.id, book.title, book.author, book.downloads, 0));
  }
  index = entries;
  return entries;
}

// Every term must start a word in the title or author. Whole-word hits outrank prefixes,
// so "poe" finds Edgar Allan Poe before books titled "Poems". Popularity breaks ties.
function scoreEntry(entry: IndexEntry, terms: string[], phrase: string): number | null {
  let score = 0;
  for (const term of terms) {
    const word = ` ${term} `;
    const prefix = ` ${term}`;
    if (entry.titleKey.includes(word)) score += 3;
    else if (entry.authorKey.includes(word)) score += 3;
    else if (entry.titleKey.includes(prefix)) score += 1.5;
    else if (entry.authorKey.includes(prefix)) score += 1;
    else return null;
  }
  if (entry.titleKey.trim() === phrase) score += 6;
  else if (entry.titleKey.startsWith(` ${phrase} `)) score += 3;
  if (POOL_BY_ID.has(entry.id)) score += 2;
  return score + Math.log10(entry.downloads + 1);
}

export function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') ?? '').trim().slice(0, 100);
    const requested = Number.parseInt(searchParams.get('limit') ?? '20', 10);
    const limit = Math.min(Math.max(Number.isNaN(requested) ? 20 : requested, 1), 50);
    const phrase = normalize(query);

    if (!phrase) {
      return NextResponse.json(
        { success: false, message: 'Query parameter q is required', books: [] },
        { status: 400 },
      );
    }

    const terms = phrase.split(' ');
    const matches: { entry: IndexEntry; score: number }[] = [];
    for (const entry of getIndex()) {
      const score = scoreEntry(entry, terms, phrase);
      if (score !== null) matches.push({ entry, score });
    }
    matches.sort((a, b) => b.score - a.score);

    // Collapse duplicate editions of the same title and author, keeping the best-scored one.
    // Leading articles are ignored, so "The Adventures of ..." and "Adventures of ..." merge.
    const seen = new Set<string>();
    const distinct = matches.filter(({ entry }) => {
      const key = `${entry.titleKey.replace(/^ (?:the|a|an) /, ' ')}|${entry.authorKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const books: BookSummary[] = distinct.slice(0, limit).map(({ entry }) => {
      const pool = POOL_BY_ID.get(entry.id);
      return {
        id: entry.id,
        title: pool?.title ?? entry.title,
        author: pool?.author ?? entry.author,
        url: gutenbergUrl(entry.id),
        downloads: entry.downloads,
        level: pool?.level,
        words: pool?.words,
        minutes: pool?.minutes,
        reason: pool?.reason,
        copy: pool?.copy,
        tags: TAG_KEYS.filter((_, bit) => (entry.tagMask & (1 << bit)) !== 0),
      };
    });

    return NextResponse.json({ success: true, query, total: distinct.length, books });
  } catch (error) {
    console.error('Books API Error:', error);
    return NextResponse.json({ success: false, message: 'Search failed', books: [] }, { status: 500 });
  }
}
