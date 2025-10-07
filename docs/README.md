# 구텐베르크 책 추천 서비스

Project Gutenberg의 무료 전자책을 기반으로 한 개인화된 책 추천 웹서비스입니다.

## 📖 주요 기능

- **영어 수준별 추천**: 초급, 중급, 고급으로 나누어 적절한 난이도의 책 추천
- **필사용 도서 추천**: 아름다운 문체와 명문장이 포함된 필사 연습용 도서 추천
- **매일 업데이트**: 매일 새로운 추천 도서와 명문장 제공
- **무료 전자책**: Project Gutenberg의 60,000여 권의 무료 전자책 제공
- **다양한 형식**: EPUB, PDF, TXT 등 다양한 형식으로 다운로드 가능
- **검색 기능**: 제목, 작가명으로 쉽게 원하는 책 검색

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (React 18)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태관리**: React Hooks
- **아이콘**: Heroicons

### Backend
- **크롤링**: Python (BeautifulSoup, requests, praw)
- **API**: Firebase Cloud Functions (Node.js/TypeScript)
- **데이터베이스**: Firebase Firestore
- **인증**: Firebase Authentication (선택사항)
- **파일저장**: Firebase Storage

### Infrastructure
- **호스팅**: Firebase Hosting
- **서버리스**: Firebase Cloud Functions
- **스케줄링**: Cloud Scheduler
- **모니터링**: Firebase Console

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/gutenberg-book-recommendation.git
cd gutenberg-book-recommendation
```

### 2. 환경 설정
```bash
# 프론트엔드 의존성 설치
cd frontend
npm install

# 백엔드 의존성 설치
cd ../backend
pip install -r requirements.txt

# Firebase CLI 설치
npm install -g firebase-tools
```

### 3. 환경 변수 설정
```bash
# frontend/.env.local 파일 생성
cp frontend/.env.local.example frontend/.env.local

# backend/.env 파일 생성
cp backend/.env.example backend/.env
```

환경 변수 파일에 필요한 API 키들을 입력하세요.

### 4. 개발 서버 실행
```bash
# 프론트엔드 (포트 3000)
cd frontend
npm run dev

# Firebase 에뮬레이터 (포트 5001, 8080, 9099)
firebase emulators:start
```

## 📁 프로젝트 구조

```
책추천앱/
├── frontend/           # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/       # Next.js 13+ App Router
│   │   ├── components/ # 재사용 가능한 컴포넌트
│   │   ├── hooks/     # React 커스텀 훅
│   │   ├── lib/       # 라이브러리 설정
│   │   └── types/     # TypeScript 타입 정의
│   └── package.json
├── backend/           # Python 크롤링 시스템
│   ├── gutenberg_crawler.py  # Project Gutenberg 크롤러
│   ├── reddit_crawler.py     # Reddit 크롤러
│   ├── goodreads_crawler.py  # Goodreads 크롤러
│   ├── curated_recommendations.py  # 큐레이션된 추천
│   ├── main.py              # 메인 크롤링 스크립트
│   └── requirements.txt
├── firebase/          # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts   # Functions 엔트리포인트
│   └── package.json
├── docs/             # 문서
│   ├── DEPLOYMENT.md # 배포 가이드
│   └── README.md     # 이 파일
├── firebase.json     # Firebase 설정
├── firestore.rules   # Firestore 보안 규칙
└── firestore.indexes.json  # Firestore 인덱스
```

## 🔧 주요 컴포넌트 설명

### 크롤링 시스템
- **GutenbergCrawler**: Project Gutenberg 사이트에서 도서 정보 수집
- **RedditCrawler**: Reddit에서 책 관련 토론, 추천, 리뷰 수집
- **GoodreadsCrawler**: Goodreads에서 평점, 리뷰, 상세 정보 수집
- **CuratedRecommendations**: 영어 수준별, 필사용 도서 큐레이션

### 프론트엔드
- **BookCard**: 책 정보 카드 컴포넌트
- **Header**: 네비게이션 헤더
- **검색 페이지**: 책 검색 및 필터링 기능
- **추천 페이지**: 영어 수준별, 필사용 추천 도서
- **홈페이지**: 서비스 소개 및 주요 기능

### API 엔드포인트
- `GET /api/books/search`: 책 검색
- `GET /api/books/:id`: 책 상세 정보
- `GET /api/recommendations/english-levels`: 영어 수준별 추천
- `GET /api/recommendations/transcription`: 필사용 추천
- `GET /api/quotes/today`: 오늘의 명문장

## 🎯 사용법

### 1. 영어 수준별 도서 추천
- 초급: Alice in Wonderland, Tom Sawyer 등 쉬운 어휘의 클래식
- 중급: Pride and Prejudice, Jane Eyre 등 적당한 복잡도
- 고급: Moby Dick, Brothers Karamazov 등 고전 문학

### 2. 필사용 도서 추천
- 우아한 문체의 Jane Austen 작품들
- 시적인 표현의 Brontë 자매 작품들
- 위트 있는 Oscar Wilde 작품들

### 3. 검색 기능
- 책 제목 또는 작가명으로 검색
- 정렬 옵션: 다운로드 수, 평점, 제목순
- 필터 기능으로 원하는 조건의 책 찾기

## 🔄 매일 업데이트

매일 새벽 2시에 다음 작업이 자동으로 실행됩니다:

1. **도서 정보 업데이트**: Project Gutenberg에서 최신 도서 정보 수집
2. **추천 알고리즘 실행**: 영어 수준별, 필사용 추천 도서 선정
3. **명문장 선별**: 추천 도서에서 유명한 명문장 추출
4. **데이터베이스 업데이트**: Firebase Firestore에 새로운 데이터 저장

## 📊 데이터 소스

- **Project Gutenberg**: 60,000여 권의 무료 전자책
- **Reddit**: 책 추천, 리뷰, 토론 데이터 (books, booksuggestions 등)
- **Goodreads**: 평점, 리뷰, 상세 정보 (제한적 크롤링)

## 🚀 배포

자세한 배포 방법은 [DEPLOYMENT.md](docs/DEPLOYMENT.md)를 참고하세요.

### 간단 배포 명령어
```bash
# Firebase 프로젝트 설정 후
firebase deploy
```

## 🤝 기여하기

1. 이 저장소를 Fork 합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 📞 문의

- 이메일: your.email@example.com
- GitHub Issues: [Issues 페이지](https://github.com/your-username/gutenberg-book-recommendation/issues)

## 🙏 감사의 말

- [Project Gutenberg](https://www.gutenberg.org/): 무료 전자책 제공
- [Reddit](https://www.reddit.com/): 책 관련 커뮤니티 데이터
- [Firebase](https://firebase.google.com/): 백엔드 인프라 제공
- [Next.js](https://nextjs.org/): 훌륭한 React 프레임워크
- [Tailwind CSS](https://tailwindcss.com/): 유용한 CSS 프레임워크

## 📈 향후 계획

- [ ] 사용자별 개인화 추천 알고리즘 개선
- [ ] 모바일 앱 개발
- [ ] 다국어 지원 (한국어, 스페인어 등)
- [ ] AI 기반 책 요약 기능
- [ ] 소셜 기능 (북클럽, 독서 챌린지)
- [ ] 오디오북 연동

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!