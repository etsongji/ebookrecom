# 배포 설정 가이드

## 1단계: Firebase 로그인 및 프로젝트 생성

### Firebase 로그인
```bash
firebase login
```

### Firebase 프로젝트 생성 (선택 1: CLI 사용)
```bash
firebase projects:create gutenberg-books-rec --display-name "구텐베르크 책 추천"
```

### Firebase 프로젝트 생성 (선택 2: 웹 콘솔 사용)
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `gutenberg-books-rec`
4. 표시 이름: `구텐베르크 책 추천`

## 2단계: Firebase 프로젝트 초기화

```bash
cd "C:\dev\cursor_ai_실습\책추천앱"
firebase use --add
```

프로젝트 선택 시 방금 생성한 프로젝트를 선택하고 alias를 `default`로 설정하세요.

## 3단계: Firebase 서비스 활성화

Firebase Console에서 다음 서비스들을 활성화하세요:

### Authentication
- Authentication > Sign-in method
- 이메일/비밀번호 활성화 (선택사항)

### Firestore Database
- Firestore Database > 데이터베이스 만들기
- 보안 규칙: 테스트 모드로 시작 (나중에 변경)
- 위치: asia-northeast1 (서울) 또는 us-central1

### Storage
- Storage > 시작하기
- 보안 규칙: 테스트 모드로 시작

### Functions
- Functions 자동 활성화 (첫 배포 시)

## 4단계: 환경 변수 설정

### Firebase 웹앱 생성
1. Firebase Console > 프로젝트 설정
2. "앱 추가" > 웹 선택
3. 앱 닉네임: `gutenberg-frontend`
4. Firebase Hosting 설정 체크
5. 설정 정보 복사

### 환경 변수 파일 생성

**frontend/.env.local**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_BASE_URL=https://your_region-your_project.cloudfunctions.net
```

## 5단계: Reddit API 설정 (선택사항)

Reddit 크롤링을 사용하려면:

1. [Reddit App 생성](https://www.reddit.com/prefs/apps)
2. 앱 타입: script 선택
3. 클라이언트 ID와 시크릿 복사

**backend/.env**
```env
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=BookRecommendationBot/1.0
REQUEST_DELAY=1.0
MAX_RETRIES=3
LOG_LEVEL=INFO
```

## 6단계: Firebase Admin SDK 키 생성

1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일을 `backend/firebase-admin-key.json`으로 저장

**backend/.env에 추가**
```env
FIREBASE_ADMIN_SDK_PATH=firebase-admin-key.json
```

## 준비 완료 후 실행할 명령어

설정이 완료되면 다음 명령어를 실행하세요:

```bash
# 1. Firebase 프로젝트 확인
firebase projects:list

# 2. 전체 배포
npm run deploy

# 또는 개별 배포
npm run build:functions
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore
```

---

위 단계들을 완료한 후 저에게 알려주시면 배포를 계속 진행하겠습니다!