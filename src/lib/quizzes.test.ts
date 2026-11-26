import { describe, expect, it } from 'vitest';
import type { Question, QuestionsFile } from '../types';
import { PAGE_SIZE, QUIZZES, chunk, getQuiz, makeQuiz } from './quizzes';

// Made-up questions only: the real quiz content is never used in tests.
const fake = (id: number): Question => ({
  id,
  type: 'single',
  prompt: `Question fictive ${id}`,
  options: ['A', 'B'],
  correct: [0],
});

const fakeFile = (n: number): QuestionsFile => ({
  title: 'Quiz fictif',
  pointsPerQuestion: 1,
  gradeScale: 20,
  questions: Array.from({ length: n }, (_, i) => fake(i + 1)),
});

describe('chunk', () => {
  it('splits into pages of the given size, last page may be shorter', () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 5)).toEqual([[1, 2, 3, 4, 5], [6]]);
    expect(chunk([], 5)).toEqual([]);
  });
});

describe('makeQuiz', () => {
  it('puts 5 questions per page and maps each question id to its page', () => {
    const quiz = makeQuiz('2019', 'Fictif', 'key-test', fakeFile(12));
    expect(PAGE_SIZE).toBe(5);
    expect(quiz.pages.map((p) => p.length)).toEqual([5, 5, 2]);
    expect(quiz.pageOf.get(1)).toBe(0);
    expect(quiz.pageOf.get(5)).toBe(0);
    expect(quiz.pageOf.get(6)).toBe(1);
    expect(quiz.pageOf.get(12)).toBe(2);
  });
});

describe('registered quizzes', () => {
  it('keeps the 2021 attempt key exactly as it was before the quiz list existed', () => {
    expect(getQuiz('2021').storageKey).toBe('qcm-reseau:attempt');
  });

  it('gives every quiz its own, distinct storage key', () => {
    const keys = QUIZZES.map((q) => q.storageKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('uses the stored data shape for both quizzes (questions are numbered from 1)', () => {
    for (const quiz of QUIZZES) {
      expect(quiz.questions.map((q) => q.id)).toEqual(quiz.questions.map((_, i) => i + 1));
    }
  });
});
