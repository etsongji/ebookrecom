// Storytel has no public API, so we link to its Korean store search instead of checking availability.
export function storytelSearchUrl(title: string): string {
  return `https://www.storytel.com/kr/search?query=${encodeURIComponent(title)}`;
}
