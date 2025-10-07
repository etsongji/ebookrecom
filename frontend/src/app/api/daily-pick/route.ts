import { NextRequest, NextResponse } from 'next/server';

interface DailyPick {
  id: string;
  title: string;
  author: string;
  reason: string;
  difficulty_score: number;
  url: string;
  rating: number;
  level: string;
  quote: string;
  date: string;
}

// 특별 추천 도서 풀
const specialBooks: Omit<DailyPick, 'date'>[] = [
  {
    id: "11",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    reason: "상상력과 언어유희가 가득한 영원한 고전. 오늘은 이상한 나라의 모험을 떠나보세요!",
    difficulty_score: 3.2,
    url: "https://www.gutenberg.org/ebooks/11",
    rating: 4.2,
    level: "beginner",
    quote: "Why, sometimes I've believed as many as six impossible things before breakfast."
  },
  {
    id: "1342",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    reason: "시대를 초월한 로맨스와 사회 비판이 완벽하게 조화된 작품. 엘리자베스와 다시 만나보세요.",
    difficulty_score: 4.2,
    url: "https://www.gutenberg.org/ebooks/1342",
    rating: 4.5,
    level: "intermediate",
    quote: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife."
  },
  {
    id: "174",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    reason: "아름다움과 도덕성에 대한 깊은 성찰. 와일드의 기지와 철학이 만나는 걸작입니다.",
    difficulty_score: 4.7,
    url: "https://www.gutenberg.org/ebooks/174",
    rating: 4.3,
    level: "advanced",
    quote: "I can resist everything except temptation."
  },
  {
    id: "74",
    title: "The Adventures of Tom Sawyer",
    author: "Mark Twain",
    reason: "미시시피 강변의 소년 톰과 함께하는 모험. 마크 트웨인의 유머와 따뜻함을 느껴보세요.",
    difficulty_score: 3.5,
    url: "https://www.gutenberg.org/ebooks/74",
    rating: 4.1,
    level: "beginner",
    quote: "The secret of getting ahead is getting started."
  },
  {
    id: "1260",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    reason: "독립적인 여성의 성장 이야기. 제인의 강인한 정신력과 사랑을 다시 경험해보세요.",
    difficulty_score: 4.1,
    url: "https://www.gutenberg.org/ebooks/1260",
    rating: 4.4,
    level: "intermediate",
    quote: "I am no bird; and no net ensnares me: I am a free human being with an independent will."
  },
  {
    id: "4300",
    title: "Ulysses",
    author: "James Joyce",
    reason: "현대 문학의 최고봉. 의식의 흐름 기법으로 인간 내면을 탐구한 실험적 걸작입니다.",
    difficulty_score: 5.0,
    url: "https://www.gutenberg.org/ebooks/4300",
    rating: 4.0,
    level: "advanced",
    quote: "History is a nightmare from which I am trying to awake."
  },
  {
    id: "98",
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    reason: "혁명 시대의 인간 드라마. 디킨스의 생생한 역사 묘사와 감동적인 이야기를 만나보세요.",
    difficulty_score: 4.1,
    url: "https://www.gutenberg.org/ebooks/98",
    rating: 4.2,
    level: "intermediate",
    quote: "It was the best of times, it was the worst of times."
  },
  {
    id: "12242",
    title: "Poems by Emily Dickinson",
    author: "Emily Dickinson",
    reason: "간결한 언어에 담긴 깊은 철학. 디킨슨의 시는 필사하며 음미하기에 완벽합니다.",
    difficulty_score: 4.0,
    url: "https://www.gutenberg.org/ebooks/12242",
    rating: 4.6,
    level: "transcription",
    quote: "Hope is the thing with feathers that perches in the soul."
  },
  {
    id: "219",
    title: "Heart of Darkness",
    author: "Joseph Conrad",
    reason: "인간 내면의 어둠을 탐구한 현대 문학의 고전. 콘래드의 깊이 있는 심리 묘사를 경험하세요.",
    difficulty_score: 4.8,
    url: "https://www.gutenberg.org/ebooks/219",
    rating: 3.9,
    level: "advanced",
    quote: "The horror! The horror!"
  },
  {
    id: "1322",
    title: "Leaves of Grass",
    author: "Walt Whitman",
    reason: "미국적 정신을 노래한 자유시의 대표작. 휘트먼의 웅장한 언어로 필사 연습을 해보세요.",
    difficulty_score: 4.2,
    url: "https://www.gutenberg.org/ebooks/1322",
    rating: 4.1,
    level: "transcription",
    quote: "Do I contradict myself? Very well then I contradict myself, I am large, I contain multitudes."
  }
];

// 날짜 기반 시드 생성 함수
function getDateSeed(date: string = new Date().toISOString().split('T')[0]): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash);
}

// 날짜별 특별 추천 선택
function getDailyPick(date: string): DailyPick {
  const seed = getDateSeed(date);
  const index = seed % specialBooks.length;
  const selected = specialBooks[index];
  
  return {
    ...selected,
    date: date
  };
}

// 특별한 날짜별 추천 (기념일 등)
function getSpecialDateRecommendation(date: string): DailyPick | null {
  const [, month, day] = date.split('-');
  const monthDay = `${month}-${day}`;
  
  // 특별한 날짜별 추천
  const specialDates: { [key: string]: number } = {
    '12-25': 0, // 크리스마스 - Alice
    '10-31': 2, // 할로윈 - Dorian Gray
    '02-14': 1, // 발렌타인데이 - Pride and Prejudice
    '04-23': 6, // 세계 책의 날 - A Tale of Two Cities
    '07-04': 3, // 미국 독립기념일 - Tom Sawyer
    '01-01': 7, // 신정 - Emily Dickinson
  };
  
  if (specialDates[monthDay] !== undefined) {
    const selected = specialBooks[specialDates[monthDay]];
    return {
      ...selected,
      date: date,
      reason: `🎉 특별한 날을 기념하여: ${selected.reason}`
    };
  }
  
  return null;
}

export function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inputDate = searchParams.get('date');
    const today = inputDate || new Date().toISOString().split('T')[0];
    
    // 특별한 날짜 확인
    const specialPick = getSpecialDateRecommendation(today);
    const dailyPick = specialPick || getDailyPick(today);
    
    // 요일별 메시지 추가
    const dayOfWeek = new Date(today).getDay();
    const dayMessages = [
      "일요일의 여유로운 독서", // 0: 일요일
      "월요일을 시작하는 책", // 1: 월요일  
      "화요일의 활력을 주는 이야기", // 2: 화요일
      "수요일 중간 지점의 휴식", // 3: 수요일
      "목요일 저녁의 깊이 있는 읽기", // 4: 목요일
      "금요일을 마무리하는 책", // 5: 금요일
      "토요일의 특별한 만남" // 6: 토요일
    ];
    
    return NextResponse.json({
      success: true,
      date: today,
      dayMessage: dayMessages[dayOfWeek],
      isSpecialDate: !!specialPick,
      dailyPick: dailyPick,
      message: `Today's special recommendation for ${today}`,
      nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Daily Pick API Error:', error);
    
    // 에러 발생시 기본 추천
    const fallbackPick = {
      ...specialBooks[0],
      date: new Date().toISOString().split('T')[0]
    };
    
    return NextResponse.json({
      success: false,
      date: new Date().toISOString().split('T')[0],
      dailyPick: fallbackPick,
      message: 'Error occurred, showing default recommendation'
    }, { status: 200 });
  }
}