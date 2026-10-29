import { shiftIsoDate } from './dates';

// Typing practice should not fail on a curly apostrophe or an en dash, so both
// the model line and what the student types are folded to plain ASCII. Every
// mapping is one character for one, which keeps the two strings the same length
// and lets them be compared position by position.
const PUNCTUATION: Record<string, string> = {
  '‘': "'",
  '’': "'",
  'ʼ': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  ' ': ' ',
};

export function canonLine(text: string): string {
  return [...text].map((ch) => PUNCTUATION[ch] ?? ch).join('');
}

export type CharMark = 'ok' | 'bad' | 'at' | 'todo';

export interface PracticeResult {
  target: string;
  marks: CharMark[];
  correct: number;
  accuracy: number;
  progress: number;
  done: boolean;
}

// Compares what was typed against the model line. Case and punctuation count,
// because copying a sentence exactly is the point of the exercise; only the
// quote style and trailing whitespace are forgiven.
export function practice(modelLine: string, typed: string): PracticeResult {
  const target = canonLine(modelLine).trim();
  const entered = canonLine(typed);
  const marks: CharMark[] = [];
  let correct = 0;

  for (let i = 0; i < target.length; i++) {
    if (i < entered.length) {
      const hit = entered[i] === target[i];
      if (hit) correct += 1;
      marks.push(hit ? 'ok' : 'bad');
    } else {
      marks.push(i === entered.length ? 'at' : 'todo');
    }
  }

  return {
    target,
    marks,
    correct,
    accuracy: entered.length === 0 ? 100 : Math.round((correct / entered.length) * 100),
    progress: target.length === 0 ? 0 : Math.min(100, Math.round((entered.length / target.length) * 100)),
    done: target.length > 0 && entered.trimEnd() === target,
  };
}

// Consecutive days up to and including today that have at least one finished line.
export function streakOf(byDate: Record<string, number>, today: string): number {
  if (!today) return 0;
  let streak = 0;
  for (let cursor = today; byDate[cursor] > 0; cursor = shiftIsoDate(cursor, -1)) streak += 1;
  return streak;
}
