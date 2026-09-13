'use client';

import { Suspense, useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BookCard from '../../components/BookCard';
import { TAG_LABELS, formatMinutes } from '../../lib/levels';
import type { BookSummary } from '../../lib/types';

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

function bookMeta(book: BookSummary): string[] {
  const meta: string[] = [];
  if (book.minutes) meta.push(`읽기 ${formatMinutes(book.minutes)}`);
  if (book.downloads) meta.push(`최근 다운로드 ${book.downloads.toLocaleString('ko-KR')}회`);
  for (const tag of book.tags ?? []) if (TAG_LABELS[tag]) meta.push(TAG_LABELS[tag]);
  return meta;
}

function SearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get('q') ?? '';

  const [query, setQuery] = useState(urlQuery);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<SearchStatus>('idle');

  const runSearch = useCallback(async (q: string) => {
    setStatus('loading');
    try {
      const response = await fetch(`/api/books?${new URLSearchParams({ q, limit: '24' })}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message ?? `HTTP ${response.status}`);
      setBooks(data.books as BookSummary[]);
      setTotal(data.total ?? 0);
      setStatus('done');
    } catch (error) {
      console.error('Search error:', error);
      setBooks([]);
      setTotal(0);
      setStatus('error');
    }
  }, []);

  // The URL is the source of truth, so searches are shareable and survive back/forward.
  useEffect(() => {
    setQuery(urlQuery);
    if (urlQuery.trim()) {
      runSearch(urlQuery);
    } else {
      setBooks([]);
      setStatus('idle');
    }
  }, [urlQuery, runSearch]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?${new URLSearchParams({ q })}`);
  };

  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Search</p>
        <h1 className="page-title">원서 검색</h1>
        <p className="lede">
          제목이나 작가 이름을 영어로 입력하세요. 아동·청소년 도서, 고전, 시, 희곡, 이야기 서가의 책 가운데서 찾습니다.
        </p>
      </header>

      <form className="search-form" role="search" onSubmit={handleSubmit}>
        <label htmlFor="search-q" className="sr-only">
          검색어
        </label>
        <input
          id="search-q"
          className="field"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: Sherlock, Austen, Poe"
        />
        <button type="submit" className="btn btn-primary" disabled={status === 'loading' || !query.trim()}>
          {status === 'loading' ? '찾는 중…' : '찾기'}
        </button>
      </form>

      {status === 'loading' && <p className="result-count muted">서가를 살피는 중…</p>}

      {status === 'error' && <p className="alert">검색하지 못했습니다. 잠시 후 다시 시도하세요.</p>}

      {status === 'done' && (
        <section aria-live="polite">
          <p className="result-count meta">
            ‘{urlQuery}’ 검색 결과 {total.toLocaleString('ko-KR')}권
            {total > books.length && ` 중 인기순 ${books.length}권`}
          </p>
          {books.length === 0 ? (
            <p className="muted">찾는 책이 없습니다. 철자를 확인하거나 작가 이름으로 검색해 보세요.</p>
          ) : (
            <div className="book-grid">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  url={book.url}
                  level={book.level}
                  reason={book.reason}
                  meta={bookMeta(book)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <p className="page-head muted">검색 화면을 여는 중…</p>
        </main>
      }
    >
      <SearchView />
    </Suspense>
  );
}
