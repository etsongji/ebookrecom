// Text cleaning, readability metrics and passage picking for Project Gutenberg plain-text files.

export const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
export const RARE_RANK = 3000;

const ABBREVIATIONS = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Capt|Col|Gen|Lieut|Rev|Prof|Mt|No|vs|etc)\./g;
const DOT_PLACEHOLDER = '․';

// Older releases end with "End of the Project Gutenberg EBook of ..." or run straight into the license.
const END_MARKERS = [
  /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG/i,
  /End of (?:the )?Project Gutenberg(?:'s|’s)?\s/i,
  /\*\*\*\s*START:? FULL LICENSE/i,
];

export function cleanBody(raw) {
  const text = raw.replace(/\r\n?/g, '\n');
  // Modern files open with "*** START OF ..."; pre-2000s etexts put the license first and close it
  // with "*END*THE SMALL PRINT! ... *END*".
  const start = text.search(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG|\*END\*\s*THE SMALL PRINT/i);
  const from = start >= 0 ? text.indexOf('\n', start) + 1 : 0;
  const rest = text.slice(from);
  const ends = END_MARKERS.map((marker) => rest.search(marker)).filter((i) => i > 0);
  return rest
    .slice(0, ends.length ? Math.min(...ends) : undefined)
    .replace(/\[(?:Illustration|Transcriber|Footnote|Sidenote|Pg|Page)[^\]]*\]/gi, ' ')
    .replace(/_/g, '');
}

export function countWords(text) {
  return (text.match(WORD) ?? []).length;
}

// Paragraphs that read like running prose: drops title pages, headings, tables of contents and verse.
export function proseParagraphs(body) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => {
      const words = p.match(WORD) ?? [];
      if (words.length < 8) return false;
      const letters = p.replace(/[^A-Za-z]/g, '').length;
      const upper = p.replace(/[^A-Z]/g, '').length;
      if (!letters || upper / letters > 0.5) return false;
      if (!/[.!?]["'’”)]*$/.test(p)) return false;
      return !/produced by|proofread|www\.|https?:|e-?text|transcriber|copyright/i.test(p);
    });
}

function protect(text) {
  return text.replace(ABBREVIATIONS, `$1${DOT_PLACEHOLDER}`);
}

function restore(text) {
  return text.replaceAll(DOT_PLACEHOLDER, '.');
}

function splitSentences(text) {
  return text.split(/(?<=[.!?]["'’”)]*)\s+(?=["'‘“(]?[A-Z])/);
}

function syllableCount(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

const wordKey = (w) => w.toLowerCase().replace(/’/g, "'");

// Rank lowercase words by their average share across books, so one long book cannot dominate.
export function buildFrequencyRank(paragraphSets) {
  const share = new Map();
  for (const paragraphs of paragraphSets) {
    const counts = new Map();
    let total = 0;
    for (const p of paragraphs) {
      for (const w of p.match(WORD) ?? []) {
        if (!/^[a-z]/.test(w)) continue;
        const key = wordKey(w);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        total++;
      }
    }
    for (const [key, n] of counts) share.set(key, (share.get(key) ?? 0) + n / total);
  }
  const ranked = [...share.entries()].sort((a, b) => b[1] - a[1]);
  return new Map(ranked.map(([key], i) => [key, i + 1]));
}

const isRare = (rank, w) => (rank.get(wordKey(w)) ?? Infinity) > RARE_RANK;

export function measure(paragraphs, rank) {
  let words = 0;
  let sentences = 0;
  let syllables = 0;
  let letters = 0;
  let lower = 0;
  let rare = 0;

  for (const p of paragraphs) {
    const text = protect(p);
    sentences += splitSentences(text).length;
    for (const w of text.match(WORD) ?? []) {
      words++;
      syllables += syllableCount(w);
      letters += w.length;
      if (/^[a-z]/.test(w)) {
        lower++;
        if (isRare(rank, w)) rare++;
      }
    }
  }
  if (!words || !sentences) return null;
  return {
    fk: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59,
    wordLength: letters / words,
    rareRatio: lower ? rare / lower : 0,
  };
}

function spreadPicks(candidates, from, to, count) {
  const picks = [];
  for (let part = 0; part < count; part++) {
    const lo = from + ((to - from) * part) / count;
    const hi = from + ((to - from) * (part + 1)) / count;
    const best = candidates.filter((c) => c.index >= lo && c.index < hi).sort((a, b) => b.score - a.score)[0];
    if (best) picks.push(best.text);
  }
  return picks;
}

// Self-contained narrative sentences of copyable length, spread across the book.
export function pickSentences(paragraphs, rank, count = 3) {
  const start = Math.floor(paragraphs.length * 0.03);
  const candidates = [];

  paragraphs.forEach((p, index) => {
    if (index < start) return;
    for (const piece of splitSentences(protect(p))) {
      const sentence = restore(piece).trim();
      const words = sentence.match(WORD) ?? [];
      if (words.length < 12 || words.length > 30) continue;
      if (!/^[A-Z]/.test(sentence) || !/[.!?]$/.test(sentence)) continue;
      // Skip dialogue, citations and lists; apostrophes inside words are fine.
      if (/["“”‘’'\d[\]()]/.test(sentence.replace(/([A-Za-z])['’]([A-Za-z])/g, '$1$2'))) continue;
      const inner = words.slice(1);
      if (inner.filter((w) => /^[A-Z]/.test(w)).length > 1) continue;
      const rareShare = inner.filter((w) => /^[a-z]/.test(w) && isRare(rank, w)).length / inner.length;
      if (rareShare > 0.15) continue;
      candidates.push({ text: sentence, index, score: -Math.abs(words.length - 20) - rareShare * 40 });
    }
  });

  return spreadPicks(candidates, start, paragraphs.length, count);
}

// Opening lines of stanzas, keeping the original line breaks.
export function pickStanzas(body, count = 3) {
  const blocks = body.split(/\n\s*\n/).map((b) =>
    b
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
  const start = Math.floor(blocks.length * 0.05);
  const candidates = [];

  blocks.forEach((lines, index) => {
    if (index < start || lines.length < 2 || lines.length > 8) return;
    const verseLike = lines.every((line) => {
      const n = (line.match(WORD) ?? []).length;
      return n >= 2 && n <= 12 && !/[\d[\]]/.test(line) && /[a-z]/.test(line);
    });
    if (!verseLike) return;
    const excerpt = lines.slice(0, 4);
    candidates.push({ text: excerpt.join('\n'), index, score: excerpt.length });
  });

  return spreadPicks(candidates, start, blocks.length, count);
}

const passageKey = (text) =>
  text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z']+/g, ' ')
    .trim();

export function containsPassage(body, passage) {
  return passageKey(body).includes(passageKey(passage));
}
