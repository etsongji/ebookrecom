'use client';

import { useEffect, useState } from 'react';
import BookCard from '../../components/BookCard';
import PencilMeter from '../../components/PencilMeter';
import { LEVEL_MAX } from '../../lib/levels';

interface Recommendation {
  id: string;
  title: string;
  author: string;
  reason: string;
  difficulty_score: number;
  url: string;
  rating: number;
}

type SectionKey = 'beginner' | 'intermediate' | 'advanced' | 'transcription';
type FilterKey = 'all' | SectionKey;
type RecommendationData = Partial<Record<SectionKey, Recommendation[]>>;
type LoadStatus = 'loading' | 'ready' | 'fallback';

const FILTERS: { key: FilterKey; label: string; step: number | null }[] = [
  { key: 'all', label: '전체', step: null },
  { key: 'beginner', label: '초급', step: 1 },
  { key: 'intermediate', label: '중급', step: 2 },
  { key: 'advanced', label: '고급', step: 3 },
  { key: 'transcription', label: '필사용', step: null },
];

const SECTIONS: { key: SectionKey; title: string; step: number | null; note: string }[] = [
  { key: 'beginner', title: '초급', step: 1, note: '짧은 문장과 익숙한 이야기로 원서 읽기를 시작합니다.' },
  { key: 'intermediate', title: '중급', step: 2, note: '인물 관계와 묘사가 풍부해지는 고전 소설입니다.' },
  { key: 'advanced', title: '고급', step: 3, note: '긴 문장과 깊은 주제를 끝까지 따라가는 도전 도서입니다.' },
  { key: 'transcription', title: '필사용', step: null, note: '운율과 명문장이 살아 있어 따라 쓰기 좋은 시와 산문입니다.' },
];

// Shown when the recommendations API is unreachable.
const FALLBACK: Record<SectionKey, Recommendation[]> = {
  beginner: [
    {
      id: 'rec_1',
      title: "Alice's Adventures in Wonderland",
      author: 'Lewis Carroll',
      reason: '간단한 문장 구조와 상상력이 풍부한 스토리로 영어 읽기에 입문하기 좋습니다.',
      difficulty_score: 3.2,
      url: 'https://www.gutenberg.org/ebooks/11',
      rating: 4.2,
    },
    {
      id: 'rec_2',
      title: 'The Adventures of Tom Sawyer',
      author: 'Mark Twain',
      reason: '미국 문학의 고전으로 일상적인 영어 표현을 자연스럽게 학습할 수 있습니다.',
      difficulty_score: 3.5,
      url: 'https://www.gutenberg.org/ebooks/74',
      rating: 4.1,
    },
    {
      id: 'rec_3',
      title: 'Anne of Green Gables',
      author: 'L. M. Montgomery',
      reason: '따뜻한 감정을 담은 아름다운 영어 표현을 배울 수 있는 작품입니다.',
      difficulty_score: 3.4,
      url: 'https://www.gutenberg.org/ebooks/45',
      rating: 4.3,
    },
  ],
  intermediate: [
    {
      id: 'rec_4',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      reason: '영국식 영어의 우아한 표현과 복잡한 인물 관계를 통해 중급 영어 실력을 기를 수 있습니다.',
      difficulty_score: 4.2,
      url: 'https://www.gutenberg.org/ebooks/1342',
      rating: 4.5,
    },
    {
      id: 'rec_5',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      reason: '20세기 미국 문학의 걸작으로 상징적 표현과 서술 기법을 학습할 수 있습니다.',
      difficulty_score: 4.0,
      url: 'https://www.gutenberg.org/ebooks/64317',
      rating: 4.2,
    },
    {
      id: 'rec_6',
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      reason: '심리적 묘사가 뛰어난 고딕 로맨스 소설로 문학적 영어 표현을 익힐 수 있습니다.',
      difficulty_score: 4.1,
      url: 'https://www.gutenberg.org/ebooks/1260',
      rating: 4.4,
    },
  ],
  advanced: [
    {
      id: 'rec_7',
      title: 'Ulysses',
      author: 'James Joyce',
      reason: '현대 문학의 대표작으로 의식의 흐름 기법과 고도의 언어 실험을 경험할 수 있습니다.',
      difficulty_score: 5.0,
      url: 'https://www.gutenberg.org/ebooks/4300',
      rating: 4.0,
    },
    {
      id: 'rec_8',
      title: 'The Picture of Dorian Gray',
      author: 'Oscar Wilde',
      reason: '철학적 주제와 아름다운 산문체로 고급 영어 표현력을 기를 수 있습니다.',
      difficulty_score: 4.7,
      url: 'https://www.gutenberg.org/ebooks/174',
      rating: 4.3,
    },
    {
      id: 'rec_9',
      title: 'Heart of Darkness',
      author: 'Joseph Conrad',
      reason: '상징주의와 복합적인 서술 구조로 문학적 사고력과 언어 감각을 발달시킬 수 있습니다.',
      difficulty_score: 4.8,
      url: 'https://www.gutenberg.org/ebooks/219',
      rating: 3.9,
    },
  ],
  transcription: [
    {
      id: 'trans_1',
      title: 'Poems by Emily Dickinson',
      author: 'Emily Dickinson',
      reason: '간결하면서도 깊이 있는 시어로 필사 연습에 최적화된 작품입니다.',
      difficulty_score: 4.0,
      url: 'https://www.gutenberg.org/ebooks/12242',
      rating: 4.6,
    },
    {
      id: 'trans_2',
      title: 'The Prophet',
      author: 'Kahlil Gibran',
      reason: '아름다운 철학적 산문으로 필사를 통해 깊은 사색을 경험할 수 있습니다.',
      difficulty_score: 3.8,
      url: 'https://www.gutenberg.org/ebooks/58585',
      rating: 4.7,
    },
    {
      id: 'trans_3',
      title: 'Leaves of Grass',
      author: 'Walt Whitman',
      reason: '자유분방한 시 형식과 웅장한 표현으로 필사 연습의 즐거움을 선사합니다.',
      difficulty_score: 4.2,
      url: 'https://www.gutenberg.org/ebooks/1322',
      rating: 4.1,
    },
  ],
};

function onlySection(key: SectionKey, recs: Recommendation[]): RecommendationData {
  const data: RecommendationData = {};
  data[key] = recs;
  return data;
}

export default function RecommendationsPage() {
  const [selected, setSelected] = useState<FilterKey>('all');
  const [data, setData] = useState<RecommendationData>({});
  const [status, setStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    (async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/recommendations?level=${selected}&limit=10&date=${today}`, {
          signal: controller.signal,
        });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message ?? `HTTP ${response.status}`);

        if (selected !== 'all' && Array.isArray(json.recommendations)) {
          setData(onlySection(selected, json.recommendations));
        } else {
          setData(json.recommendations as RecommendationData);
        }
        setStatus('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Recommendations fetch error:', error);
        setData(selected === 'all' ? FALLBACK : onlySection(selected, FALLBACK[selected]));
        setStatus('fallback');
      }
    })();

    return () => controller.abort();
  }, [selected]);

  const visible = SECTIONS.filter(
    (section) => (selected === 'all' || section.key === selected) && (data[section.key]?.length ?? 0) > 0,
  );

  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Reading list</p>
        <h1 className="page-title">수준별 추천 도서</h1>
        <p className="lede">날마다 새로 섞이는 추천 목록입니다. 지금 읽기 편한 수준부터 골라 보세요.</p>
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

      {status === 'fallback' && <p className="alert">추천 서버에 연결하지 못해 기본 목록을 보여 줍니다.</p>}

      {status !== 'loading' &&
        (visible.length === 0 ? (
          <p className="muted">이 수준의 추천 도서가 아직 없습니다.</p>
        ) : (
          visible.map((section) => (
            <section key={section.key} className="rec-section" aria-labelledby={`rec-${section.key}`}>
              <div className="rec-head">
                <h2 id={`rec-${section.key}`} className="section-title">
                  {section.title}
                </h2>
                {section.step !== null && <PencilMeter value={section.step} max={LEVEL_MAX} />}
                <p>{section.note}</p>
              </div>
              <div className="book-grid">
                {(data[section.key] ?? []).map((rec) => (
                  <BookCard key={rec.id} title={rec.title} author={rec.author} url={rec.url} reason={rec.reason} />
                ))}
              </div>
            </section>
          ))
        ))}
    </main>
  );
}
