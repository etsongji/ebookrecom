import logging
from typing import Dict, List
from gutenberg_crawler import GutenbergCrawler
from goodreads_crawler import GoodreadsCrawler
from config import Config

class CuratedRecommendations:
    def __init__(self):
        self.gutenberg = GutenbergCrawler()
        self.goodreads = GoodreadsCrawler()
        
        logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL))
        self.logger = logging.getLogger(__name__)

    def get_books_by_english_level(self) -> Dict[str, List[Dict]]:
        """영어 수준별 추천 도서를 가져옵니다."""
        
        recommendations = {
            'beginner': [],      # 초급
            'intermediate': [],  # 중급
            'advanced': []       # 고급
        }
        
        # 초급 (간단한 어휘, 짧은 문장의 클래식)
        beginner_books = [
            ("Alice's Adventures in Wonderland", "Lewis Carroll"),
            ("The Adventures of Tom Sawyer", "Mark Twain"),
            ("A Christmas Carol", "Charles Dickens"),
            ("The Secret Garden", "Frances Hodgson Burnett"),
            ("Anne of Green Gables", "L. M. Montgomery"),
            ("The Wonderful Wizard of Oz", "L. Frank Baum"),
            ("Little Women", "Louisa May Alcott"),
            ("Treasure Island", "Robert Louis Stevenson"),
            ("The Prince and the Pauper", "Mark Twain"),
            ("Black Beauty", "Anna Sewell")
        ]
        
        # 중급 (적당한 복잡도의 문학 작품)
        intermediate_books = [
            ("Pride and Prejudice", "Jane Austen"),
            ("The Adventures of Huckleberry Finn", "Mark Twain"),
            ("Jane Eyre", "Charlotte Brontë"),
            ("Great Expectations", "Charles Dickens"),
            ("The Picture of Dorian Gray", "Oscar Wilde"),
            ("Dracula", "Bram Stoker"),
            ("Frankenstein", "Mary Wollstonecraft Shelley"),
            ("The Time Machine", "H. G. Wells"),
            ("Dr. Jekyll and Mr. Hyde", "Robert Louis Stevenson"),
            ("The Count of Monte Cristo", "Alexandre Dumas")
        ]
        
        # 고급 (복잡한 문체와 고전 문학)
        advanced_books = [
            ("Moby Dick", "Herman Melville"),
            ("Crime and Punishment", "Fyodor Dostoyevsky"),
            ("Anna Karenina", "Leo Tolstoy"),
            ("The Brothers Karamazov", "Fyodor Dostoyevsky"),
            ("Les Misérables", "Victor Hugo"),
            ("War and Peace", "Leo Tolstoy"),
            ("Ulysses", "James Joyce"),
            ("The Iliad", "Homer"),
            ("The Odyssey", "Homer"),
            ("Paradise Lost", "John Milton")
        ]
        
        book_lists = {
            'beginner': beginner_books,
            'intermediate': intermediate_books,
            'advanced': advanced_books
        }
        
        for level, book_list in book_lists.items():
            self.logger.info(f"{level} 수준 도서 검색 시작")
            
            for title, author in book_list:
                try:
                    # Gutenberg에서 책 검색
                    book_data = self._search_gutenberg_book(title, author)
                    
                    if book_data:
                        # Goodreads에서 추가 정보 수집
                        goodreads_info = self.goodreads.search_book(title, author)
                        if goodreads_info:
                            book_data.update(goodreads_info)
                            
                            # 상세 정보 추가
                            if goodreads_info.get('goodreads_url'):
                                details = self.goodreads.get_book_details(goodreads_info['goodreads_url'])
                                if details:
                                    book_data.update(details)
                        
                        book_data['english_level'] = level
                        book_data['recommended_for'] = f"{level} 영어 학습자"
                        
                        recommendations[level].append(book_data)
                        
                        if len(recommendations[level]) >= 10:
                            break
                    
                except Exception as e:
                    self.logger.warning(f"'{title}' by {author} 검색 실패: {e}")
                    continue
            
            self.logger.info(f"{level} 수준 도서 {len(recommendations[level])}권 수집 완료")
        
        return recommendations

    def get_transcription_books(self) -> List[Dict]:
        """필사용 추천 도서를 가져옵니다."""
        
        self.logger.info("필사용 추천 도서 검색 시작")
        
        # 필사에 좋은 책들 (아름다운 문체, 명문장이 많은 작품)
        transcription_candidates = [
            ("Pride and Prejudice", "Jane Austen", "우아하고 정교한 문체"),
            ("Jane Eyre", "Charlotte Brontë", "감성적이고 서정적인 표현"),
            ("Wuthering Heights", "Emily Brontë", "강렬하고 시적인 문체"),
            ("The Picture of Dorian Gray", "Oscar Wilde", "위트와 철학이 담긴 문장"),
            ("A Tale of Two Cities", "Charles Dickens", "극적이고 인상적인 구문"),
            ("Little Women", "Louisa May Alcott", "따뜻하고 자연스러운 문체"),
            ("Anne of Green Gables", "L. M. Montgomery", "생동감 있고 아름다운 묘사"),
            ("The Secret Garden", "Frances Hodgson Burnett", "세밀하고 시적인 자연 묘사"),
            ("Sense and Sensibility", "Jane Austen", "균형 잡힌 우아한 문체"),
            ("Emma", "Jane Austen", "섬세하고 지적인 표현"),
            ("Little Lord Fauntleroy", "Frances Hodgson Burnett", "순수하고 아름다운 문체"),
            ("The Wind in the Willows", "Kenneth Grahame", "상상력이 풍부한 서정적 문체")
        ]
        
        transcription_books = []
        
        for title, author, writing_style in transcription_candidates:
            try:
                # Gutenberg에서 책 검색
                book_data = self._search_gutenberg_book(title, author)
                
                if book_data:
                    # Goodreads에서 추가 정보
                    goodreads_info = self.goodreads.search_book(title, author)
                    if goodreads_info:
                        book_data.update(goodreads_info)
                        
                        if goodreads_info.get('goodreads_url'):
                            details = self.goodreads.get_book_details(goodreads_info['goodreads_url'])
                            if details:
                                book_data.update(details)
                    
                    book_data['recommended_for'] = '필사 연습'
                    book_data['writing_style'] = writing_style
                    book_data['transcription_difficulty'] = self._assess_transcription_difficulty(title, author)
                    
                    transcription_books.append(book_data)
                    
                    if len(transcription_books) >= 12:
                        break
                
            except Exception as e:
                self.logger.warning(f"'{title}' by {author} 필사용 도서 검색 실패: {e}")
                continue
        
        self.logger.info(f"필사용 도서 {len(transcription_books)}권 수집 완료")
        return transcription_books

    def _search_gutenberg_book(self, title: str, author: str) -> Dict:
        """Gutenberg에서 특정 책을 검색합니다."""
        
        # 여러 페이지를 검색하여 해당 책을 찾습니다
        for page in range(1, 6):  # 최대 5페이지까지 검색
            try:
                books = self.gutenberg.get_book_catalog(page)
                
                for book in books:
                    book_title = book.get('title', '').lower()
                    book_author = book.get('author', '').lower()
                    
                    # 제목과 작가가 포함되어 있는지 확인
                    if (title.lower() in book_title or 
                        any(word in book_title for word in title.lower().split()) and
                        author.lower().split()[-1] in book_author):  # 성으로 검색
                        
                        # 상세 정보 가져오기
                        if book.get('id'):
                            details = self.gutenberg.get_book_details(book['id'])
                            if details:
                                book.update(details)
                        
                        return book
                
            except Exception as e:
                self.logger.warning(f"페이지 {page} 검색 실패: {e}")
                continue
        
        return None

    def _assess_transcription_difficulty(self, title: str, author: str) -> str:
        """필사 난이도를 평가합니다."""
        
        # 작가별 난이도 설정
        easy_authors = ['l. m. montgomery', 'frances hodgson burnett', 'louisa may alcott']
        medium_authors = ['jane austen', 'charlotte brontë', 'charles dickens']
        hard_authors = ['emily brontë', 'oscar wilde', 'herman melville']
        
        author_lower = author.lower()
        
        if any(easy_author in author_lower for easy_author in easy_authors):
            return '초급 (쉬운 문체)'
        elif any(medium_author in author_lower for medium_author in medium_authors):
            return '중급 (적당한 문체)'
        elif any(hard_author in author_lower for hard_author in hard_authors):
            return '고급 (복잡한 문체)'
        else:
            return '중급 (적당한 문체)'

    def get_daily_recommendations(self) -> Dict:
        """매일 업데이트할 추천 도서 목록을 생성합니다."""
        
        self.logger.info("일일 추천 도서 생성 시작")
        
        # 영어 수준별 추천
        level_books = self.get_books_by_english_level()
        
        # 필사용 추천
        transcription_books = self.get_transcription_books()
        
        # 오늘의 추천 (각 카테고리에서 3권씩 선별)
        import random
        from datetime import datetime
        
        today = datetime.now()
        random.seed(today.day)  # 날짜를 시드로 사용하여 일관된 결과
        
        daily_picks = {
            'today_picks': {
                'beginner': random.sample(level_books['beginner'], min(3, len(level_books['beginner']))),
                'intermediate': random.sample(level_books['intermediate'], min(3, len(level_books['intermediate']))),
                'advanced': random.sample(level_books['advanced'], min(3, len(level_books['advanced']))),
                'transcription': random.sample(transcription_books, min(3, len(transcription_books)))
            },
            'all_recommendations': {
                'english_levels': level_books,
                'transcription': transcription_books
            },
            'generated_at': today.isoformat(),
            'next_update': (today.replace(hour=2, minute=0, second=0) + 
                          (datetime.timedelta(days=1) if today.hour >= 2 else datetime.timedelta(days=0))).isoformat()
        }
        
        self.logger.info("일일 추천 도서 생성 완료")
        return daily_picks

    def get_featured_quotes(self, books: List[Dict]) -> List[Dict]:
        """추천 도서에서 명문장을 추출합니다."""
        
        famous_quotes = {
            "pride and prejudice": [
                "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
                "I declare after all there is no enjoyment like reading!"
            ],
            "jane eyre": [
                "I am no bird; and no net ensnares me: I am a free human being with an independent will.",
                "I would always rather be happy than dignified."
            ],
            "alice's adventures in wonderland": [
                "We're all mad here.",
                "Who in the world am I? Ah, that's the great puzzle!"
            ],
            "the picture of dorian gray": [
                "We are all in the gutter, but some of us are looking at the stars.",
                "I can resist everything except temptation."
            ]
        }
        
        quotes_collection = []
        
        for book in books:
            title = book.get('title', '').lower()
            
            for quote_title, quotes in famous_quotes.items():
                if quote_title in title:
                    for quote in quotes:
                        quotes_collection.append({
                            'book_title': book.get('title'),
                            'author': book.get('author'),
                            'quote': quote,
                            'book_id': book.get('id')
                        })
        
        return quotes_collection