import praw
import logging
from typing import Dict, List, Optional
from config import Config

class RedditCrawler:
    def __init__(self):
        self.reddit = praw.Reddit(
            client_id=Config.REDDIT_CLIENT_ID,
            client_secret=Config.REDDIT_CLIENT_SECRET,
            user_agent=Config.REDDIT_USER_AGENT
        )
        
        logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL))
        self.logger = logging.getLogger(__name__)

    def search_book_discussions(self, book_title: str, author: str = None, limit: int = 10) -> List[Dict]:
        """Reddit에서 특정 책에 대한 토론을 검색합니다."""
        search_query = f'"{book_title}"'
        if author:
            search_query += f' "{author}"'
        
        try:
            discussions = []
            subreddits = ['books', 'booksuggestions', 'literature', 'reading', 'bookclub']
            
            for subreddit_name in subreddits:
                try:
                    subreddit = self.reddit.subreddit(subreddit_name)
                    submissions = subreddit.search(search_query, limit=limit//len(subreddits))
                    
                    for submission in submissions:
                        discussion_data = self._parse_submission(submission)
                        if discussion_data:
                            discussion_data['subreddit'] = subreddit_name
                            discussions.append(discussion_data)
                            
                except Exception as e:
                    self.logger.warning(f"서브레딧 {subreddit_name} 검색 실패: {e}")
                    continue
            
            self.logger.info(f"'{book_title}'에 대한 {len(discussions)}개의 토론을 찾았습니다.")
            return discussions
            
        except Exception as e:
            self.logger.error(f"Reddit 검색 실패: {e}")
            return []

    def _parse_submission(self, submission) -> Optional[Dict]:
        """Reddit 게시물 정보를 파싱합니다."""
        try:
            return {
                'id': submission.id,
                'title': submission.title,
                'score': submission.score,
                'upvote_ratio': submission.upvote_ratio,
                'num_comments': submission.num_comments,
                'created_utc': submission.created_utc,
                'url': f"https://reddit.com{submission.permalink}",
                'selftext': submission.selftext[:500] if submission.selftext else '',
                'author': str(submission.author) if submission.author else 'deleted'
            }
        except Exception as e:
            self.logger.error(f"게시물 파싱 실패: {e}")
            return None

    def get_book_recommendations(self, limit: int = 50) -> List[Dict]:
        """책 추천 관련 게시물들을 가져옵니다."""
        try:
            recommendations = []
            
            # 책 추천 관련 서브레딧들
            book_subreddits = [
                'booksuggestions', 
                'suggestmeabook', 
                'books', 
                'bookclub',
                'literature'
            ]
            
            for subreddit_name in book_subreddits:
                try:
                    subreddit = self.reddit.subreddit(subreddit_name)
                    
                    # 인기 게시물 가져오기
                    hot_posts = subreddit.hot(limit=limit//len(book_subreddits))
                    
                    for post in hot_posts:
                        if self._is_recommendation_post(post):
                            rec_data = self._parse_submission(post)
                            if rec_data:
                                rec_data['subreddit'] = subreddit_name
                                rec_data['type'] = 'recommendation'
                                recommendations.append(rec_data)
                                
                except Exception as e:
                    self.logger.warning(f"서브레딧 {subreddit_name} 크롤링 실패: {e}")
                    continue
            
            self.logger.info(f"{len(recommendations)}개의 추천 게시물을 찾았습니다.")
            return recommendations
            
        except Exception as e:
            self.logger.error(f"추천 게시물 크롤링 실패: {e}")
            return []

    def _is_recommendation_post(self, submission) -> bool:
        """게시물이 책 추천과 관련된 내용인지 판단합니다."""
        recommendation_keywords = [
            'recommend', 'suggestion', 'looking for', 'similar to',
            'book like', 'what to read', 'need help finding',
            'any books', 'book recommendations'
        ]
        
        title_lower = submission.title.lower()
        return any(keyword in title_lower for keyword in recommendation_keywords)

    def get_book_reviews(self, book_title: str, author: str = None, limit: int = 20) -> List[Dict]:
        """특정 책에 대한 리뷰를 검색합니다."""
        search_terms = [
            f'"{book_title}" review',
            f'"{book_title}" thoughts',
            f'finished reading "{book_title}"'
        ]
        
        if author:
            search_terms.append(f'"{author}" "{book_title}"')
        
        try:
            reviews = []
            
            for search_term in search_terms:
                submissions = self.reddit.subreddit('books').search(
                    search_term, 
                    limit=limit//len(search_terms),
                    sort='relevance'
                )
                
                for submission in submissions:
                    if self._is_review_post(submission):
                        review_data = self._parse_submission(submission)
                        if review_data:
                            review_data['type'] = 'review'
                            review_data['search_term'] = search_term
                            reviews.append(review_data)
            
            self.logger.info(f"'{book_title}'에 대한 {len(reviews)}개의 리뷰를 찾았습니다.")
            return reviews
            
        except Exception as e:
            self.logger.error(f"리뷰 검색 실패: {e}")
            return []

    def _is_review_post(self, submission) -> bool:
        """게시물이 리뷰/감상문인지 판단합니다."""
        review_keywords = [
            'review', 'thoughts', 'finished', 'just read',
            'opinion', 'thoughts on', 'what did you think'
        ]
        
        title_lower = submission.title.lower()
        return any(keyword in title_lower for keyword in review_keywords)

    def get_trending_books(self, limit: int = 30) -> List[Dict]:
        """현재 트렌딩하는 책들을 찾습니다."""
        try:
            trending_books = []
            
            # 최근 인기 게시물에서 언급되는 책들 추출
            subreddit = self.reddit.subreddit('books')
            hot_posts = subreddit.hot(limit=limit)
            
            for post in hot_posts:
                if post.score > 100:  # 인기 게시물만
                    book_mentions = self._extract_book_mentions(post)
                    for book in book_mentions:
                        book['reddit_score'] = post.score
                        book['reddit_comments'] = post.num_comments
                        trending_books.append(book)
            
            # 중복 제거 및 점수순 정렬
            unique_books = {}
            for book in trending_books:
                title = book.get('title', '')
                if title not in unique_books or book['reddit_score'] > unique_books[title]['reddit_score']:
                    unique_books[title] = book
            
            sorted_books = sorted(unique_books.values(), key=lambda x: x['reddit_score'], reverse=True)
            
            self.logger.info(f"{len(sorted_books)}개의 트렌딩 책을 찾았습니다.")
            return sorted_books
            
        except Exception as e:
            self.logger.error(f"트렌딩 책 검색 실패: {e}")
            return []

    def _extract_book_mentions(self, submission) -> List[Dict]:
        """게시물에서 책 언급을 추출합니다."""
        # 간단한 책 제목 추출 로직 (추후 NLP로 개선 가능)
        book_mentions = []
        
        text = f"{submission.title} {submission.selftext}".lower()
        
        # 따옴표로 둘러싸인 텍스트를 책 제목으로 간주
        import re
        quoted_text = re.findall(r'"([^"]*)"', text)
        
        for quote in quoted_text:
            if len(quote) > 5 and len(quote) < 100:  # 합리적인 책 제목 길이
                book_mentions.append({
                    'title': quote,
                    'mentioned_in': submission.id,
                    'context': 'reddit_discussion'
                })
        
        return book_mentions