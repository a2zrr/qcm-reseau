import { describe, expect, it } from 'vitest';
import type { Attempt, Question, QuestionsFile } from '../types';
import { makeQuiz } from './quizzes';
import { quizStatus } from './progress';

// Made-up quiz: 3 single-choice questions, correct answer is always option 0.
const file: QuestionsFile = {
  title: 'Quiz fictif',
  pointsPerQuestion: 1,
  gradeScale: 20,
  questions: [1, 2, 3].map(
    (id): Question => ({ id, type: 'single', prompt: `Fictive ${id}`, options: ['A', 'B'], correct: [0] }),
  ),
};
const quiz = makeQuiz('2019', 'Fictif', 'key-test', file);

const attempt = (over: Partial<Attempt>): Attempt => ({
  version: 1,
  startedAt: '2030-01-01T00:00:00.000Z',
  shuffle: false,
  perms: {},
  answers: {},
  view: 'quiz',
  page: 0,
  ...over,
});

describe('quizStatus', () => {
  it('is "new" when there is no attempt', () => {
    expect(quizStatus(quiz, null)).toEqual({ kind: 'new' });
  });

  it('counts answered questions while the attempt is in progress', () => {
    const status = quizStatus(
      quiz,
      attempt({ answers: { 1: { type: 'single', value: 0 }, 3: { type: 'single', value: 1 } } }),
    );
    expect(status).toEqual({ kind: 'progress', answered: 2, total: 3 });
  });

  it('gives the grade on the scale once submitted', () => {
    const status = quizStatus(
      quiz,
      attempt({ view: 'results', answers: { 1: { type: 'single', value: 0 }, 2: { type: 'single', value: 0 } } }),
    );
    // 2 correct out of 3 points-per-question 1 => 2/3 of 20.
    expect(status.kind).toBe('done');
    if (status.kind === 'done') {
      expect(status.grade20).toBeCloseTo((2 / 3) * 20, 6);
      expect(status.gradeScale).toBe(20);
    }
  });
});
