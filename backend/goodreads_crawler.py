import requests
import time
import logging
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from urllib.parse import quote
from config import Config

class GoodreadsCrawler:
    def __init__(self):
        self.base_url = Config.GOODREADS_BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL))
        self.logger = logging.getLogger(__name__)

    def search_book(self, title: str, author: str = None) -> Optional[Dict]:
        """Goodreads에서 책을 검색합니다."""
        search_query = title
        if author:
            search_query += f" {author}"
        
        encoded_query = quote(search_query)
        url = f"{self.base_url}/search?q={encoded_query}"
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 첫 번째 검색 결과 선택
            first_result = soup.find('tr', {'itemtype': 'http://schema.org/Book'})
            
            if first_result:
                book_data = self._parse_search_result(first_result)
                time.sleep(Config.REQUEST_DELAY)
                return book_data
            
            self.logger.warning(f"'{title}'에 대한 검색 결과를 찾을 수 없습니다.")
            return None
            
        except Exception as e:
            self.logger.error(f"Goodreads 검색 실패: {e}")
            return None

    def _parse_search_result(self, result_elem) -> Dict:
        """검색 결과에서 책 정보를 파싱합니다."""
        try:
            title_elem = result_elem.find('a', class_='bookTitle')
            author_elem = result_elem.find('a', class_='authorName')
            rating_elem = result_elem.find('span', class_='minirating')
            cover_elem = result_elem.find('img', class_='bookCover')
            
            book_url = title_elem.get('href') if title_elem else ''
            if book_url and not book_url.startswith('http'):
                book_url = f"{self.base_url}{book_url}"
            
            return {
                'title': title_elem.get_text(strip=True) if title_elem else '',
                'author': author_elem.get_text(strip=True) if author_elem else '',
                'goodreads_url': book_url,
                'rating_text': rating_elem.get_text(strip=True) if rating_elem else '',
                'cover_image': cover_elem.get('src') if cover_elem else '',
                'rating': self._extract_rating(rating_elem),
                'rating_count': self._extract_rating_count(rating_elem)
            }
            
        except Exception as e:
            self.logger.error(f"검색 결과 파싱 실패: {e}")
            return {}

    def _extract_rating(self, rating_elem) -> float:
        """평점을 추출합니다."""
        if not rating_elem:
            return 0.0
        
        try:
            rating_text = rating_elem.get_text()
            # "4.25 avg rating" 형태에서 숫자 추출
            import re
            rating_match = re.search(r'(\d+\.\d+)', rating_text)
            return float(rating_match.group(1)) if rating_match else 0.0
        except:
            return 0.0

    def _extract_rating_count(self, rating_elem) -> int:
        """평점 개수를 추출합니다."""
        if not rating_elem:
            return 0
        
        try:
            rating_text = rating_elem.get_text()
            # "4.25 avg rating — 1,234 ratings" 형태에서 숫자 추출
            import re
            count_match = re.search(r'([\d,]+)\s+ratings?', rating_text)
            if count_match:
                count_str = count_match.group(1).replace(',', '')
                return int(count_str)
            return 0
        except:
            return 0

    def get_book_details(self, goodreads_url: str) -> Optional[Dict]:
        """Goodreads 책 페이지에서 상세 정보를 가져옵니다."""
        try:
            response = self.session.get(goodreads_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            details = {
                'description': self._extract_description(soup),
                'genres': self._extract_genres(soup),
                'publication_info': self._extract_publication_info(soup),
                'series_info': self._extract_series_info(soup),
                'awards': self._extract_awards(soup),
                'similar_books': self._extract_similar_books(soup),
                'reviews_sample': self._extract_review_sample(soup)
            }
            
            time.sleep(Config.REQUEST_DELAY)
            return details
            
        except Exception as e:
            self.logger.error(f"책 상세정보 크롤링 실패: {e}")
            return None

    def _extract_description(self, soup) -> str:
        """책 설명을 추출합니다."""
        try:
            desc_elem = soup.find('div', {'data-testid': 'description'})
            if not desc_elem:
                desc_elem = soup.find('div', class_='expandableHtml')
            
            if desc_elem:
                return desc_elem.get_text(strip=True)[:1000]  # 1000자로 제한
            return ''
        except:
            return ''

    def _extract_genres(self, soup) -> List[str]:
        """장르 정보를 추출합니다."""
        try:
            genres = []
            genre_elements = soup.find_all('a', class_='actionLinkLite bookPageGenreLink')
            
            for elem in genre_elements[:10]:  # 최대 10개 장르
                genre_text = elem.get_text(strip=True)
                if genre_text and genre_text not in genres:
                    genres.append(genre_text)
            
            return genres
        except:
            return []

    def _extract_publication_info(self, soup) -> Dict:
        """출판 정보를 추출합니다."""
        try:
            pub_info = {}
            
            # 출판사와 출판일 찾기
            details_elem = soup.find('div', {'data-testid': 'publicationInfo'})
            if not details_elem:
                details_elem = soup.find('div', class_='row')
            
            if details_elem:
                pub_text = details_elem.get_text()
                
                # 간단한 정규식으로 출판 정보 추출
                import re
                
                # 출판일 패턴
                date_pattern = r'Published\s+(\w+\s+\d{1,2},?\s+\d{4})'
                date_match = re.search(date_pattern, pub_text)
                if date_match:
                    pub_info['published_date'] = date_match.group(1)
                
                # 페이지 수 패턴
                pages_pattern = r'(\d+)\s+pages'
                pages_match = re.search(pages_pattern, pub_text)
                if pages_match:
                    pub_info['page_count'] = int(pages_match.group(1))
            
            return pub_info
        except:
            return {}

    def _extract_series_info(self, soup) -> Optional[str]:
        """시리즈 정보를 추출합니다."""
        try:
            series_elem = soup.find('h3', class_='Text__title3')
            if series_elem:
                return series_elem.get_text(strip=True)
            return None
        except:
            return None

    def _extract_awards(self, soup) -> List[str]:
        """수상 정보를 추출합니다."""
        try:
            awards = []
            award_elements = soup.find_all('a', href=lambda href: href and '/award/' in href)
            
            for elem in award_elements[:5]:  # 최대 5개 수상내역
                award_text = elem.get_text(strip=True)
                if award_text and award_text not in awards:
                    awards.append(award_text)
            
            return awards
        except:
            return []

    def _extract_similar_books(self, soup) -> List[Dict]:
        """비슷한 책 추천을 추출합니다."""
        try:
            similar_books = []
            
            # "Readers also enjoyed" 섹션 찾기
            similar_section = soup.find('div', {'data-testid': 'readersAlsoEnjoyedShelf'})
            if similar_section:
                book_elements = similar_section.find_all('div', class_='BookCard')
                
                for elem in book_elements[:5]:  # 최대 5권
                    title_elem = elem.find('a', class_='bookTitle')
                    author_elem = elem.find('a', class_='authorName')
                    
                    if title_elem:
                        similar_books.append({
                            'title': title_elem.get_text(strip=True),
                            'author': author_elem.get_text(strip=True) if author_elem else '',
                            'url': f"{self.base_url}{title_elem.get('href')}" if title_elem.get('href') else ''
                        })
            
            return similar_books
        except:
            return []

    def _extract_review_sample(self, soup) -> List[Dict]:
        """리뷰 샘플을 추출합니다."""
        try:
            reviews = []
            review_elements = soup.find_all('div', class_='review')[:3]  # 최대 3개 리뷰
            
            for elem in review_elements:
                try:
                    author_elem = elem.find('a', class_='user')
                    rating_elem = elem.find('span', class_='staticStars')
                    text_elem = elem.find('span', class_='readable')
                    
                    if text_elem:
                        reviews.append({
                            'author': author_elem.get_text(strip=True) if author_elem else 'Anonymous',
                            'rating': self._extract_star_rating(rating_elem),
                            'text': text_elem.get_text(strip=True)[:300]  # 300자로 제한
                        })
                except:
                    continue
            
            return reviews
        except:
            return []

    def _extract_star_rating(self, rating_elem) -> int:
        """별점을 추출합니다."""
        if not rating_elem:
            return 0
        
        try:
            # 별점은 보통 클래스 이름에 포함됨
            class_list = rating_elem.get('class', [])
            for class_name in class_list:
                if 'stars' in class_name and any(str(i) in class_name for i in range(1, 6)):
                    for i in range(1, 6):
                        if str(i) in class_name:
                            return i
            return 0
        except:
            return 0

    def get_book_lists(self, query: str = "best books", limit: int = 5) -> List[Dict]:
        """Goodreads 책 리스트를 검색합니다."""
        try:
            encoded_query = quote(f"{query} list")
            url = f"{self.base_url}/search?q={encoded_query}&search_type=lists"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            lists = []
            list_elements = soup.find_all('div', class_='listItem')[:limit]
            
            for elem in list_elements:
                list_data = self._parse_book_list(elem)
                if list_data:
                    lists.append(list_data)
            
            time.sleep(Config.REQUEST_DELAY)
            return lists
            
        except Exception as e:
            self.logger.error(f"책 리스트 검색 실패: {e}")
            return []

    def _parse_book_list(self, list_elem) -> Optional[Dict]:
        """책 리스트 정보를 파싱합니다."""
        try:
            title_elem = list_elem.find('a', class_='listTitle')
            description_elem = list_elem.find('div', class_='description')
            stats_elem = list_elem.find('div', class_='stats')
            
            return {
                'title': title_elem.get_text(strip=True) if title_elem else '',
                'url': f"{self.base_url}{title_elem.get('href')}" if title_elem and title_elem.get('href') else '',
                'description': description_elem.get_text(strip=True) if description_elem else '',
                'stats': stats_elem.get_text(strip=True) if stats_elem else ''
            }
        except:
            return None