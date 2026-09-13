import { NextRequest, NextResponse } from 'next/server';
import { LEVELS } from '../../../lib/levels';
import { POOL, dateSeed, isIsoDate, seededShuffle, toSummary, todayInKorea } from '../../../lib/pool';
import type { RecommendationGroup } from '../../../lib/types';

const SHELVES = [
  ...LEVELS.map((level) => ({ key: level.key, books: POOL.filter((book) => book.level === level.step) })),
  { key: 'copy', books: POOL.filter((book) => book.copy) },
];

export function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('level') ?? 'all';
    const dateParam = searchParams.get('date');
    const date = isIsoDate(dateParam) ? dateParam : todayInKorea();
    const requested = Number.parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Math.min(Math.max(Number.isNaN(requested) ? (filter === 'all' ? 3 : 12) : requested, 1), 50);

    const shelves = filter === 'all' ? SHELVES : SHELVES.filter((shelf) => shelf.key === filter);
    if (shelves.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid level parameter. Use all, L1-L5, or copy.' },
        { status: 400 },
      );
    }

    const groups: RecommendationGroup[] = shelves.map((shelf) => ({
      key: shelf.key,
      total: shelf.books.length,
      books: seededShuffle(shelf.books, dateSeed(`${date}:${shelf.key}`)).slice(0, limit).map(toSummary),
    }));

    return NextResponse.json({ success: true, date, groups });
  } catch (error) {
    console.error('Recommendations API Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to build recommendations' }, { status: 500 });
  }
}
