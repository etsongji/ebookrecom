// Builds src/data/catalog.json, the classroom-safe English catalog searched by /api/books.
// Usage: node scripts/build-catalog.mjs <pg_catalog.csv> <downloads.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TAG_SHELVES, isClassroomSafe, loadEnglishTexts, tagMask } from './lib/catalog.mjs';

const [csvPath, downloadsPath] = process.argv.slice(2);
if (!csvPath || !downloadsPath) {
  console.error('Usage: node scripts/build-catalog.mjs <pg_catalog.csv> <downloads.json>');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const downloads = JSON.parse(fs.readFileSync(downloadsPath, 'utf8'));
const english = loadEnglishTexts(csvPath);

const books = english
  .map((book) => ({ book, mask: tagMask(book) }))
  .filter(({ book, mask }) => mask !== 0 && isClassroomSafe(book))
  .map(({ book, mask }) => [book.id, book.title, book.author, downloads[book.id] ?? 0, mask])
  .sort((a, b) => b[3] - a[3] || a[0] - b[0]);

const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'Project Gutenberg pg_catalog.csv + RDF download counts',
  tags: TAG_SHELVES.map(([key]) => key),
  books,
};

const target = path.join(root, 'src', 'data', 'catalog.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out));

const withDownloads = books.filter((b) => b[3] > 0).length;
console.log(
  `catalog: ${books.length} of ${english.length} English texts, ${withDownloads} with download counts, ` +
    `${(fs.statSync(target).size / 1024).toFixed(0)} KB -> ${path.relative(root, target)}`,
);
