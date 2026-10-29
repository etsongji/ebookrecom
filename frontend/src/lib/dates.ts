// Date helpers kept free of pool.json so client components can import them
// without pulling the whole shelf into the browser bundle.

// Recommendations and streaks turn over at midnight in Korea, not UTC.
export function todayInKorea(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isIsoDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Shifts an ISO date by whole days without tripping over time zones.
export function shiftIsoDate(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}
