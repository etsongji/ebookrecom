'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface DailyPick {
  id: string;
  title: string;
  author: string;
  reason: string;
  difficulty_score: number;
  url: string;
  rating: number;
  level: string;
  quote: string;
  date: string;
}

export default function Home() {
  const [dailyPick, setDailyPick] = useState<DailyPick | null>(null);
  const [dayMessage, setDayMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyPick();
  }, []);

  const fetchDailyPick = async () => {
    try {
      const response = await fetch('/api/daily-pick');
      const data = await response.json();
      
      if (data.success) {
        setDailyPick(data.dailyPick);
        setDayMessage(data.dayMessage);
      }
    } catch (error) {
      console.error('Failed to fetch daily pick:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/search" className="text-gray-700 hover:text-blue-600">
                검색
              </Link>
              <Link href="/recommendations" className="text-gray-700 hover:text-blue-600">
                추천도서
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-blue-600">구텐베르그</span> 책 추천
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Project Gutenberg의 방대한 무료 전자책 컬렉션에서 
            당신에게 딱 맞는 책을 찾아보세요
          </p>
          
          {/* 검색 바 */}
          <div className="max-w-2xl mx-auto mb-8">
            <Link href="/search">
              <div className="relative group cursor-pointer">
                <input
                  type="text"
                  placeholder="책 제목이나 작가를 검색해보세요..."
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all"
                  readOnly
                />
                <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">🔍</span>
              </div>
            </Link>
          </div>

          {/* CTA 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/recommendations"
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              추천 도서 보기
            </Link>
            <Link
              href="/search"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
            >
              책 검색하기
            </Link>
          </div>
        </div>
      </section>

      {/* 오늘의 추천 섹션 */}
      {!loading && dailyPick && (
        <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">📖 오늘의 특별 추천</h2>
              <p className="text-lg text-gray-600">{dayMessage}</p>
              <p className="text-sm text-gray-500">{dailyPick.date}</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 border-l-4 border-purple-500">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      dailyPick.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      dailyPick.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      dailyPick.level === 'advanced' ? 'bg-red-100 text-red-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {dailyPick.level === 'beginner' ? '초급' : 
                       dailyPick.level === 'intermediate' ? '중급' : 
                       dailyPick.level === 'advanced' ? '고급' : '필사용'}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="text-yellow-500 mr-1">⭐</span>
                      {dailyPick.rating.toFixed(1)}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{dailyPick.title}</h3>
                  <p className="text-lg text-gray-700 mb-4">저자: {dailyPick.author}</p>
                  <p className="text-gray-600 mb-6 leading-relaxed">{dailyPick.reason}</p>
                  
                  {dailyPick.quote && (
                    <blockquote className="border-l-4 border-purple-300 pl-4 italic text-gray-600 mb-6">
                      &ldquo;{dailyPick.quote}&rdquo;
                    </blockquote>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href={dailyPick.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      📖 지금 읽기
                    </a>
                    <Link
                      href="/recommendations"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
                    >
                      더 많은 추천 보기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 주요 기능 섹션 */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            주요 기능
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">무료 전자책</h3>
              <p className="text-gray-600">
                Project Gutenberg의 60,000개 이상의 무료 전자책을 제공합니다
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">영어 수준별 추천</h3>
              <p className="text-gray-600">
                초급, 중급, 고급으로 나누어 적절한 난이도의 책을 추천합니다
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">✍️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">필사용 도서</h3>
              <p className="text-gray-600">
                아름다운 문체와 명문장이 포함된 필사 연습용 도서를 추천합니다
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">구텐베르크 통계</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">60,000+</div>
              <div className="text-gray-300">무료 전자책</div>
            </div>
            
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">100+</div>
              <div className="text-gray-300">지원 언어</div>
            </div>
            
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">500M+</div>
              <div className="text-gray-300">총 다운로드 수</div>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 구텐베르크 책 추천 서비스. All rights reserved.</p>
          <p className="mt-2 text-gray-400">
            Project Gutenberg의 무료 전자책을 활용한 개인 프로젝트입니다.
          </p>
        </div>
      </footer>
    </div>
  );
}