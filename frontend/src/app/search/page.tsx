'use client';

import { useState } from 'react';
import Link from 'next/link';

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

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchBooks = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // 실제 API 호출
      const params = new URLSearchParams({
        q: query,
        level: level,
        limit: '20'
      });
      
      const response = await fetch(`/api/books?${params}`);
      const data = await response.json();
      
      if (data.books && data.books.length > 0) {
        setBooks(data.books);
        setSearched(true);
        return;
      }
      
      // API 실패시 폴백 데이터
      const mockResults: Book[] = [
        {
          id: "11",
          title: "Alice's Adventures in Wonderland",
          author: "Lewis Carroll",
          downloads: 15432,
          subjects: ["Children's Fiction", "Fantasy"],
          language: "en",
          rating: 4.2,
          rating_count: 1250,
          url: "https://www.gutenberg.org/ebooks/11",
          level: "beginner"
        },
        {
          id: "1342",
          title: "Pride and Prejudice",
          author: "Jane Austen",
          downloads: 12876,
          subjects: ["Romance", "Fiction"],
          language: "en",
          rating: 4.5,
          rating_count: 2100,
          url: "https://www.gutenberg.org/ebooks/1342",
          level: "intermediate"
        },
        {
          id: "174",
          title: "The Picture of Dorian Gray",
          author: "Oscar Wilde",
          downloads: 8954,
          subjects: ["Gothic Fiction", "Philosophy"],
          language: "en",
          rating: 4.3,
          rating_count: 1800,
          url: "https://www.gutenberg.org/ebooks/174",
          level: "advanced"
        },
        {
          id: "74",
          title: "The Adventures of Tom Sawyer",
          author: "Mark Twain",
          downloads: 9876,
          subjects: ["Adventure", "Children's Fiction"],
          language: "en",
          rating: 4.1,
          rating_count: 1650,
          url: "https://www.gutenberg.org/ebooks/74",
          level: "beginner"
        },
        {
          id: "1260",
          title: "Jane Eyre",
          author: "Charlotte Brontë",
          downloads: 8234,
          subjects: ["Romance", "Gothic Fiction"],
          language: "en",
          rating: 4.4,
          rating_count: 1890,
          url: "https://www.gutenberg.org/ebooks/1260",
          level: "intermediate"
        }
      ];

      // 검색어 필터링
      let filtered = mockResults.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase())
      );

      // 레벨 필터링
      if (level !== 'all') {
        filtered = filtered.filter(book => book.level === level);
      }

      setBooks(filtered);
      setSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchBooks();
  };

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
              <Link href="/search" className="text-blue-600 font-semibold">
                검색
              </Link>
              <Link href="/recommendations" className="text-gray-700 hover:text-blue-600">
                추천도서
              </Link>
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                홈
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">책 검색</h1>
        
        {/* 검색 폼 */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="책 제목이나 작가를 검색해보세요..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">모든 수준</option>
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
            
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '검색중...' : '검색'}
            </button>
          </div>
        </form>

        {/* 검색 결과 */}
        {searched && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              검색 결과: {books.length}권
            </h2>
            
            {books.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {book.title}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          저자: {book.author}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {book.level && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              book.level === 'beginner' ? 'bg-green-100 text-green-800' :
                              book.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {book.level === 'beginner' ? '초급' : 
                               book.level === 'intermediate' ? '중급' : '고급'}
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            다운로드: {book.downloads.toLocaleString()}
                          </span>
                          {book.rating && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                              ⭐ {book.rating.toFixed(1)} ({book.rating_count})
                            </span>
                          )}
                        </div>
                        {book.subjects.length > 0 && (
                          <p className="text-sm text-gray-500">
                            장르: {book.subjects.join(', ')}
                          </p>
                        )}
                      </div>
                      
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        읽기
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}