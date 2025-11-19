export enum AppPhase {
  SETUP = 'SETUP',
  FOCUS = 'FOCUS',
  REFLECTION = 'REFLECTION',
  INSIGHTS = 'INSIGHTS',
  HISTORY = 'HISTORY',
}

export enum SoundType {
  NONE = 'NONE',
  BROWN_NOISE = 'BROWN_NOISE',
  WHITE_NOISE = 'WHITE_NOISE',
  OCEAN = 'OCEAN',
  FOREST = 'FOREST',
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface SessionData {
  id: string;
  goal: string;
  durationSeconds: number;
  timestamp: number;
  completed: boolean;
  blockers?: string;
  aiInsight?: string;
  priority?: Priority;
}

export interface SetupFormData {
  goal: string;
  durationMinutes: number;
  soundType: SoundType;
  priority: Priority;
}

export interface DurationPreset {
  id: string;
  name: string;
  minutes: number;
  isCustom?: boolean;
}
