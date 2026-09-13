'use client';

import { Suspense, useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BookCard from '../../components/BookCard';

interface Book {
  id: string;
  title: string;
  author: string;
  downloads: number;
  subjects: string[];
  language: string;
  rating?: number;
  rating_count?: number;
  url: string;
  level?: string;
}

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

function SearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const urlLevel = params.get('level') ?? 'all';

  const [query, setQuery] = useState(urlQuery);
  const [level, setLevel] = useState(urlLevel);
  const [books, setBooks] = useState<Book[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [notice, setNotice] = useState('');

  const runSearch = useCallback(async (q: string, lv: string) => {
    setStatus('loading');
    setNotice('');
    try {
      const response = await fetch(`/api/books?${new URLSearchParams({ q, level: lv, limit: '20' })}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setBooks(Array.isArray(data.books) ? data.books : []);
      if (data.success === false) setNotice('검색 서버가 응답하지 않아 기본 목록을 보여 줍니다.');
      setStatus('done');
    } catch (error) {
      console.error('Search error:', error);
      setBooks([]);
      setStatus('error');
    }
  }, []);

  // The URL is the source of truth, so searches are shareable and survive back/forward.
  useEffect(() => {
    setQuery(urlQuery);
    setLevel(urlLevel);
    if (urlQuery.trim()) {
      runSearch(urlQuery, urlLevel);
    } else {
      setBooks([]);
      setStatus('idle');
    }
  }, [urlQuery, urlLevel, runSearch]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?${new URLSearchParams({ q, level })}`);
  };

  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Search</p>
        <h1 className="page-title">원서 검색</h1>
        <p className="lede">제목이나 작가 이름을 영어로 입력하세요. 예: Sherlock, Austen, Poe</p>
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
          placeholder="Title or author"
        />
        <label htmlFor="search-level" className="sr-only">
          수준
        </label>
        <select
          id="search-level"
          className="field field-select"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="all">모든 수준</option>
          <option value="beginner">초급</option>
          <option value="intermediate">중급</option>
          <option value="advanced">고급</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={status === 'loading' || !query.trim()}>
          {status === 'loading' ? '찾는 중…' : '찾기'}
        </button>
      </form>

      {status === 'loading' && (
        <p className="result-count muted">구텐베르크 서가를 살피는 중입니다. 처음 검색은 조금 걸릴 수 있습니다.</p>
      )}

      {status === 'error' && <p className="alert">검색하지 못했습니다. 잠시 후 다시 시도하세요.</p>}

      {status === 'done' && (
        <section aria-live="polite">
          <p className="result-count meta">
            ‘{urlQuery}’ 검색 결과 {books.length}권
          </p>
          {notice && <p className="alert">{notice}</p>}
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
                  meta={[
                    `다운로드 ${book.downloads.toLocaleString('ko-KR')}회`,
                    ...(book.subjects[0] ? [book.subjects[0]] : []),
                  ]}
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
