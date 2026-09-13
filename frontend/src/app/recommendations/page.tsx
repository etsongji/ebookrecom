'use client';

import { useEffect, useState } from 'react';
import BookCard from '../../components/BookCard';
import PencilMeter from '../../components/PencilMeter';
import { LEVELS, LEVEL_MAX, formatMinutes } from '../../lib/levels';
import type { BookSummary, RecommendationGroup } from '../../lib/types';

type LoadStatus = 'loading' | 'ready' | 'error';

const FILTERS = [
  { key: 'all', label: '전체', step: null },
  ...LEVELS.map((level) => ({ key: level.key, label: `${level.key} ${level.name}`, step: level.step })),
  { key: 'copy', label: '필사용', step: null },
];

function describeShelf(key: string) {
  const level = LEVELS.find((l) => l.key === key);
  if (level) return { title: `${level.key} ${level.name}`, grades: level.grades, note: level.note, step: level.step };
  return {
    title: '필사용',
    grades: '모든 수준',
    note: '운율과 명문장이 살아 있어 따라 쓰기 좋은 시와 산문입니다.',
    step: null,
  };
}

function bookMeta(book: BookSummary): string[] {
  const meta: string[] = [];
  if (book.minutes) meta.push(`읽기 ${formatMinutes(book.minutes)}`);
  if (book.words) meta.push(`${book.words.toLocaleString('ko-KR')}단어`);
  return meta;
}

export default function RecommendationsPage() {
  const [selected, setSelected] = useState('all');
  const [groups, setGroups] = useState<RecommendationGroup[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    (async () => {
      try {
        const params = new URLSearchParams({ level: selected, limit: selected === 'all' ? '3' : '12' });
        const response = await fetch(`/api/recommendations?${params}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message ?? `HTTP ${response.status}`);
        setGroups(json.groups as RecommendationGroup[]);
        setStatus('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Recommendations fetch error:', error);
        setGroups([]);
        setStatus('error');
      }
    })();

    return () => controller.abort();
  }, [selected]);

  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Reading list</p>
        <h1 className="page-title">수준별 추천 도서</h1>
        <p className="lede">
          문장 길이, 어려운 단어의 비율, 분량을 함께 따져 다섯 단계로 나눴습니다. 목록은 날마다 새로 섞입니다.
        </p>
      </header>

      <div className="filter-bar" role="group" aria-label="수준 선택">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className="chip"
            aria-pressed={selected === filter.key}
            onClick={() => setSelected(filter.key)}
          >
            {filter.label}
            {filter.step !== null && <PencilMeter value={filter.step} max={LEVEL_MAX} />}
          </button>
        ))}
      </div>

      {status === 'loading' && <p className="muted">추천 도서를 펼치는 중…</p>}

      {status === 'error' && <p className="alert">추천 도서를 불러오지 못했습니다. 잠시 후 다시 시도하세요.</p>}

      {status === 'ready' &&
        groups.map((group) => {
          const shelf = describeShelf(group.key);
          return (
            <section key={group.key} className="rec-section" aria-labelledby={`rec-${group.key}`}>
              <div className="rec-head">
                <h2 id={`rec-${group.key}`} className="section-title">
                  {shelf.title}
                </h2>
                {shelf.step !== null && <PencilMeter value={shelf.step} max={LEVEL_MAX} />}
                <span className="meta">
                  {shelf.grades} · 전체 {group.total}권
                </span>
                <p>{shelf.note}</p>
              </div>
              <div className="book-grid">
                {group.books.map((book) => (
                  <BookCard
                    key={book.id}
                    title={book.title}
                    author={book.author}
                    url={book.url}
                    level={group.key === 'copy' ? book.level : undefined}
                    reason={book.reason}
                    meta={bookMeta(book)}
                  />
                ))}
              </div>
              {selected === 'all' && group.total > group.books.length && (
                <div className="actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(group.key)}>
                    {shelf.title} {group.total}권 모두 보기
                  </button>
                </div>
              )}
            </section>
          );
        })}
    </main>
  );
}
