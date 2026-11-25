import data from '../data/questions.json';
import type { QuestionsFile } from '../types';

export const quizFile = data as unknown as QuestionsFile;
export const QUESTIONS = quizFile.questions;
export const PAGE_SIZE = 5;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export const PAGES = chunk(QUESTIONS, PAGE_SIZE);

/** Page index (0-based) that contains question `id`. */
export function pageOfQuestion(id: number): number {
  return Math.floor((id - 1) / PAGE_SIZE);
}
