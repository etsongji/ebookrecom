// Builds src/data/pool.json: the curated reading shelf with measured levels and copyable passages.
// Usage: node scripts/build-pool.mjs <pg_catalog.csv> <downloads.json>
// Plain texts are cached in scripts/.cache/texts so reruns do not hit the mirror again.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnglishTexts, normalizeKey } from './lib/catalog.mjs';
import {
  buildFrequencyRank,
  cleanBody,
  containsPassage,
  countWords,
  measure,
  pickSentences,
  pickStanzas,
  proseParagraphs,
} from './lib/text.mjs';
import { SOURCES } from './pool-sources.mjs';

const WORDS_PER_MINUTE = 150;
const LEVEL_COUNT = 5;
const MEASURED_TRACKS = new Set(['story', 'novel', 'nonfiction']);
// Length carries the most weight: translated novels have short sentences but are long hauls for students,
// and genre vocabulary (sailing, sled dogs) inflates the rare-word share.
const WEIGHTS = { fk: 0.3, rare: 0.25, wordLength: 0.1, length: 0.35 };
// Minimum level by word count, applied after ranking.
const LENGTH_FLOORS = [
  [400000, 5],
  [250000, 4],
];
const EDITION_NOISE =
  /\b(vol|volume|part|chapters?|index|illustrated|html|junior|told to|one syllable|abridged|condensed|play founded|retold|selections?)\b/i;

const [csvPath, downloadsPath] = process.argv.slice(2);
if (!csvPath || !downloadsPath) {
  console.error('Usage: node scripts/build-pool.mjs <pg_catalog.csv> <downloads.json>');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, 'scripts', '.cache', 'texts');
fs.mkdirSync(cacheDir, { recursive: true });

const downloads = JSON.parse(fs.readFileSync(downloadsPath, 'utf8'));
const catalog = loadEnglishTexts(csvPath);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function resolveEdition(source) {
  const title = normalizeKey(source.title);
  const author = normalizeKey(source.author);
  const allowNoise = EDITION_NOISE.test(source.title);
  const hits = catalog.filter(
    (book) =>
      normalizeKey(book.fullTitle).includes(title) &&
      normalizeKey(book.rawAuthors).includes(author) &&
      (allowNoise || !EDITION_NOISE.test(book.fullTitle)),
  );
  hits.sort((a, b) => (downloads[b.id] ?? 0) - (downloads[a.id] ?? 0));
  return hits[0] ?? null;
}

function mirrorUrls(id) {
  const s = String(id);
  const dir = s.length === 1 ? `0/${s}` : `${s.slice(0, -1).split('').join('/')}/${s}`;
  return [
    `https://gutenberg.pglaf.org/${dir}/${s}-0.txt`,
    `https://gutenberg.pglaf.org/${dir}/${s}.txt`,
    `https://www.gutenberg.org/cache/epub/${s}/pg${s}.txt`,
  ];
}

async function loadText(id) {
  const file = path.join(cacheDir, `${id}.txt`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');

  for (const url of mirrorUrls(id)) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const text = await response.text();
      fs.writeFileSync(file, text);
      await sleep(1000); // be polite to the mirror
      return text;
    } catch (error) {
      console.warn(`  fetch failed ${url}: ${error.message}`);
    }
  }
  throw new Error(`no plain-text file for #${id}`);
}

function zScorer(values) {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length) || 1;
  return (v) => (v - mean) / sd;
}

const entries = [];
for (const source of SOURCES) {
  const edition = resolveEdition(source);
  if (!edition) {
    console.warn(`SKIP not in catalog: ${source.title} / ${source.author}`);
    continue;
  }
  let raw;
  try {
    raw = await loadText(edition.id);
  } catch (error) {
    console.warn(`SKIP ${source.title} #${edition.id}: ${error.message}`);
    continue;
  }
  const body = cleanBody(raw);
  entries.push({ source, edition, body, paragraphs: proseParagraphs(body), words: countWords(body) });
  console.log(`#${edition.id} ${edition.fullTitle.slice(0, 60)} (${edition.author})`);
}

const rank = buildFrequencyRank(entries.map((e) => e.paragraphs));
for (const entry of entries) entry.metrics = measure(entry.paragraphs, rank);

// Prose levels are ranks within this shelf, cut into equal-sized bands; verse and drama use teacher-set levels.
const measured = entries.filter((e) => MEASURED_TRACKS.has(e.source.track) && !e.source.level && e.metrics);
const zFk = zScorer(measured.map((e) => e.metrics.fk));
const zRare = zScorer(measured.map((e) => e.metrics.rareRatio));
const zWordLength = zScorer(measured.map((e) => e.metrics.wordLength));
const zLength = zScorer(measured.map((e) => Math.log10(e.words)));
for (const e of measured) {
  e.score =
    WEIGHTS.fk * zFk(e.metrics.fk) +
    WEIGHTS.rare * zRare(e.metrics.rareRatio) +
    WEIGHTS.wordLength * zWordLength(e.metrics.wordLength) +
    WEIGHTS.length * zLength(Math.log10(e.words));
}
[...measured]
  .sort((a, b) => a.score - b.score)
  .forEach((e, i, all) => {
    e.level = Math.min(LEVEL_COUNT, Math.floor((i * LEVEL_COUNT) / all.length) + 1);
    const floor = LENGTH_FLOORS.find(([minWords]) => e.words >= minWords);
    if (floor) e.level = Math.max(e.level, floor[1]);
  });

for (const entry of entries) {
  if (entry.source.level) entry.level = entry.source.level;
  if (!entry.level) {
    console.warn(`WARN no level for ${entry.source.title}; defaulting to 3`);
    entry.level = 3;
  }
}

const books = entries.map(({ source, edition, body, paragraphs, words, metrics, level }) => {
  let quote = source.quote;
  if (quote && !containsPassage(body, quote)) {
    console.warn(`WARN quote not found in #${edition.id} ${source.title}: "${quote}"`);
    quote = undefined;
  }
  const excerpts =
    source.track === 'poetry' ? pickStanzas(body) : source.track === 'drama' ? [] : pickSentences(paragraphs, rank);

  return {
    id: edition.id,
    title: source.title,
    author: edition.author,
    track: source.track,
    level,
    copy: Boolean(source.copy),
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    fk: metrics ? Math.round(metrics.fk * 10) / 10 : null,
    rare: metrics ? Math.round(metrics.rareRatio * 1000) / 1000 : null,
    downloads: downloads[edition.id] ?? 0,
    reason: source.reason,
    ...(quote ? { quote } : {}),
    excerpts,
  };
});
books.sort((a, b) => a.level - b.level || b.downloads - a.downloads);

const target = path.join(root, 'src', 'data', 'pool.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(
  target,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString().slice(0, 10),
      wordsPerMinute: WORDS_PER_MINUTE,
      method:
        'Prose levels rank books within this shelf by Flesch-Kincaid grade, share of uncommon words (outside the shelf top 3000), average word length and length; poetry and drama levels are set by hand.',
      books,
    },
    null,
    1,
  ),
);

console.log(`\npool: ${books.length} books -> ${path.relative(root, target)}`);
for (let level = 1; level <= LEVEL_COUNT; level++) {
  const inLevel = books.filter((b) => b.level === level);
  console.log(
    `L${level} (${inLevel.length}): ` +
      inLevel.map((b) => `${b.title}${b.fk !== null ? ` [fk ${b.fk}, rare ${b.rare}, ${b.words}w]` : ' [set]'}`).join(' | '),
  );
}
console.log(`copy shelf: ${books.filter((b) => b.copy).length}, with excerpts: ${books.filter((b) => b.excerpts.length).length}`);
