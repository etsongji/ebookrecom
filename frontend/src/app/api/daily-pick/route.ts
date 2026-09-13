import { NextRequest, NextResponse } from 'next/server';
import { POOL, dateSeed, isIsoDate, toSummary, todayInKorea } from '../../../lib/pool';
import type { DailyPick } from '../../../lib/types';

const DAY_MESSAGES = [
  '일요일의 여유로운 독서',
  '월요일을 시작하는 문장',
  '화요일의 활력을 주는 이야기',
  '수요일, 한 주의 한가운데서 쉬어 가기',
  '목요일 저녁의 깊이 있는 읽기',
  '금요일을 마무리하는 문장',
  '토요일의 느긋한 필사',
];

const CANDIDATES = POOL.filter((book) => book.quote || book.excerpts.length > 0);

export function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const date = isIsoDate(dateParam) ? dateParam : todayInKorea();
    if (CANDIDATES.length === 0) throw new Error('Reading shelf has no passages');

    const seed = dateSeed(`daily:${date}`);
    const book = CANDIDATES[seed % CANDIDATES.length];
    const dailyPick: DailyPick = book.quote
      ? { ...toSummary(book), quote: book.quote, quoteKind: 'famous' }
      : { ...toSummary(book), quote: book.excerpts[(seed >>> 8) % book.excerpts.length], quoteKind: 'excerpt' };
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();

    return NextResponse.json({ success: true, date, dayMessage: DAY_MESSAGES[weekday], dailyPick });
  } catch (error) {
    console.error('Daily Pick API Error:', error);
    return NextResponse.json({ success: false, message: "Failed to pick today's book" }, { status: 500 });
  }
}
