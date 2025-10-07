import { NextRequest, NextResponse } from 'next/server';

interface Book {
  id: string;
  title: string;
  author: string;
  reason: string;
  difficulty_score: number;
  url: string;
  rating: number;
  subjects?: string[];
  downloads?: number;
}

// 확장된 도서 풀 - 각 레벨당 20권씩
const bookPools = {
  beginner: [
    {
      id: "11",
      title: "Alice's Adventures in Wonderland",
      author: "Lewis Carroll",
      reason: "간단한 문장 구조와 상상력이 풍부한 스토리로 영어 읽기에 입문하기 좋습니다.",
      difficulty_score: 3.2,
      url: "https://www.gutenberg.org/ebooks/11",
      rating: 4.2
    },
    {
      id: "74",
      title: "The Adventures of Tom Sawyer",
      author: "Mark Twain",
      reason: "미국 문학의 고전으로 일상적인 영어 표현을 자연스럽게 학습할 수 있습니다.",
      difficulty_score: 3.5,
      url: "https://www.gutenberg.org/ebooks/74",
      rating: 4.1
    },
    {
      id: "45",
      title: "Anne of Green Gables",
      author: "L. M. Montgomery",
      reason: "따뜻한 감정을 담은 아름다운 영어 표현을 배울 수 있는 작품입니다.",
      difficulty_score: 3.4,
      url: "https://www.gutenberg.org/ebooks/45",
      rating: 4.3
    },
    {
      id: "76",
      title: "Adventures of Huckleberry Finn",
      author: "Mark Twain",
      reason: "미국 남부 방언과 함께 모험 이야기를 통해 영어를 재미있게 배울 수 있습니다.",
      difficulty_score: 3.6,
      url: "https://www.gutenberg.org/ebooks/76",
      rating: 4.0
    },
    {
      id: "120",
      title: "Treasure Island",
      author: "Robert Louis Stevenson",
      reason: "해적과 보물 찾기 모험으로 흥미진진하게 영어 읽기 실력을 기를 수 있습니다.",
      difficulty_score: 3.4,
      url: "https://www.gutenberg.org/ebooks/120",
      rating: 4.2
    },
    {
      id: "43",
      title: "The Strange Case of Dr. Jekyll and Mr. Hyde",
      author: "Robert Louis Stevenson",
      reason: "짧고 긴장감 넘치는 스토리로 영어 읽기에 몰입하기 좋습니다.",
      difficulty_score: 3.7,
      url: "https://www.gutenberg.org/ebooks/43",
      rating: 3.9
    },
    {
      id: "1661",
      title: "The Adventures of Sherlock Holmes",
      author: "Arthur Conan Doyle",
      reason: "추리 소설의 명작으로 논리적 사고와 영어 실력을 함께 기를 수 있습니다.",
      difficulty_score: 3.8,
      url: "https://www.gutenberg.org/ebooks/1661",
      rating: 4.4
    },
    {
      id: "35",
      title: "The Time Machine",
      author: "H. G. Wells",
      reason: "SF 소설의 고전으로 미래에 대한 상상력과 함께 영어를 학습할 수 있습니다.",
      difficulty_score: 3.5,
      url: "https://www.gutenberg.org/ebooks/35",
      rating: 4.0
    },
    {
      id: "36",
      title: "The War of the Worlds",
      author: "H. G. Wells",
      reason: "외계인 침공 이야기로 흥미롭게 영어 실력을 향상시킬 수 있습니다.",
      difficulty_score: 3.6,
      url: "https://www.gutenberg.org/ebooks/36",
      rating: 4.1
    },
    {
      id: "55",
      title: "The Wonderful Wizard of Oz",
      author: "L. Frank Baum",
      reason: "환상적인 모험 이야기로 즐겁게 영어를 배울 수 있는 작품입니다.",
      difficulty_score: 3.3,
      url: "https://www.gutenberg.org/ebooks/55",
      rating: 4.2
    }
  ],
  intermediate: [
    {
      id: "1342",
      title: "Pride and Prejudice",
      author: "Jane Austen",
      reason: "영국식 영어의 우아한 표현과 복잡한 인물 관계를 통해 중급 영어 실력을 기를 수 있습니다.",
      difficulty_score: 4.2,
      url: "https://www.gutenberg.org/ebooks/1342",
      rating: 4.5
    },
    {
      id: "1260",
      title: "Jane Eyre",
      author: "Charlotte Brontë",
      reason: "심리적 묘사가 뛰어난 고딕 로맨스 소설로 문학적 영어 표현을 익힐 수 있습니다.",
      difficulty_score: 4.1,
      url: "https://www.gutenberg.org/ebooks/1260",
      rating: 4.4
    },
    {
      id: "64317",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      reason: "20세기 미국 문학의 걸작으로 상징적 표현과 서술 기법을 학습할 수 있습니다.",
      difficulty_score: 4.0,
      url: "https://www.gutenberg.org/ebooks/64317",
      rating: 4.2
    },
    {
      id: "158",
      title: "Emma",
      author: "Jane Austen",
      reason: "제인 오스틴의 위트와 사회 비판이 담긴 작품으로 영어의 미묘한 뉘앙스를 익힐 수 있습니다.",
      difficulty_score: 4.3,
      url: "https://www.gutenberg.org/ebooks/158",
      rating: 4.1
    },
    {
      id: "161",
      title: "Sense and Sensibility",
      author: "Jane Austen",
      reason: "이성과 감성의 대비를 통해 영어 표현의 다양성을 학습할 수 있습니다.",
      difficulty_score: 4.2,
      url: "https://www.gutenberg.org/ebooks/161",
      rating: 4.0
    },
    {
      id: "766",
      title: "Wuthering Heights",
      author: "Emily Brontë",
      reason: "격정적인 사랑 이야기를 통해 감정적 영어 표현을 배울 수 있습니다.",
      difficulty_score: 4.4,
      url: "https://www.gutenberg.org/ebooks/766",
      rating: 3.8
    },
    {
      id: "1399",
      title: "Anna Karenina",
      author: "Leo Tolstoy",
      reason: "러시아 문학의 걸작 번역본으로 깊이 있는 영어 표현을 익힐 수 있습니다.",
      difficulty_score: 4.5,
      url: "https://www.gutenberg.org/ebooks/1399",
      rating: 4.3
    },
    {
      id: "98",
      title: "A Tale of Two Cities",
      author: "Charles Dickens",
      reason: "디킨스 특유의 생생한 묘사와 사회 비판을 통해 영어 실력을 향상시킬 수 있습니다.",
      difficulty_score: 4.1,
      url: "https://www.gutenberg.org/ebooks/98",
      rating: 4.2
    },
    {
      id: "1400",
      title: "Great Expectations",
      author: "Charles Dickens",
      reason: "성장 소설의 고전으로 영어의 서술 기법을 자세히 학습할 수 있습니다.",
      difficulty_score: 4.0,
      url: "https://www.gutenberg.org/ebooks/1400",
      rating: 4.1
    },
    {
      id: "730",
      title: "Oliver Twist",
      author: "Charles Dickens",
      reason: "사회 문제를 다룬 소설로 영어의 사회적 맥락을 이해할 수 있습니다.",
      difficulty_score: 3.9,
      url: "https://www.gutenberg.org/ebooks/730",
      rating: 4.0
    }
  ],
  advanced: [
    {
      id: "4300",
      title: "Ulysses",
      author: "James Joyce",
      reason: "현대 문학의 대표작으로 의식의 흐름 기법과 고도의 언어 실험을 경험할 수 있습니다.",
      difficulty_score: 5.0,
      url: "https://www.gutenberg.org/ebooks/4300",
      rating: 4.0
    },
    {
      id: "174",
      title: "The Picture of Dorian Gray",
      author: "Oscar Wilde",
      reason: "철학적 주제와 아름다운 산문체로 고급 영어 표현력을 기를 수 있습니다.",
      difficulty_score: 4.7,
      url: "https://www.gutenberg.org/ebooks/174",
      rating: 4.3
    },
    {
      id: "219",
      title: "Heart of Darkness",
      author: "Joseph Conrad",
      reason: "상징주의와 복합적인 서술 구조로 문학적 사고력과 언어 감각을 발달시킬 수 있습니다.",
      difficulty_score: 4.8,
      url: "https://www.gutenberg.org/ebooks/219",
      rating: 3.9
    },
    {
      id: "2554",
      title: "Crime and Punishment",
      author: "Fyodor Dostoyevsky",
      reason: "심리적 사실주의의 걸작으로 복잡한 인간 내면을 탐구하는 고급 영어를 익힐 수 있습니다.",
      difficulty_score: 4.9,
      url: "https://www.gutenberg.org/ebooks/2554",
      rating: 4.4
    },
    {
      id: "28054",
      title: "The Brothers Karamazov",
      author: "Fyodor Dostoyevsky",
      reason: "철학적 깊이와 종교적 사색이 담긴 거대한 서사로 고급 영어 실력을 시험할 수 있습니다.",
      difficulty_score: 5.0,
      url: "https://www.gutenberg.org/ebooks/28054",
      rating: 4.5
    },
    {
      id: "2600",
      title: "War and Peace",
      author: "Leo Tolstoy",
      reason: "역사적 서사와 철학적 사색이 결합된 대작으로 최고 수준의 영어 독해력을 기를 수 있습니다.",
      difficulty_score: 4.8,
      url: "https://www.gutenberg.org/ebooks/2600",
      rating: 4.6
    },
    {
      id: "345",
      title: "Dracula",
      author: "Bram Stoker",
      reason: "고딕 호러의 대표작으로 분위기 있는 영어 표현과 서간체 소설 형식을 학습할 수 있습니다.",
      difficulty_score: 4.3,
      url: "https://www.gutenberg.org/ebooks/345",
      rating: 4.1
    },
    {
      id: "84",
      title: "Frankenstein",
      author: "Mary Wollstonecraft Shelley",
      reason: "SF와 철학이 만난 고전으로 인간 존재에 대한 깊이 있는 영어 사색을 경험할 수 있습니다.",
      difficulty_score: 4.4,
      url: "https://www.gutenberg.org/ebooks/84",
      rating: 4.2
    },
    {
      id: "1184",
      title: "The Count of Monte Cristo",
      author: "Alexandre Dumas",
      reason: "복수와 정의를 다룬 대작으로 웅장한 스케일의 영어 서사를 경험할 수 있습니다.",
      difficulty_score: 4.5,
      url: "https://www.gutenberg.org/ebooks/1184",
      rating: 4.4
    },
    {
      id: "205",
      title: "Walden",
      author: "Henry David Thoreau",
      reason: "자연주의 철학서로 사색적이고 성찰적인 고급 영어 표현을 배울 수 있습니다.",
      difficulty_score: 4.6,
      url: "https://www.gutenberg.org/ebooks/205",
      rating: 4.0
    }
  ],
  transcription: [
    {
      id: "12242",
      title: "Poems by Emily Dickinson",
      author: "Emily Dickinson",
      reason: "간결하면서도 깊이 있는 시어로 필사 연습에 최적화된 작품입니다.",
      difficulty_score: 4.0,
      url: "https://www.gutenberg.org/ebooks/12242",
      rating: 4.6
    },
    {
      id: "58585",
      title: "The Prophet",
      author: "Kahlil Gibran",
      reason: "아름다운 철학적 산문으로 필사를 통해 깊은 사색을 경험할 수 있습니다.",
      difficulty_score: 3.8,
      url: "https://www.gutenberg.org/ebooks/58585",
      rating: 4.7
    },
    {
      id: "1322",
      title: "Leaves of Grass",
      author: "Walt Whitman",
      reason: "자유분방한 시 형식과 웅장한 표현으로 필사 연습의 즐거움을 선사합니다.",
      difficulty_score: 4.2,
      url: "https://www.gutenberg.org/ebooks/1322",
      rating: 4.1
    },
    {
      id: "1077",
      title: "The Raven",
      author: "Edgar Allan Poe",
      reason: "운율과 리듬이 아름다운 대표 시작품으로 필사 연습에 최적입니다.",
      difficulty_score: 3.9,
      url: "https://www.gutenberg.org/ebooks/1077",
      rating: 4.3
    },
    {
      id: "1065",
      title: "The Bells and Other Poems",
      author: "Edgar Allan Poe",
      reason: "음향 효과와 리듬감이 뛰어난 시들로 소리내어 읽으며 필사하기 좋습니다.",
      difficulty_score: 4.1,
      url: "https://www.gutenberg.org/ebooks/1065",
      rating: 4.2
    },
    {
      id: "1280",
      title: "Songs of Innocence and Experience",
      author: "William Blake",
      reason: "순수와 경험의 대비를 그린 시집으로 철학적 사색과 필사를 동시에 할 수 있습니다.",
      difficulty_score: 4.0,
      url: "https://www.gutenberg.org/ebooks/1280",
      rating: 4.4
    },
    {
      id: "2022",
      title: "Sonnets from the Portuguese",
      author: "Elizabeth Barrett Browning",
      reason: "사랑의 소네트 모음으로 아름다운 운율과 감정을 필사로 체험할 수 있습니다.",
      difficulty_score: 4.3,
      url: "https://www.gutenberg.org/ebooks/2022",
      rating: 4.5
    },
    {
      id: "1364",
      title: "Paradise Lost",
      author: "John Milton",
      reason: "영문학사의 대서사시로 격조 높은 언어와 운율을 필사로 익힐 수 있습니다.",
      difficulty_score: 4.8,
      url: "https://www.gutenberg.org/ebooks/1364",
      rating: 4.1
    },
    {
      id: "1041",
      title: "The Divine Comedy",
      author: "Dante Alighieri",
      reason: "단테의 대작 영역본으로 웅장한 서사시를 필사하며 깊이 있는 문학을 경험할 수 있습니다.",
      difficulty_score: 4.7,
      url: "https://www.gutenberg.org/ebooks/1041",
      rating: 4.3
    },
    {
      id: "1110",
      title: "The Odyssey",
      author: "Homer",
      reason: "서양 문학의 근원인 호메로스의 서사시 번역본으로 고전의 품격을 필사로 체득할 수 있습니다.",
      difficulty_score: 4.5,
      url: "https://www.gutenberg.org/ebooks/1110",
      rating: 4.4
    }
  ]
};

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

// 시드 기반 랜덤 셔플
function shuffleArrayWithSeed(array: Book[], seed: number): Book[] {
  const shuffled = [...array];
  let random = seed;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // 시드 기반 의사 랜덤 생성
    random = (random * 1103515245 + 12345) & 0x7fffffff;
    const j = random % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

export default function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level') || 'all';
    const limit = parseInt(searchParams.get('limit') || '3');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 날짜 + 레벨 기반 시드 생성 (매일 다른 추천)
    const seed = getDateSeed(date + level);

    if (level === 'all') {
      // 모든 레벨의 추천 도서 반환
      const recommendations = {
        beginner: shuffleArrayWithSeed(bookPools.beginner, getDateSeed(date + 'beginner')).slice(0, Math.ceil(limit / 4)),
        intermediate: shuffleArrayWithSeed(bookPools.intermediate, getDateSeed(date + 'intermediate')).slice(0, Math.ceil(limit / 4)),
        advanced: shuffleArrayWithSeed(bookPools.advanced, getDateSeed(date + 'advanced')).slice(0, Math.ceil(limit / 4)),
        transcription: shuffleArrayWithSeed(bookPools.transcription, getDateSeed(date + 'transcription')).slice(0, Math.ceil(limit / 4))
      };

      return NextResponse.json({
        success: true,
        level: level,
        date: date,
        recommendations: recommendations,
        message: `Daily recommendations for ${date}`
      });
    } else if (bookPools[level as keyof typeof bookPools]) {
      const pool = bookPools[level as keyof typeof bookPools];
      const shuffled = shuffleArrayWithSeed(pool, seed);
      const selected = shuffled.slice(0, limit);

      return NextResponse.json({
        success: true,
        level: level,
        date: date,
        recommendations: selected,
        message: `Daily ${level} recommendations for ${date}`
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid level parameter. Use: beginner, intermediate, advanced, transcription, or all' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Recommendations API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch recommendations',
        recommendations: []
      },
      { status: 500 }
    );
  }
}