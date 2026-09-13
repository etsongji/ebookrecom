export type LevelKey = 'beginner' | 'intermediate' | 'advanced' | 'transcription';

export interface LevelInfo {
  label: string;
  // Position on the pencil meter; null for tracks that are not a difficulty step.
  step: number | null;
}

export const LEVELS: Record<LevelKey, LevelInfo> = {
  beginner: { label: '초급', step: 1 },
  intermediate: { label: '중급', step: 2 },
  advanced: { label: '고급', step: 3 },
  transcription: { label: '필사용', step: null },
};

export const LEVEL_MAX = 3;

export function levelOf(key?: string | null): LevelInfo | null {
  if (!key || !(key in LEVELS)) return null;
  return LEVELS[key as LevelKey];
}
