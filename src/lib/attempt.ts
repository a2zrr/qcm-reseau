import type { Answer, Question } from '../types';

export type Rng = () => number;

export function identity(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Fisher–Yates shuffle of 0..n-1. */
export function shuffledIndices(n: number, rng: Rng = Math.random): number[] {
  const a = identity(n);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Number of displayed, shuffle-able elements for a question. */
export function displayCount(q: Question): number {
  switch (q.type) {
    case 'single':
    case 'multiple':
      return q.options.length;
    case 'match':
      return q.choices.length;
    case 'order':
      return q.items.length;
  }
}

export function buildPerms(
  questions: Question[],
  shuffle: boolean,
  rng: Rng = Math.random,
): Record<number, number[]> {
  const perms: Record<number, number[]> = {};
  for (const q of questions) {
    const n = displayCount(q);
    perms[q.id] = shuffle ? shuffledIndices(n, rng) : identity(n);
  }
  return perms;
}

/** Whether a question counts as answered (used for progress and the "unanswered" list). */
export function isAnswered(q: Question, answer: Answer | undefined): boolean {
  if (!answer) return false;
  if (answer.type === 'multiple') return answer.values.length > 0;
  if (answer.type === 'match') {
    return q.type === 'match' && answer.values.length === q.blanks.length && answer.values.every((v) => v !== null);
  }
  return true;
}

/** Returns a new answers map with question `id` set (or removed when `answer` is undefined). */
export function withAnswer(
  answers: Record<number, Answer>,
  id: number,
  answer: Answer | undefined,
): Record<number, Answer> {
  const next = { ...answers };
  if (answer === undefined) delete next[id];
  else next[id] = answer;
  return next;
}
