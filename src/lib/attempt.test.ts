import { describe, expect, it } from 'vitest';
import type { Answer, Question } from '../types';
import { buildPerms, identity, isAnswered, shuffledIndices, withAnswer } from './attempt';
import { parseBold, plainText, toLines } from './richText';

// Made-up fixtures.
const questions: Question[] = [
  { id: 1, type: 'single', prompt: 'p', options: ['a', 'b', 'c'], correct: [0] },
  { id: 2, type: 'match', prompt: 'p', blanks: [{ label: 'x', answer: 'k' }, { label: 'y', answer: 'm' }], choices: ['k', 'm', 'n'] },
  { id: 3, type: 'order', prompt: 'p', items: ['a', 'b'], correct: [1, 0] },
];

const isPermutation = (arr: number[], n: number) => [...arr].sort((a, b) => a - b).join() === identity(n).join();

describe('shuffledIndices', () => {
  it('always returns a permutation', () => {
    for (let n = 0; n <= 6; n++) {
      expect(isPermutation(shuffledIndices(n), n)).toBe(true);
    }
  });

  it('is deterministic with an injected rng', () => {
    const rng = () => 0; // always picks index 0 => reverse-ish result
    expect(shuffledIndices(4, rng)).toEqual([1, 2, 3, 0]);
  });
});

describe('buildPerms', () => {
  it('uses identity order when shuffle is off', () => {
    const perms = buildPerms(questions, false);
    expect(perms[1]).toEqual([0, 1, 2]);
    expect(perms[2]).toEqual([0, 1, 2]);
    expect(perms[3]).toEqual([0, 1]);
  });

  it('keeps each question permutation valid when shuffle is on', () => {
    const perms = buildPerms(questions, true);
    expect(isPermutation(perms[1], 3)).toBe(true);
    expect(isPermutation(perms[2], 3)).toBe(true);
    expect(isPermutation(perms[3], 2)).toBe(true);
  });
});

describe('isAnswered', () => {
  const [single, match, order] = questions;

  it('treats missing or empty answers as unanswered', () => {
    expect(isAnswered(single, undefined)).toBe(false);
    expect(isAnswered(questions[0], { type: 'multiple', values: [] })).toBe(false);
  });

  it('needs every blank filled for a match question', () => {
    const partial: Answer = { type: 'match', values: ['k', null] };
    const full: Answer = { type: 'match', values: ['k', 'm'] };
    expect(isAnswered(match, partial)).toBe(false);
    expect(isAnswered(match, full)).toBe(true);
  });

  it('counts a single or order answer as answered', () => {
    expect(isAnswered(single, { type: 'single', value: 2 })).toBe(true);
    expect(isAnswered(order, { type: 'order', values: [1, 0] })).toBe(true);
  });
});

describe('withAnswer', () => {
  it('sets and removes answers without mutating the input', () => {
    const before = { 1: { type: 'single', value: 0 } as Answer };
    const set = withAnswer(before, 2, { type: 'single', value: 1 });
    expect(set).toEqual({ 1: { type: 'single', value: 0 }, 2: { type: 'single', value: 1 } });
    expect(before).toEqual({ 1: { type: 'single', value: 0 } });
    expect(withAnswer(set, 1, undefined)).toEqual({ 2: { type: 'single', value: 1 } });
  });
});

describe('rich text helpers', () => {
  it('splits bold segments', () => {
    expect(parseBold('a **b** c')).toEqual([
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ]);
  });

  it('keeps unmatched asterisks as plain text', () => {
    expect(parseBold('2 * 3 **')).toEqual([{ text: '2 * 3 **', bold: false }]);
  });

  it('handles real and literal newlines', () => {
    expect(toLines('one\ntwo')).toEqual(['one', 'two']);
    expect(toLines('one\\ntwo')).toEqual(['one', 'two']);
  });

  it('flattens text for labels', () => {
    expect(plainText('**Oui**\nnon')).toBe('Oui non');
  });
});
