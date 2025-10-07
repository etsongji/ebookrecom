'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Recommendation {
  id: string;
  title: string;
  author: string;
  reason: string;
  difficulty_score: number;
  url: string;
  rating: number;
}

interface RecommendationData {
  beginner?: Recommendation[];
  intermediate?: Recommendation[];
  advanced?: Recommendation[];
  transcription?: Recommendation[];
}

export default function RecommendationsPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [recommendations, setRecommendations] = useState<RecommendationData | Recommendation[]>({});
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // 모킹 데이터 사용
      const mockData: RecommendationData = {
        beginner: [
          {
            id: "rec_1",
            title: "Alice's Adventures in Wonderland",
            author: "Lewis Carroll",
            reason: "간단한 문장 구조와 상상력이 풍부한 스토리로 영어 읽기에 입문하기 좋습니다.",
            difficulty_score: 3.2,
            url: "https://www.gutenberg.org/ebooks/11",
            rating: 4.2
          },
          {
            id: "rec_2",
            title: "The Adventures of Tom Sawyer",
            author: "Mark Twain",
            reason: "미국 문학의 고전으로 일상적인 영어 표현을 자연스럽게 학습할 수 있습니다.",
            difficulty_score: 3.5,
            url: "https://www.gutenberg.org/ebooks/74",
            rating: 4.1
          },
          {
            id: "rec_3",
            title: "Anne of Green Gables",
            author: "L. M. Montgomery",
            reason: "따뜻한 감정을 담은 아름다운 영어 표현을 배울 수 있는 작품입니다.",
            difficulty_score: 3.4,
            url: "https://www.gutenberg.org/ebooks/45",
            rating: 4.3
          }
        ],
        intermediate: [
          {
            id: "rec_4",
            title: "Pride and Prejudice",
            author: "Jane Austen",
            reason: "영국식 영어의 우아한 표현과 복잡한 인물 관계를 통해 중급 영어 실력을 기를 수 있습니다.",
            difficulty_score: 4.2,
            url: "https://www.gutenberg.org/ebooks/1342",
            rating: 4.5
          },
          {
            id: "rec_5",
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            reason: "20세기 미국 문학의 걸작으로 상징적 표현과 서술 기법을 학습할 수 있습니다.",
            difficulty_score: 4.0,
            url: "https://www.gutenberg.org/ebooks/64317",
            rating: 4.2
          },
          {
            id: "rec_6",
            title: "Jane Eyre",
            author: "Charlotte Brontë",
            reason: "심리적 묘사가 뛰어난 고딕 로맨스 소설로 문학적 영어 표현을 익힐 수 있습니다.",
            difficulty_score: 4.1,
            url: "https://www.gutenberg.org/ebooks/1260",
            rating: 4.4
          }
        ],
        advanced: [
          {
            id: "rec_7",
            title: "Ulysses",
            author: "James Joyce",
            reason: "현대 문학의 대표작으로 의식의 흐름 기법과 고도의 언어 실험을 경험할 수 있습니다.",
            difficulty_score: 5.0,
            url: "https://www.gutenberg.org/ebooks/4300",
            rating: 4.0
          },
          {
            id: "rec_8",
            title: "The Picture of Dorian Gray",
            author: "Oscar Wilde",
            reason: "철학적 주제와 아름다운 산문체로 고급 영어 표현력을 기를 수 있습니다.",
            difficulty_score: 4.7,
            url: "https://www.gutenberg.org/ebooks/174",
            rating: 4.3
          },
          {
            id: "rec_9",
            title: "Heart of Darkness",
            author: "Joseph Conrad",
            reason: "상징주의와 복합적인 서술 구조로 문학적 사고력과 언어 감각을 발달시킬 수 있습니다.",
            difficulty_score: 4.8,
            url: "https://www.gutenberg.org/ebooks/219",
            rating: 3.9
          }
        ],
        transcription: [
          {
            id: "trans_1",
            title: "Poems by Emily Dickinson",
            author: "Emily Dickinson",
            reason: "간결하면서도 깊이 있는 시어로 필사 연습에 최적화된 작품입니다.",
            difficulty_score: 4.0,
            url: "https://www.gutenberg.org/ebooks/12242",
            rating: 4.6
          },
          {
            id: "trans_2",
            title: "The Prophet",
            author: "Kahlil Gibran",
            reason: "아름다운 철학적 산문으로 필사를 통해 깊은 사색을 경험할 수 있습니다.",
            difficulty_score: 3.8,
            url: "https://www.gutenberg.org/ebooks/58585",
            rating: 4.7
          },
          {
            id: "trans_3",
            title: "Leaves of Grass",
            author: "Walt Whitman",
            reason: "자유분방한 시 형식과 웅장한 표현으로 필사 연습의 즐거움을 선사합니다.",
            difficulty_score: 4.2,
            url: "https://www.gutenberg.org/ebooks/1322",
            rating: 4.1
          }
        ]
      };

      if (selectedLevel === 'all') {
        setRecommendations(mockData);
      } else {
        setRecommendations(mockData[selectedLevel as keyof RecommendationData] || []);
      }
    } catch (error) {
      console.error('Recommendations fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const renderRecommendationCard = (rec: Recommendation) => (
    <div key={rec.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{rec.title}</h3>
      <p className="text-gray-600 mb-3">저자: {rec.author}</p>
      
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center">
          <span className="text-yellow-500">⭐</span>
          <span className="ml-1 text-sm text-gray-600">{rec.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center">
          <span className="text-blue-500">📊</span>
          <span className="ml-1 text-sm text-gray-600">난이도 {rec.difficulty_score.toFixed(1)}/5</span>
        </div>
      </div>
      
      <p className="text-gray-700 mb-4 leading-relaxed">{rec.reason}</p>
      
      <a
        href={rec.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        📖 읽으러 가기
      </a>
    </div>
  );

  const renderLevelSection = (level: string, title: string, recs: Recommendation[]) => (
    <div key={level} className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">
          {level === 'beginner' ? '🟢' : 
           level === 'intermediate' ? '🟡' : 
           level === 'advanced' ? '🔴' : '✍️'}
        </span>
        {title}
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {recs.map(renderRecommendationCard)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">📖</span>
              <span className="text-xl font-bold text-gray-900">
                구텐베르크 책추천
              </span>
            </Link>
            
            <nav className="flex items-center space-x-8">
              <Link href="/search" className="text-gray-700 hover:text-blue-600">
                검색
              </Link>
              <Link href="/recommendations" className="text-blue-600 font-semibold">
                추천도서
              </Link>
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                홈
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 추천 도서</h1>
          <p className="text-xl text-gray-600">
            영어 수준별 맞춤 추천과 필사용 도서를 만나보세요
          </p>
        </div>

        {/* 필터 버튼 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { key: 'all', label: '전체', icon: '📚' },
            { key: 'beginner', label: '초급', icon: '🟢' },
            { key: 'intermediate', label: '중급', icon: '🟡' },
            { key: 'advanced', label: '고급', icon: '🔴' },
            { key: 'transcription', label: '필사용', icon: '✍️' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSelectedLevel(key)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedLevel === key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
              }`}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">추천 도서를 불러오는 중...</p>
          </div>
        ) : (
          <div>
            {selectedLevel === 'all' && Array.isArray(recommendations) === false ? (
              <div>
                {(recommendations as RecommendationData).beginner && 
                  renderLevelSection('beginner', '초급 (Beginner)', (recommendations as RecommendationData).beginner!)}
                {(recommendations as RecommendationData).intermediate && 
                  renderLevelSection('intermediate', '중급 (Intermediate)', (recommendations as RecommendationData).intermediate!)}
                {(recommendations as RecommendationData).advanced && 
                  renderLevelSection('advanced', '고급 (Advanced)', (recommendations as RecommendationData).advanced!)}
                {(recommendations as RecommendationData).transcription && 
                  renderLevelSection('transcription', '필사용 (For Transcription)', (recommendations as RecommendationData).transcription!)}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  {selectedLevel === 'beginner' ? '🟢 초급 추천 도서' :
                   selectedLevel === 'intermediate' ? '🟡 중급 추천 도서' :
                   selectedLevel === 'advanced' ? '🔴 고급 추천 도서' :
                   '✍️ 필사용 추천 도서'}
                </h2>
                {Array.isArray(recommendations) && recommendations.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {(recommendations as Recommendation[]).map(renderRecommendationCard)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">추천 도서를 불러올 수 없습니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}