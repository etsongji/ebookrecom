export interface LevelInfo {
  step: number;
  key: string;
  name: string;
  grades: string;
  note: string;
}

export const LEVELS: LevelInfo[] = [
  { step: 1, key: 'L1', name: '입문', grades: '중1–중2', note: '짧은 동화와 우화로 원서 읽기를 시작합니다.' },
  { step: 2, key: 'L2', name: '기초', grades: '중3–고1', note: '쉬운 문장으로 된 모험·성장 이야기입니다.' },
  { step: 3, key: 'L3', name: '중급', grades: '고1–고2', note: '분량이 늘고 묘사가 풍부해지는 고전입니다.' },
  { step: 4, key: 'L4', name: '상급', grades: '고2–고3', note: '긴 문장과 고급 어휘가 이어지는 명작입니다.' },
  { step: 5, key: 'L5', name: '심화', grades: '고3 이상', note: '대작과 철학서, 옛 운문에 도전하는 단계입니다.' },
];

export const LEVEL_MAX = LEVELS.length;

export function levelOf(step?: number | null): LevelInfo | null {
  return LEVELS.find((level) => level.step === step) ?? null;
}

export const TAG_LABELS: Record<string, string> = {
  children: '아동·청소년',
  classics: '고전 명작',
  poetry: '시',
  drama: '희곡',
  stories: '이야기',
};

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `약 ${Math.max(5, Math.round(minutes / 5) * 5)}분`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round((minutes - hours * 60) / 10) * 10;
  if (rest === 60) return `약 ${hours + 1}시간`;
  return rest ? `약 ${hours}시간 ${rest}분` : `약 ${hours}시간`;
}
