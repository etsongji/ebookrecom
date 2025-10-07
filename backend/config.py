import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID')
    REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET')
    REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT', 'BookRecommendationBot/1.0')
    
    FIREBASE_ADMIN_SDK_PATH = os.getenv('FIREBASE_ADMIN_SDK_PATH')
    
    GUTENBERG_BASE_URL = 'https://www.gutenberg.org'
    GOODREADS_BASE_URL = 'https://www.goodreads.com'
    
    REQUEST_DELAY = float(os.getenv('REQUEST_DELAY', '1.0'))
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))
    
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')