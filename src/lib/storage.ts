import type { Attempt } from '../types';

const KEY = 'qcm-reseau:attempt';

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(KEY);
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

export function saveAttempt(attempt: Attempt): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(attempt));
  } catch {
    // Storage full or disabled: the quiz still works for this session.
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
