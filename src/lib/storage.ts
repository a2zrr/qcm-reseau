import type { Attempt } from '../types';

// Keys come from the quiz definitions (see quizzes.ts). Stored format: an Attempt, version 1.

export function loadAttempt(key: string): Attempt | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attempt;
    if (
      parsed &&
      parsed.version === 1 &&
      typeof parsed.answers === 'object' &&
      typeof parsed.perms === 'object' &&
      (parsed.view === 'quiz' || parsed.view === 'results' || parsed.view === 'review')
    ) {
      return parsed;
    }
  } catch {
    // Corrupt JSON or storage unavailable: start fresh.
  }
  return null;
}

export function saveAttempt(key: string, attempt: Attempt): void {
  try {
    localStorage.setItem(key, JSON.stringify(attempt));
  } catch {
    // Storage full or disabled: the quiz still works for this session.
  }
}

export function clearAttempt(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}
