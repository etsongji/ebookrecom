'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import PencilMeter from './PencilMeter';
import { practice, streakOf } from '../lib/copy-practice';
import { todayInKorea } from '../lib/dates';
import { LEVELS, LEVEL_MAX, levelOf } from '../lib/levels';
import type { Quote } from '../lib/types';

const STORE_KEY = 'copybook:quote-log:v1';
const KEEP_DAYS = 400;

interface QuoteLog {
  total: number;
  byDate: Record<string, number>;
}

const EMPTY_LOG: QuoteLog = { total: 0, byDate: {} };

function readLog(): QuoteLog {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return EMPTY_LOG;
    const parsed = JSON.parse(raw) as Partial<QuoteLog>;
    if (!parsed.byDate || typeof parsed.byDate !== 'object') return EMPTY_LOG;
    return { total: Number(parsed.total) || 0, byDate: parsed.byDate as Record<string, number> };
  } catch {
    // A private window or blocked site data lands here; practice still works.
    return EMPTY_LOG;
  }
}

function writeLog(log: QuoteLog): void {
  try {
    const dates = Object.keys(log.byDate).sort().slice(-KEEP_DAYS);
    const trimmed: Record<string, number> = {};
    for (const date of dates) trimmed[date] = log.byDate[date];
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ total: log.total, byDate: trimmed }));
  } catch {
    // Nothing to do: the count simply will not survive a reload.
  }
}

const FILTERS = [
  { key: 'all', label: '전체', step: null as number | null },
  ...LEVELS.map((level) => ({ key: level.key, label: `${level.key} ${level.name}`, step: level.step })),
];

interface QuoteCopybookProps {
  quotes: Quote[];
}

export default function QuoteCopybook({ quotes }: QuoteCopybookProps) {
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [log, setLog] = useState<QuoteLog>(EMPTY_LOG);
  const [today, setToday] = useState('');
  const countedRef = useRef<number | null>(null);
  const boxRef = useRef<HTMLTextAreaElement | null>(null);

  // The date and the saved count are read on the client only, so the
  // server-rendered markup and the first client render agree.
  useEffect(() => {
    setToday(todayInKorea());
    setLog(readLog());
  }, []);

  const shown = useMemo(
    () => (filter === 'all' ? quotes : quotes.filter((q) => levelOf(q.level)?.key === filter)),
    [filter, quotes],
  );

  const open = openId === null ? null : (quotes.find((q) => q.bookId === openId) ?? null);
  const result = useMemo(() => (open ? practice(open.text, typed) : null), [open, typed]);
  const done = result?.done ?? false;

  // Count a line once, the moment it is finished.
  useEffect(() => {
    if (!done || openId === null || !today || countedRef.current === openId) return;
    countedRef.current = openId;
    setLog((prev) => {
      const next: QuoteLog = {
        total: prev.total + 1,
        byDate: { ...prev.byDate, [today]: (prev.byDate[today] ?? 0) + 1 },
      };
      writeLog(next);
      return next;
    });
  }, [done, openId, today]);

  const togglePractice = (bookId: number) => {
    const next = openId === bookId ? null : bookId;
    setOpenId(next);
    setTyped('');
    countedRef.current = null;
    if (next !== null) window.setTimeout(() => boxRef.current?.focus(), 0);
  };

  const reset = () => {
    setTyped('');
    countedRef.current = null;
    boxRef.current?.focus();
  };

  const todayCount = today ? (log.byDate[today] ?? 0) : 0;
  const streak = streakOf(log.byDate, today);

  return (
    <>
      <section className="quote-tally no-print" aria-label="필사 기록">
        <p>
          <strong>{todayCount}</strong>
          <span className="meta">오늘 필사</span>
        </p>
        <p>
          <strong>{log.total}</strong>
          <span className="meta">누적 필사</span>
        </p>
        <p>
          <strong>{streak}</strong>
          <span className="meta">연속 일수</span>
        </p>
        <p className="quote-tally-note meta">
          기록은 이 브라우저에만 저장됩니다. 학생별 누적이 필요하면 별도 집계가 필요합니다.
        </p>
      </section>

      <div className="filter-bar no-print" role="group" aria-label="수준 선택">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className="chip"
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
            {item.step !== null && <PencilMeter value={item.step} max={LEVEL_MAX} />}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => window.print()}>
          필사지 인쇄
        </button>
      </div>

      <p className="result-count meta no-print">명언 {shown.length}개</p>

      <ul className="quote-list no-print">
        {shown.map((quote) => {
          const info = levelOf(quote.level);
          const isOpen = openId === quote.bookId;

          return (
            <li key={quote.bookId} className="card quote-card">
              <div className="quote-head">
                {info && (
                  <p className="book-level meta">
                    {info.key} {info.name}
                    <PencilMeter value={info.step} max={LEVEL_MAX} />
                  </p>
                )}
                <p className="meta">{quote.words}단어</p>
              </div>

              <blockquote className="display quote-en">{quote.text}</blockquote>
              {quote.gloss && <p className="quote-gloss">{quote.gloss}</p>}

              <p className="quote-source">
                <cite>{quote.title}</cite>
                <span className="muted"> · {quote.author}</span>
              </p>

              <div className="book-links">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => togglePractice(quote.bookId)}>
                  {isOpen ? '접기' : '따라 쓰기'}
                </button>
                <a className="text-link" href={quote.url} target="_blank" rel="noopener noreferrer">
                  이 책 원문 읽기 <span aria-hidden="true">↗</span>
                </a>
              </div>

              {isOpen && result && (
                <div className="quote-practice">
                  <p className="hand quote-trace" aria-hidden="true">
                    {quote.text}
                  </p>

                  <p className="quote-check" aria-hidden="true">
                    {[...result.target].map((ch, i) => (
                      <span key={i} className={`ch ${result.marks[i]}`}>
                        {ch}
                      </span>
                    ))}
                  </p>

                  <label className="sr-only" htmlFor={`type-${quote.bookId}`}>
                    위 문장을 그대로 입력하세요
                  </label>
                  <textarea
                    id={`type-${quote.bookId}`}
                    ref={boxRef}
                    className="field quote-input"
                    value={typed}
                    rows={2}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="여기에 그대로 입력해 보세요"
                    onChange={(e) => setTyped(e.target.value)}
                  />

                  <div className="quote-score">
                    <p className="meta" aria-live="polite">
                      {result.done ? '완성했습니다.' : `진행 ${result.progress}% · 정확도 ${result.accuracy}%`}
                    </p>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
                      다시
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Hand-copying sheet: hidden on screen, laid out for paper. */}
      <section className="print-sheet" aria-hidden="true">
        <h2 className="display">명언 필사 — {filter === 'all' ? '전체' : filter}</h2>
        {shown.map((quote) => (
          <article key={quote.bookId} className="print-item">
            <p className="display print-en">{quote.text}</p>
            <p className="print-src">
              {quote.title} · {quote.author}
              {quote.gloss && ` / ${quote.gloss}`}
            </p>
            <span className="print-rule" />
            <span className="print-rule" />
          </article>
        ))}
      </section>
    </>
  );
}
