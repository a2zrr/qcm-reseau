import { describe, expect, it } from 'vitest';
import type { Answer, MatchQuestion, MultipleQuestion, OrderQuestion, Question, SingleQuestion } from '../types';
import { orderSolution, scoreQuestion, summarize } from './scoring';

// Made-up questions only: these are fixtures, not the real quiz.
const single: SingleQuestion = {
  id: 1,
  type: 'single',
  prompt: 'Fictif',
  options: ['A', 'B', 'C'],
  correct: [1],
};

const multiple: MultipleQuestion = {
  id: 2,
  type: 'multiple',
  prompt: 'Fictif',
  options: ['W', 'X', 'Y', 'Z'],
  correct: [0, 2],
};

const match: MatchQuestion = {
  id: 3,
  type: 'match',
  prompt: 'Fictif',
  blanks: [
    { label: 'un', answer: 'alpha' },
    { label: 'deux', answer: 'beta' },
    { label: 'trois', answer: 'gamma' },
    { label: 'quatre', answer: 'delta' },
  ],
  choices: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'],
};

const order: OrderQuestion = {
  id: 4,
  type: 'order',
  prompt: 'Fictif',
  items: ['x', 'y', 'z', 'w'],
  correct: [2, 0, 1, 3],
};

const orderByText: OrderQuestion = { ...order, id: 5, correct: ['z', 'x', 'y', 'w'] };

const multi = (values: number[]): Answer => ({ type: 'multiple', values });

describe('single', () => {
  it('scores 1 for the right option and 0 otherwise', () => {
    expect(scoreQuestion(single, { type: 'single', value: 1 })).toEqual({ fraction: 1, status: 'correct' });
    expect(scoreQuestion(single, { type: 'single', value: 0 })).toEqual({ fraction: 0, status: 'incorrect' });
  });

  it('scores 0 when unanswered', () => {
    expect(scoreQuestion(single, undefined)).toEqual({ fraction: 0, status: 'incorrect' });
  });
});

describe('multiple', () => {
  it('gives 1 when all correct options and nothing else are checked', () => {
    expect(scoreQuestion(multiple, multi([0, 2])).fraction).toBe(1);
    expect(scoreQuestion(multiple, multi([2, 0])).status).toBe('correct');
  });

  it('gives +1/nCorrect per correct option checked (partial credit)', () => {
    expect(scoreQuestion(multiple, multi([0]))).toEqual({ fraction: 0.5, status: 'partial' });
  });

  it('gives −1/nCorrect per wrong option checked', () => {
    // 1 right (+0.5) and 1 wrong (−0.5) => 0
    expect(scoreQuestion(multiple, multi([0, 1]))).toEqual({ fraction: 0, status: 'incorrect' });
    // 2 right (+1) and 1 wrong (−0.5) => 0.5
    expect(scoreQuestion(multiple, multi([0, 1, 2]))).toEqual({ fraction: 0.5, status: 'partial' });
  });

  it('clamps negative totals to 0', () => {
    expect(scoreQuestion(multiple, multi([1, 3])).fraction).toBe(0);
  });

  it('ignores duplicated indexes', () => {
    expect(scoreQuestion(multiple, multi([0, 0])).fraction).toBe(0.5);
  });
});

describe('match', () => {
  it('gives correct blanks / number of blanks', () => {
    const answer: Answer = { type: 'match', values: ['alpha', 'beta', 'epsilon', null] };
    expect(scoreQuestion(match, answer)).toEqual({ fraction: 0.5, status: 'partial' });
  });

  it('is fully correct when every blank matches', () => {
    const answer: Answer = { type: 'match', values: ['alpha', 'beta', 'gamma', 'delta'] };
    expect(scoreQuestion(match, answer).status).toBe('correct');
  });
});

describe('order', () => {
  it('resolves the solution from indexes or from item texts', () => {
    expect(orderSolution(order)).toEqual([2, 0, 1, 3]);
    expect(orderSolution(orderByText)).toEqual([2, 0, 1, 3]);
  });

  it('gives items in the correct position / number of items', () => {
    // positions 0 and 1 are right (z, x); positions 2 and 3 are wrong
    const answer: Answer = { type: 'order', values: [2, 0, 3, 1] };
    expect(scoreQuestion(order, answer)).toEqual({ fraction: 0.5, status: 'partial' });
    expect(scoreQuestion(orderByText, answer).fraction).toBe(0.5);
  });

  it('is fully correct for the right order', () => {
    expect(scoreQuestion(order, { type: 'order', values: [2, 0, 1, 3] }).status).toBe('correct');
  });
});

describe('summarize', () => {
  it('totals points, grade /20 and counts', () => {
    const questions: Question[] = [single, multiple, match];
    const answers: Record<number, Answer> = {
      1: { type: 'single', value: 1 }, // 1
      2: multi([0]), // 0.5
      // 3 unanswered => 0
    };
    const s = summarize(questions, answers, 1, 20);
    expect(s.points).toBeCloseTo(1.5);
    expect(s.maxPoints).toBe(3);
    expect(s.grade20).toBeCloseTo((1.5 / 3) * 20);
    expect(s.percent).toBeCloseTo(50);
    expect(s.counts).toEqual({ correct: 1, partial: 1, incorrect: 1 });
    expect(s.perQuestion[2].status).toBe('partial');
  });

  it('scales points per question', () => {
    const s = summarize([single], { 1: { type: 'single', value: 1 } }, 2, 10);
    expect(s.points).toBe(2);
    expect(s.maxPoints).toBe(2);
    expect(s.grade20).toBe(10);
  });

  it('handles an empty quiz without dividing by zero', () => {
    const s = summarize([], {}, 1, 20);
    expect(s.grade20).toBe(0);
    expect(s.percent).toBe(0);
  });
});
