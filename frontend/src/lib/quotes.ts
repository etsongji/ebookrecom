import { POOL, gutenbergUrl } from './pool';
import type { Quote } from './types';

// Korean readings for the shelf's famous lines, keyed by Gutenberg book id.
// The English text itself is not stored here: it comes from pool.json, where
// build-pool.mjs keeps a line only if it appears verbatim in the source text.
const GLOSSES: Record<number, string> = {
  11: '점점 더 이상해, 점점 더 이상해!',
  16: '한 아이만 빼고, 모든 아이는 자란다.',
  55: '집만 한 곳은 없다.',
  84: '조심하라. 나는 두려울 것이 없고, 그래서 강하다.',
  98: '최고의 시절이자 최악의 시절이었다.',
  120: '죽은 자의 상자 위에 열다섯 사람',
  174: '유혹을 없애는 유일한 방법은 그 유혹에 굴복하는 것이다.',
  205: '내가 숲으로 간 것은 내 뜻대로 살아 보고 싶었기 때문이다.',
  219: '공포다! 공포다!',
  1065: '까마귀가 말했다',
  1260: '나는 새가 아니다. 어떤 그물도 나를 가두지 못한다.',
  1342: '재산이 넉넉한 독신 남자에게는 아내가 필요하다는 것, 이는 누구나 인정하는 진리다.',
  1399: '행복한 가정은 모두 비슷하지만, 불행한 가정은 제각기 다른 이유로 불행하다.',
  2701: '내 이름을 이슈메일이라 불러 달라.',
  27761: '사느냐, 죽느냐',
  64317: '그래서 우리는 물결을 거스르는 배처럼, 끊임없이 과거로 밀려가면서도 계속 나아간다.',
};

// The shelf's famous lines, easiest first. Plain objects so a server component
// can hand them to the client without shipping all of pool.json to the browser.
export const QUOTES: Quote[] = POOL.filter((book) => book.quote)
  .map((book) => {
    const text = (book.quote as string).trim();
    return {
      bookId: book.id,
      text,
      gloss: GLOSSES[book.id] ?? '',
      title: book.title,
      author: book.author,
      level: book.level,
      url: gutenbergUrl(book.id),
      words: text.split(/\s+/).length,
      chars: text.length,
    };
  })
  .sort((a, b) => a.level - b.level || a.chars - b.chars);
