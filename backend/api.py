from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
from datetime import datetime
from main import BookRecommendationCrawler

# FastAPI 애플리케이션 생성
app = FastAPI(
    title="구텐베르크 책 추천 크롤링 API",
    description="영어 수준별 및 필사용 추천 도서 크롤링 서비스",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 운영 환경에서는 구체적인 도메인 지정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/")
async def root():
    """API 루트 엔드포인트"""
    return {
        "message": "구텐베르크 책 추천 크롤링 API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "gutenberg-book-crawler"
    }

@app.post("/daily-update")
async def daily_update():
    """일일 추천 도서 업데이트 실행"""
    logger.info("일일 업데이트 API 호출됨")
    
    try:
        crawler = BookRecommendationCrawler()
        await crawler.run_daily_update()
        
        return {
            "status": "success",
            "message": "일일 추천 도서 업데이트 완료",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"일일 업데이트 실행 중 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"일일 업데이트 실행 실패: {str(e)}"
        )

@app.post("/full-crawl")
async def full_crawl():
    """전체 크롤링 실행"""
    logger.info("전체 크롤링 API 호출됨")
    
    try:
        crawler = BookRecommendationCrawler()
        await crawler.run_full_crawl()
        
        return {
            "status": "success",
            "message": "전체 크롤링 완료",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"전체 크롤링 실행 중 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"전체 크롤링 실행 실패: {str(e)}"
        )

@app.post("/incremental-crawl")
async def incremental_crawl():
    """증분 크롤링 실행"""
    logger.info("증분 크롤링 API 호출됨")
    
    try:
        crawler = BookRecommendationCrawler()
        await crawler.run_incremental_crawl()
        
        return {
            "status": "success",
            "message": "증분 크롤링 완료",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"증분 크롤링 실행 중 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"증분 크롤링 실행 실패: {str(e)}"
        )

@app.get("/status")
async def get_status():
    """크롤링 서비스 상태 확인"""
    try:
        # 간단한 테스트로 서비스 상태 확인
        crawler = BookRecommendationCrawler()
        
        return {
            "status": "operational",
            "services": {
                "gutenberg_crawler": "available",
                "reddit_crawler": "available",
                "goodreads_crawler": "available",
                "curated_recommendations": "available"
            },
            "timestamp": datetime.now().isoformat(),
            "last_update": "미구현"  # 실제로는 마지막 크롤링 시간을 DB에서 조회
        }
        
    except Exception as e:
        logger.error(f"상태 확인 중 오류: {e}")
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )