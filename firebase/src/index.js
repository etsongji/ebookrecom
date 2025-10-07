const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

// 간단한 API 엔드포인트
exports.api = onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const db = admin.firestore();
  
  try {
    if (req.path === '/books/search' && req.method === 'GET') {
      const {query = '', page = '1', limit = '20'} = req.query;
      
      if (!query) {
        res.status(400).json({error: "검색어가 필요합니다."});
        return;
      }

      // 임시 응답 데이터
      res.json({
        books: [
          {
            id: "1342",
            title: "Pride and Prejudice",
            author: "Jane Austen",
            downloads: 50000,
            subjects: ["Romance", "Fiction"],
            language: "English",
            cover_image: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg"
          },
          {
            id: "74",
            title: "The Adventures of Tom Sawyer",
            author: "Mark Twain", 
            downloads: 30000,
            subjects: ["Fiction", "Adventure"],
            language: "English"
          },
          {
            id: "2701",
            title: "Moby Dick; Or, The Whale",
            author: "Herman Melville",
            downloads: 25000,
            subjects: ["Fiction", "Adventure"],
            language: "English"
          }
        ],
        page: parseInt(page),
        limit: parseInt(limit),
        total: 3
      });
      return;
    }

    if (req.path === '/recommendations/english-levels' && req.method === 'GET') {
      res.json({
        all_levels: {
          beginner: [
            {
              id: "74",
              title: "The Adventures of Tom Sawyer",
              author: "Mark Twain",
              english_level: "beginner",
              downloads: 30000,
              subjects: ["Fiction", "Adventure"],
              language: "English"
            },
            {
              id: "11",
              title: "Alice's Adventures in Wonderland",
              author: "Lewis Carroll",
              english_level: "beginner",
              downloads: 40000,
              subjects: ["Fiction", "Fantasy"],
              language: "English"
            }
          ],
          intermediate: [
            {
              id: "1342", 
              title: "Pride and Prejudice",
              author: "Jane Austen",
              english_level: "intermediate",
              downloads: 50000,
              subjects: ["Romance", "Fiction"],
              language: "English"
            },
            {
              id: "1260",
              title: "Jane Eyre: An Autobiography",
              author: "Charlotte Brontë",
              english_level: "intermediate",
              downloads: 35000,
              subjects: ["Romance", "Fiction"],
              language: "English"
            }
          ],
          advanced: [
            {
              id: "2701",
              title: "Moby Dick; Or, The Whale",
              author: "Herman Melville", 
              english_level: "advanced",
              downloads: 25000,
              subjects: ["Fiction", "Adventure"],
              language: "English"
            },
            {
              id: "28054",
              title: "The Brothers Karamazov",
              author: "Fyodor Dostoyevsky",
              english_level: "advanced", 
              downloads: 15000,
              subjects: ["Fiction", "Philosophy"],
              language: "English"
            }
          ]
        },
        today_picks: {
          beginner: [{id: "74", title: "The Adventures of Tom Sawyer", author: "Mark Twain", english_level: "beginner"}],
          intermediate: [{id: "1342", title: "Pride and Prejudice", author: "Jane Austen", english_level: "intermediate"}],
          advanced: [{id: "2701", title: "Moby Dick; Or, The Whale", author: "Herman Melville", english_level: "advanced"}]
        }
      });
      return;
    }

    if (req.path === '/recommendations/transcription' && req.method === 'GET') {
      res.json({
        books: [
          {
            id: "1342",
            title: "Pride and Prejudice", 
            author: "Jane Austen",
            recommended_for: "필사 연습",
            writing_style: "우아하고 정교한 문체",
            transcription_difficulty: "중급 (적당한 문체)"
          },
          {
            id: "1260",
            title: "Jane Eyre: An Autobiography",
            author: "Charlotte Brontë",
            recommended_for: "필사 연습", 
            writing_style: "감성적이고 서정적인 표현",
            transcription_difficulty: "중급 (적당한 문체)"
          },
          {
            id: "174",
            title: "The Picture of Dorian Gray",
            author: "Oscar Wilde",
            recommended_for: "필사 연습",
            writing_style: "위트와 철학이 담긴 문장",
            transcription_difficulty: "고급 (복잡한 문체)"
          }
        ],
        today_pick: [{
          id: "1342",
          title: "Pride and Prejudice",
          author: "Jane Austen",
          recommended_for: "필사 연습"
        }],
        total: 3
      });
      return;
    }

    if (req.path === '/quotes/today' && req.method === 'GET') {
      res.json({
        quotes: [
          {
            id: "1",
            book_title: "Pride and Prejudice",
            author: "Jane Austen", 
            quote: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
            book_id: "1342"
          },
          {
            id: "2",
            book_title: "Jane Eyre",
            author: "Charlotte Brontë",
            quote: "I am no bird; and no net ensnares me: I am a free human being with an independent will.",
            book_id: "1260"
          },
          {
            id: "3", 
            book_title: "Alice's Adventures in Wonderland",
            author: "Lewis Carroll",
            quote: "We're all mad here.",
            book_id: "11"
          }
        ],
        date: new Date().toISOString().split('T')[0]
      });
      return;
    }

    res.status(404).json({error: "API 엔드포인트를 찾을 수 없습니다."});

  } catch (error) {
    logger.error("API 오류:", error);
    res.status(500).json({error: "서버 오류가 발생했습니다."});
  }
});

// 매일 새벽 2시 추천 도서 업데이트
exports.dailyRecommendationUpdate = onSchedule("0 2 * * *", async (event) => {
  logger.info("일일 추천 도서 업데이트 시작");
  
  try {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    
    // 기본 추천 데이터 생성
    await db.collection("daily_recommendations").doc(today).set({
      all_recommendations: {
        english_levels: {
          beginner: [
            {id: "74", title: "The Adventures of Tom Sawyer", author: "Mark Twain", english_level: "beginner"}
          ],
          intermediate: [
            {id: "1342", title: "Pride and Prejudice", author: "Jane Austen", english_level: "intermediate"}
          ],
          advanced: [
            {id: "2701", title: "Moby Dick; Or, The Whale", author: "Herman Melville", english_level: "advanced"}
          ]
        },
        transcription: [
          {id: "1342", title: "Pride and Prejudice", author: "Jane Austen", recommended_for: "필사 연습"}
        ]
      },
      today_picks: {
        beginner: [{id: "74", title: "The Adventures of Tom Sawyer", author: "Mark Twain"}],
        intermediate: [{id: "1342", title: "Pride and Prejudice", author: "Jane Austen"}],
        advanced: [{id: "2701", title: "Moby Dick; Or, The Whale", author: "Herman Melville"}],
        transcription: [{id: "1342", title: "Pride and Prejudice", author: "Jane Austen"}]
      },
      generated_at: new Date().toISOString(),
      source: "scheduled_task",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info("일일 추천 도서 업데이트 완료");
    
  } catch (error) {
    logger.error("일일 추천 업데이트 오류:", error);
  }
});