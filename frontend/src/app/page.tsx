'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import PencilMeter from '../components/PencilMeter';
import { LEVEL_MAX, formatMinutes, levelOf } from '../lib/levels';
import { storytelSearchUrl } from '../lib/links';
import type { DailyPick } from '../lib/types';

type LoadStatus = 'loading' | 'ready' | 'error';

// The handwriting line models copying just the opening phrase, not the whole passage.
function openingPhrase(passage: string, maxWords = 8): string {
  const firstClause = passage.split(/[,;:—\n]/)[0].trim();
  const words = firstClause.split(/\s+/);
  return words.length > maxWords ? `${words.slice(0, maxWords).join(' ')}…` : firstClause;
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [dailyPick, setDailyPick] = useState<DailyPick | null>(null);
  const [dayMessage, setDayMessage] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch('/api/daily-pick', { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success || !data.dailyPick) throw new Error(data.message ?? `HTTP ${response.status}`);
        setDailyPick(data.dailyPick as DailyPick);
        setDayMessage(data.dayMessage ?? '');
        setDate(data.date ?? '');
        setStatus('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch daily pick:', error);
        setStatus('error');
      }
    })();

    return () => controller.abort();
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  const pickLevel = levelOf(dailyPick?.level);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Project Gutenberg 무료 영어 원서</p>
        <h1 className="display hero-title">
          읽고, <em className="hl">따라 쓰는</em> 영어 원서
        </h1>
        <p className="lede">
          저작권이 끝난 고전을 내 수준에 맞게 고르고, 마음에 드는 문장은 공책에 옮겨 적어 보세요.
        </p>

        <form className="search-form" role="search" onSubmit={handleSearch}>
          <label htmlFor="home-q" className="sr-only">
            책 제목이나 작가
          </label>
          <input
            id="home-q"
            className="field"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·작가를 영어로 — 예: Sherlock, Austen"
          />
          <button type="submit" className="btn btn-primary">
            찾기
          </button>
        </form>

        <div className="quick-links">
          <Link href="/recommendations">수준별 추천 도서 보기</Link>
          <Link href="/search?q=poems">필사하기 좋은 시집 찾기</Link>
        </div>
      </section>

      <section className="section" aria-labelledby="daily-title">
        <div className="section-head">
          <h2 id="daily-title" className="section-title">
            오늘의 필사
          </h2>
          {date && (
            <p className="meta">
              {date}
              {dayMessage && ` · ${dayMessage}`}
            </p>
          )}
        </div>

        {status === 'loading' && <p className="muted">오늘의 문장을 펼치는 중…</p>}

        {status === 'error' && (
          <p className="alert">
            오늘의 추천을 불러오지 못했습니다. <Link href="/recommendations">추천 도서 목록</Link>에서 골라 보세요.
          </p>
        )}

        {status === 'ready' && dailyPick && (
          <article className="card daily-card">
            <div>
              {pickLevel && (
                <p className="book-level meta">
                  {pickLevel.key} {pickLevel.name}
                  <PencilMeter value={pickLevel.step} max={LEVEL_MAX} />
                </p>
              )}
              <h3 className="display book-title">{dailyPick.title}</h3>
              <p className="book-author">{dailyPick.author}</p>
              {dailyPick.minutes && (
                <p className="book-meta meta">
                  <span>읽기 {formatMinutes(dailyPick.minutes)}</span>
                  {dailyPick.words && <span>{dailyPick.words.toLocaleString('ko-KR')}단어</span>}
                </p>
              )}
              <p className="book-reason">{dailyPick.reason}</p>
              <div className="actions">
                <a className="btn btn-primary" href={dailyPick.url} target="_blank" rel="noopener noreferrer">
                  원문 읽기 <span aria-hidden="true">↗</span>
                </a>
                <Link className="btn btn-ghost" href="/recommendations">
                  다른 책 보기
                </Link>
                <a
                  className="text-link"
                  href={storytelSearchUrl(dailyPick.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  스토리텔에서 오디오북 찾기 <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <figure className="copy">
              <blockquote className="display copy-en" style={{ whiteSpace: 'pre-line' }}>
                {dailyPick.quote}
              </blockquote>
              <p className="hand copy-hand" aria-hidden="true">
                {openingPhrase(dailyPick.quote)}
              </p>
              <figcaption className="meta">
                {dailyPick.quoteKind === 'famous' ? '이 책의 유명한 문장' : '원문에서 고른 문장'} · 아래 줄에 따라 써 보세요
              </figcaption>
            </figure>
          </article>
        )}
      </section>

      <section className="section" aria-labelledby="steps-title">
        <div className="section-head">
          <h2 id="steps-title" className="section-title">
            이렇게 써 보세요
          </h2>
        </div>
        <ol className="step-list">
          <li>
            <span className="display step-no">1</span>
            <div>
              <h3>수준에 맞는 책 고르기</h3>
              <p>L1 입문부터 L5 심화까지 다섯 단계 가운데 지금 읽기 편한 책을 고릅니다.</p>
            </div>
          </li>
          <li>
            <span className="display step-no">2</span>
            <div>
              <h3>원문 펼치기</h3>
              <p>Project Gutenberg에서 무료 원문을 바로 엽니다. 가입은 필요 없습니다.</p>
            </div>
          </li>
          <li>
            <span className="display step-no">3</span>
            <div>
              <h3>한 문장 따라 쓰기</h3>
              <p>마음에 드는 문장을 공책에 옮겨 적으며 표현을 내 것으로 만듭니다.</p>
            </div>
          </li>
        </ol>
      </section>
    </main>
  );
}
