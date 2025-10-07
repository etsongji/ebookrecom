import asyncio
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
from gutenberg_crawler import GutenbergCrawler
from reddit_crawler import RedditCrawler
from goodreads_crawler import GoodreadsCrawler
from curated_recommendations import CuratedRecommendations
from config import Config
import requests

class BookRecommendationCrawler:
    def __init__(self):
        self.gutenberg = GutenbergCrawler()
        self.reddit = RedditCrawler()
        self.goodreads = GoodreadsCrawler()
        self.curated = CuratedRecommendations()
        
        logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL))
        self.logger = logging.getLogger(__name__)

    async def run_full_crawl(self):
        """전체 크롤링을 실행합니다."""
        self.logger.info("전체 크롤링 시작")
        
        try:
            # 1. Project Gutenberg 인기 도서 크롤링
            gutenberg_books = await self.crawl_gutenberg_books()
            
            # 2. Reddit 추천 및 리뷰 크롤링
            reddit_data = await self.crawl_reddit_data()
            
            # 3. 선별된 책들에 대한 Goodreads 정보 크롤링
            enhanced_books = await self.enhance_with_goodreads(gutenberg_books[:50])
            
            # 4. 데이터 저장
            await self.save_crawled_data(enhanced_books, reddit_data)
            
            self.logger.info("전체 크롤링 완료")
            
        except Exception as e:
            self.logger.error(f"크롤링 중 오류 발생: {e}")

    async def crawl_gutenberg_books(self, max_pages: int = 5) -> List[Dict]:
        """Project Gutenberg에서 인기 도서를 크롤링합니다."""
        self.logger.info("Project Gutenberg 도서 크롤링 시작")
        
        all_books = []
        
        for page in range(1, max_pages + 1):
            try:
                books = self.gutenberg.get_book_catalog(page)
                
                for book in books:
                    # 상세 정보 가져오기
                    if book.get('id'):
                        details = self.gutenberg.get_book_details(book['id'])
                        if details:
                            book.update(details)
                    
                    all_books.append(book)
                
                self.logger.info(f"페이지 {page}: {len(books)}권 수집")
                
                # API 요청 제한 준수
                await asyncio.sleep(Config.REQUEST_DELAY)
                
            except Exception as e:
                self.logger.error(f"페이지 {page} 크롤링 실패: {e}")
                continue
        
        self.logger.info(f"총 {len(all_books)}권의 Gutenberg 도서 수집 완료")
        return all_books

    async def crawl_reddit_data(self) -> Dict[str, List]:
        """Reddit에서 책 관련 데이터를 크롤링합니다."""
        self.logger.info("Reddit 데이터 크롤링 시작")
        
        reddit_data = {
            'recommendations': [],
            'reviews': [],
            'trending': []
        }
        
        try:
            # 일반적인 책 추천 게시물
            recommendations = self.reddit.get_book_recommendations(50)
            reddit_data['recommendations'].extend(recommendations)
            
            # 트렌딩 책들
            trending = self.reddit.get_trending_books(30)
            reddit_data['trending'].extend(trending)
            
            # 인기 클래식 도서들에 대한 리뷰 검색
            classic_books = [
                ("Pride and Prejudice", "Jane Austen"),
                ("Alice's Adventures in Wonderland", "Lewis Carroll"),
                ("The Adventures of Tom Sawyer", "Mark Twain"),
                ("Dracula", "Bram Stoker"),
                ("Frankenstein", "Mary Shelley")
            ]
            
            for title, author in classic_books:
                reviews = self.reddit.get_book_reviews(title, author, 10)
                reddit_data['reviews'].extend(reviews)
                
                await asyncio.sleep(1)  # API 제한 준수
            
            self.logger.info(f"Reddit 데이터 수집 완료: "
                           f"추천 {len(reddit_data['recommendations'])}개, "
                           f"리뷰 {len(reddit_data['reviews'])}개, "
                           f"트렌딩 {len(reddit_data['trending'])}개")
            
        except Exception as e:
            self.logger.error(f"Reddit 크롤링 실패: {e}")
        
        return reddit_data

    async def enhance_with_goodreads(self, books: List[Dict]) -> List[Dict]:
        """Gutenberg 책들에 Goodreads 정보를 추가합니다."""
        self.logger.info(f"{len(books)}권의 책에 Goodreads 정보 추가")
        
        enhanced_books = []
        
        for book in books:
            try:
                # Goodreads에서 책 검색
                goodreads_data = self.goodreads.search_book(
                    book.get('title', ''), 
                    book.get('author', '')
                )
                
                if goodreads_data and goodreads_data.get('goodreads_url'):
                    # 상세 정보 가져오기
                    details = self.goodreads.get_book_details(goodreads_data['goodreads_url'])
                    if details:
                        goodreads_data.update(details)
                
                # Gutenberg 데이터와 Goodreads 데이터 병합
                enhanced_book = {**book, **goodreads_data} if goodreads_data else book
                enhanced_books.append(enhanced_book)
                
                await asyncio.sleep(Config.REQUEST_DELAY)
                
            except Exception as e:
                self.logger.warning(f"'{book.get('title', 'Unknown')}' Goodreads 정보 수집 실패: {e}")
                enhanced_books.append(book)  # 원본 데이터라도 포함
        
        self.logger.info(f"Goodreads 정보 추가 완료: {len(enhanced_books)}권")
        return enhanced_books

    async def save_crawled_data(self, books: List[Dict], reddit_data: Dict):
        """크롤링된 데이터를 Firebase에 저장합니다."""
        self.logger.info("크롤링 데이터 Firebase 저장 시작")
        
        try:
            # Firebase Cloud Functions API 엔드포인트
            api_url = "https://your-project.cloudfunctions.net/api/internal/save-crawled-data"
            
            payload = {
                'books': books,
                'reviews': reddit_data['reviews'],
                'recommendations': reddit_data['recommendations'] + reddit_data['trending']
            }
            
            response = requests.post(
                api_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.logger.info(f"데이터 저장 성공: {result}")
            else:
                self.logger.error(f"데이터 저장 실패: {response.status_code} - {response.text}")
                
                # 로컬 백업 저장
                await self.save_local_backup(books, reddit_data)
                
        except Exception as e:
            self.logger.error(f"Firebase 저장 실패: {e}")
            
            # 로컬 백업 저장
            await self.save_local_backup(books, reddit_data)

    async def save_local_backup(self, books: List[Dict], reddit_data: Dict):
        """로컬에 백업 파일을 저장합니다."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        backup_data = {
            'timestamp': timestamp,
            'books': books,
            'reddit_data': reddit_data,
            'total_books': len(books),
            'total_reddit_items': sum(len(v) for v in reddit_data.values())
        }
        
        filename = f"crawl_backup_{timestamp}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
            
            self.logger.info(f"로컬 백업 저장 완료: {filename}")
            
        except Exception as e:
            self.logger.error(f"로컬 백업 저장 실패: {e}")

    async def save_daily_recommendations(self, recommendations: Dict):
        """일일 추천 도서를 Firebase에 저장합니다."""
        self.logger.info("일일 추천 도서 Firebase 저장 시작")
        
        try:
            # Firebase Cloud Functions API 엔드포인트
            api_url = "https://your-project.cloudfunctions.net/api/internal/save-daily-recommendations"
            
            response = requests.post(
                api_url,
                json=recommendations,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.logger.info(f"일일 추천 저장 성공: {result}")
            else:
                self.logger.error(f"일일 추천 저장 실패: {response.status_code} - {response.text}")
                
                # 로컬 백업 저장
                await self.save_daily_backup(recommendations)
                
        except Exception as e:
            self.logger.error(f"Firebase 일일 추천 저장 실패: {e}")
            
            # 로컬 백업 저장
            await self.save_daily_backup(recommendations)

    async def save_daily_backup(self, recommendations: Dict):
        """일일 추천을 로컬에 백업합니다."""
        timestamp = datetime.now().strftime("%Y%m%d")
        filename = f"daily_recommendations_{timestamp}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(recommendations, f, ensure_ascii=False, indent=2, default=str)
            
            self.logger.info(f"일일 추천 로컬 백업 저장 완료: {filename}")
            
        except Exception as e:
            self.logger.error(f"일일 추천 로컬 백업 저장 실패: {e}")

    async def run_daily_update(self):
        """매일 업데이트 - 큐레이션된 추천 도서를 수집합니다."""
        self.logger.info("일일 업데이트 시작")
        
        try:
            # 영어 수준별 및 필사용 추천 도서 수집
            daily_recommendations = self.curated.get_daily_recommendations()
            
            # 명문장 수집
            all_books = []
            for level_books in daily_recommendations['all_recommendations']['english_levels'].values():
                all_books.extend(level_books)
            all_books.extend(daily_recommendations['all_recommendations']['transcription'])
            
            quotes = self.curated.get_featured_quotes(all_books)
            daily_recommendations['featured_quotes'] = quotes
            
            # Firebase에 저장
            await self.save_daily_recommendations(daily_recommendations)
            
            self.logger.info("일일 업데이트 완료")
            
        except Exception as e:
            self.logger.error(f"일일 업데이트 중 오류 발생: {e}")

    async def run_incremental_crawl(self):
        """증분 크롤링 - 새로운 데이터만 수집합니다."""
        self.logger.info("증분 크롤링 시작")
        
        try:
            # 최신 Reddit 데이터만 수집
            reddit_data = await self.crawl_reddit_data()
            
            # 새로운 Gutenberg 도서 (첫 페이지만)
            new_books = self.gutenberg.get_book_catalog(1)
            
            # 일부 책에 대해서만 Goodreads 정보 추가
            enhanced_books = await self.enhance_with_goodreads(new_books[:10])
            
            await self.save_crawled_data(enhanced_books, reddit_data)
            
            self.logger.info("증분 크롤링 완료")
            
        except Exception as e:
            self.logger.error(f"증분 크롤링 중 오류 발생: {e}")

async def main():
    """메인 실행 함수"""
    crawler = BookRecommendationCrawler()
    
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'full':
            await crawler.run_full_crawl()
        elif sys.argv[1] == 'incremental':
            await crawler.run_incremental_crawl()
        elif sys.argv[1] == 'daily':
            await crawler.run_daily_update()
        else:
            print("사용법: python main.py [full|incremental|daily]")
            print("  full: 전체 크롤링")
            print("  incremental: 증분 크롤링")
            print("  daily: 일일 추천 도서 업데이트")
    else:
        # 기본적으로 일일 업데이트 실행
        await crawler.run_daily_update()

if __name__ == "__main__":
    asyncio.run(main())