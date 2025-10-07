import requests
import time
import logging
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from config import Config

class GutenbergCrawler:
    def __init__(self):
        self.base_url = Config.GUTENBERG_BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL))
        self.logger = logging.getLogger(__name__)

    def get_book_catalog(self, page: int = 1) -> List[Dict]:
        """Project Gutenberg 도서 목록을 가져옵니다."""
        url = f"{self.base_url}/ebooks/search/?sort_order=downloads&start_index={((page-1) * 25) + 1}"
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            books = []
            
            book_items = soup.find_all('li', class_='booklink')
            
            for item in book_items:
                book_data = self._parse_book_item(item)
                if book_data:
                    books.append(book_data)
            
            self.logger.info(f"페이지 {page}에서 {len(books)}권의 도서를 찾았습니다.")
            time.sleep(Config.REQUEST_DELAY)
            
            return books
            
        except Exception as e:
            self.logger.error(f"도서 목록 크롤링 실패: {e}")
            return []

    def _parse_book_item(self, item) -> Optional[Dict]:
        """개별 도서 정보를 파싱합니다."""
        try:
            title_elem = item.find('span', class_='title')
            author_elem = item.find('span', class_='subtitle')
            link_elem = item.find('a', class_='link')
            
            if not title_elem or not link_elem:
                return None
            
            book_id = self._extract_book_id(link_elem.get('href', ''))
            
            return {
                'id': book_id,
                'title': title_elem.get_text(strip=True),
                'author': author_elem.get_text(strip=True) if author_elem else 'Unknown',
                'url': f"{self.base_url}{link_elem.get('href')}",
                'downloads': self._extract_downloads(item)
            }
            
        except Exception as e:
            self.logger.error(f"도서 정보 파싱 실패: {e}")
            return None

    def _extract_book_id(self, href: str) -> str:
        """URL에서 도서 ID를 추출합니다."""
        try:
            return href.split('/ebooks/')[1].split('/')[0] if '/ebooks/' in href else ''
        except:
            return ''

    def _extract_downloads(self, item) -> int:
        """다운로드 수를 추출합니다."""
        try:
            downloads_elem = item.find('span', string=lambda text: 'downloads' in text.lower() if text else False)
            if downloads_elem:
                downloads_text = downloads_elem.get_text()
                return int(''.join(filter(str.isdigit, downloads_text)))
            return 0
        except:
            return 0

    def get_book_details(self, book_id: str) -> Optional[Dict]:
        """특정 도서의 상세 정보를 가져옵니다."""
        url = f"{self.base_url}/ebooks/{book_id}"
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            details = {
                'id': book_id,
                'subjects': self._extract_subjects(soup),
                'language': self._extract_language(soup),
                'release_date': self._extract_release_date(soup),
                'bookshelves': self._extract_bookshelves(soup),
                'download_links': self._extract_download_links(soup)
            }
            
            time.sleep(Config.REQUEST_DELAY)
            return details
            
        except Exception as e:
            self.logger.error(f"도서 상세정보 크롤링 실패 (ID: {book_id}): {e}")
            return None

    def _extract_subjects(self, soup) -> List[str]:
        """주제/장르 정보를 추출합니다."""
        subjects = []
        subject_table = soup.find('table', class_='bibrec')
        if subject_table:
            subject_rows = subject_table.find_all('tr')
            for row in subject_rows:
                if 'Subject' in row.get_text():
                    links = row.find_all('a')
                    subjects.extend([link.get_text(strip=True) for link in links])
        return subjects

    def _extract_language(self, soup) -> str:
        """언어 정보를 추출합니다."""
        lang_elem = soup.find('tr', string=lambda text: 'Language' in text if text else False)
        if lang_elem:
            return lang_elem.find_next('td').get_text(strip=True)
        return 'Unknown'

    def _extract_release_date(self, soup) -> str:
        """출간일 정보를 추출합니다."""
        date_elem = soup.find('tr', string=lambda text: 'Release Date' in text if text else False)
        if date_elem:
            return date_elem.find_next('td').get_text(strip=True)
        return 'Unknown'

    def _extract_bookshelves(self, soup) -> List[str]:
        """서재 카테고리를 추출합니다."""
        bookshelves = []
        shelf_elem = soup.find('tr', string=lambda text: 'Bookshelf' in text if text else False)
        if shelf_elem:
            links = shelf_elem.find_next('td').find_all('a')
            bookshelves = [link.get_text(strip=True) for link in links]
        return bookshelves

    def _extract_download_links(self, soup) -> Dict[str, str]:
        """다운로드 링크를 추출합니다."""
        download_links = {}
        download_table = soup.find('table', class_='files')
        if download_table:
            rows = download_table.find_all('tr')[1:]  # 헤더 제외
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 2:
                    link = cells[0].find('a')
                    if link:
                        format_type = cells[1].get_text(strip=True)
                        download_links[format_type] = f"{self.base_url}{link.get('href')}"
        return download_links