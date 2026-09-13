import fs from 'node:fs';

// Bookshelf groups that make up the classroom search catalog. Array order defines tag bits.
export const TAG_SHELVES = [
  ['children', ['Category: Children & Young Adult Reading']],
  ['classics', ['Best Books Ever Listings', 'Harvard Classics', 'Category: Classics of Literature']],
  ['poetry', ['Category: Poetry']],
  ['drama', ['Category: Plays/Films/Dramas']],
  [
    'stories',
    [
      'Category: Short Stories',
      'Category: Adventure',
      'Category: Science-Fiction & Fantasy',
      'Category: Mythology, Legends & Folklore',
      'Category: Crime, Thrillers and Mystery',
      'Category: Humour',
    ],
  ],
];

const BLOCKED_TOPICS =
  /erotic|erotica|pornograph|sex instruction|sexual intercourse|sex customs|prostitution|flagellation|sadism|masochism/i;

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function normalizeKey(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function displayTitle(raw) {
  const firstLine = raw.split('\n')[0];
  return firstLine.split(/[;:]/)[0].replace(/\s+/g, ' ').trim();
}

// "Carroll, Lewis, 1832-1898; Tenniel, John [Illustrator]" -> "Lewis Carroll"
export function displayAuthor(raw) {
  // Also drop expanded given names: "Baum, L. Frank (Lyman Frank)" -> "L. Frank Baum".
  const first = (raw.split(/;\s*/)[0] ?? '')
    .replace(/\s*\[[^\]]*\]\s*/g, ' ')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
  const withoutDates = first.replace(/(,\s*[^,]*\d[^,]*)+$/, '').trim();
  const parts = withoutDates.split(/,\s*/);
  // Swap only "Surname, Given names"; epithets such as "Marcus Aurelius, Emperor of Rome" keep their order.
  const looksLikeGivenNames = parts.length === 2 && parts[1] && !/\b[a-z]/.test(parts[1]);
  if (looksLikeGivenNames) return `${parts[1]} ${parts[0]}`.replace(/\s+/g, ' ');
  return withoutDates || 'Unknown';
}

export function loadEnglishTexts(csvPath) {
  const [, ...rows] = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  return rows
    .filter((r) => r[1] === 'Text' && (r[4] ?? '').split(/;\s*/).includes('en'))
    .map((r) => ({
      id: Number(r[0]),
      title: displayTitle(r[3]),
      fullTitle: r[3].replace(/\s+/g, ' ').trim(),
      author: displayAuthor(r[5]),
      rawAuthors: r[5],
      subjects: r[6] ?? '',
      shelves: r[8] ?? '',
    }));
}

export function tagMask(book) {
  return TAG_SHELVES.reduce(
    (mask, [, shelves], bit) => (shelves.some((s) => book.shelves.includes(s)) ? mask | (1 << bit) : mask),
    0,
  );
}

export function isClassroomSafe(book) {
  return (
    !BLOCKED_TOPICS.test(`${book.subjects} | ${book.shelves}`) &&
    !book.shelves.includes('Category: Sexuality & Erotica')
  );
}
