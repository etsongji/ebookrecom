# 배포 가이드

구텐베르크 책 추천 서비스 배포 방법을 안내합니다.

## 목차

1. [필수 준비사항](#필수-준비사항)
2. [Firebase 프로젝트 설정](#firebase-프로젝트-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [백엔드 배포](#백엔드-배포)
5. [Firebase Functions 배포](#firebase-functions-배포)
6. [프론트엔드 배포](#프론트엔드-배포)
7. [크롤링 스케줄러 설정](#크롤링-스케줄러-설정)
8. [운영 및 모니터링](#운영-및-모니터링)

## 필수 준비사항

### 1. 계정 및 도구

- [Firebase 계정](https://firebase.google.com/)
- [Google Cloud Platform 계정](https://cloud.google.com/) (같은 구글 계정 사용)
- [Reddit API 계정](https://www.reddit.com/dev/api/)
- Node.js 18 이상
- Python 3.8 이상
- Firebase CLI

### 2. CLI 도구 설치

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Python 의존성
pip install -r backend/requirements.txt

# 프론트엔드 의존성
cd frontend
npm install
```

## Firebase 프로젝트 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `book-recommendation-app`)
4. Google Analytics 설정 (선택사항)

### 2. Firebase 서비스 활성화

Firebase Console에서 다음 서비스를 활성화:

- **Authentication**: 이메일/비밀번호 로그인 활성화
- **Firestore Database**: 기본 데이터베이스 생성
- **Storage**: 파일 저장소 활성화
- **Hosting**: 웹 호스팅 활성화
- **Functions**: Cloud Functions 활성화

### 3. 프로젝트 초기화

```bash
# Firebase 로그인
firebase login

# 프로젝트 디렉토리에서
firebase init

# 선택사항:
# - Functions (TypeScript)
# - Firestore
# - Storage
# - Hosting
# - 기존 프로젝트 사용 선택
```

## 환경 변수 설정

### 1. Firebase 설정 정보 확인

Firebase Console > 프로젝트 설정 > 일반 탭에서 Firebase 설정 정보 복사

### 2. 환경 변수 파일 생성

**frontend/.env.local**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_BASE_URL=https://your_region-your_project.cloudfunctions.net
```

**backend/.env**
```env
# Reddit API 설정
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=BookRecommendationBot/1.0

# Firebase Admin SDK
FIREBASE_ADMIN_SDK_PATH=path/to/firebase-admin-sdk.json

# 크롤링 설정
REQUEST_DELAY=1.0
MAX_RETRIES=3
LOG_LEVEL=INFO
```

### 3. Firebase Admin SDK 키 생성

1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. `backend/` 폴더에 저장

## Firebase Functions 배포

### 1. Firebase Functions 빌드

```bash
cd firebase
npm install
npm run build
```

### 2. Functions 배포

```bash
firebase deploy --only functions
```

### 3. Functions URL 확인

배포 완료 후 출력되는 Functions URL을 프론트엔드 환경변수에 설정

## 프론트엔드 배포

### 1. 빌드

```bash
cd frontend
npm run build
```

### 2. Firebase Hosting 배포

```bash
# 프로젝트 루트에서
firebase deploy --only hosting
```

## 백엔드 배포 (Cloud Run 사용)

### 1. Docker 이미지 생성

**backend/Dockerfile**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

**backend/api.py**
```python
from fastapi import FastAPI
import asyncio
from main import BookRecommendationCrawler

app = FastAPI()

@app.post("/daily-update")
async def daily_update():
    crawler = BookRecommendationCrawler()
    await crawler.run_daily_update()
    return {"status": "success"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### 2. Cloud Run 배포

```bash
# Google Cloud CLI 설치 및 로그인
gcloud auth login
gcloud config set project your_project_id

# 컨테이너 빌드 및 배포
cd backend
gcloud builds submit --tag gcr.io/your_project_id/book-crawler
gcloud run deploy book-crawler --image gcr.io/your_project_id/book-crawler --platform managed --region us-central1 --allow-unauthenticated
```

## 크롤링 스케줄러 설정

### 1. 수동 실행 테스트

```bash
cd backend
python main.py daily
```

### 2. Cloud Scheduler 설정

1. Google Cloud Console > Cloud Scheduler
2. 작업 생성:
   - 이름: `daily-book-recommendations`
   - 빈도: `0 2 * * *` (매일 오전 2시)
   - 대상 유형: HTTP
   - URL: Cloud Run 서비스 URL + `/daily-update`
   - HTTP 메서드: POST

### 3. Functions 스케줄러 활성화

Firebase Functions의 `dailyRecommendationUpdate` 함수가 자동으로 실행됩니다.

## Firestore 규칙 및 인덱스 배포

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

## 운영 및 모니터링

### 1. Firebase Console 모니터링

- **Functions**: 실행 로그, 오류 추적
- **Firestore**: 데이터베이스 사용량
- **Hosting**: 트래픽 통계
- **Authentication**: 사용자 통계

### 2. 로그 모니터링

```bash
# Functions 로그 확인
firebase functions:log

# Cloud Run 로그 확인
gcloud logs read --service book-crawler
```

### 3. 정기적인 유지보수

- **일일**: 크롤링 작업 성공 여부 확인
- **주간**: 데이터베이스 사용량 및 성능 점검
- **월간**: API 사용량 및 비용 검토

## 비용 최적화

### 1. Firebase 사용량 모니터링

- Firestore 읽기/쓰기 횟수
- Cloud Functions 실행 시간
- Storage 사용량

### 2. 최적화 방안

- Firestore 쿼리 최적화
- 이미지 압축
- CDN 캐싱 활용
- 불필요한 API 호출 제거

## 문제 해결

### 1. 자주 발생하는 문제

**Functions 배포 실패**
```bash
# Node.js 버전 확인
node --version  # 18 이상 필요

# 의존성 재설치
cd firebase
rm -rf node_modules package-lock.json
npm install
```

**Firestore 권한 오류**
- firestore.rules 파일 확인
- Authentication 설정 확인

**크롤링 실패**
- Reddit API 키 확인
- Request rate limit 확인
- 네트워크 연결 상태 확인

### 2. 디버깅 도구

```bash
# 로컬 테스트
firebase emulators:start

# 함수 로그 실시간 확인
firebase functions:log --follow

# 프론트엔드 빌드 오류 확인
cd frontend
npm run build
```

## 업데이트 및 배포

### 1. 코드 업데이트 시

```bash
# 1. 백엔드 업데이트
cd backend
python main.py daily  # 테스트

# 2. Functions 업데이트
cd firebase
npm run build
firebase deploy --only functions

# 3. 프론트엔드 업데이트
cd frontend
npm run build
firebase deploy --only hosting
```

### 2. 데이터베이스 스키마 변경

1. Firestore 인덱스 업데이트 필요시 `firestore.indexes.json` 수정
2. `firebase deploy --only firestore:indexes`
3. 기존 데이터 마이그레이션 스크립트 작성 및 실행

이 가이드를 따라하면 구텐베르크 책 추천 서비스를 성공적으로 배포할 수 있습니다.