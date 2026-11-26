import data2021 from '../data/questions.json';
import data2019 from '../data/questions-2019.json';
import type { Question, QuestionsFile } from '../types';

export type QuizId = '2021' | '2019';

export const PAGE_SIZE = 5;

export interface QuizDef {
  id: QuizId;
  /** Name shown on the home screen. */
  label: string;
  /**
   * localStorage key of this quiz's attempt. The 2021 key predates the quiz list and must
   * never change: people may be in the middle of that quiz on the live site.
   */
  storageKey: string;
  file: QuestionsFile;
  questions: Question[];
  pages: Question[][];
  /** Question id -> 0-based page index. */
  pageOf: Map<number, number>;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function makeQuiz(id: QuizId, label: string, storageKey: string, file: QuestionsFile): QuizDef {
  const pages = chunk(file.questions, PAGE_SIZE);
  const pageOf = new Map<number, number>();
  pages.forEach((pageQs, p) => pageQs.forEach((q) => pageOf.set(q.id, p)));
  return { id, label, storageKey, file, questions: file.questions, pages, pageOf };
}

export const QUIZZES: QuizDef[] = [
  makeQuiz('2021', 'QCM Réseau 2021', 'qcm-reseau:attempt', data2021 as unknown as QuestionsFile),
  makeQuiz('2019', 'QCM Réseau 2019', 'qcm-reseau:attempt-2019', data2019 as unknown as QuestionsFile),
];

export function getQuiz(id: QuizId): QuizDef {
  const quiz = QUIZZES.find((q) => q.id === id);
  if (!quiz) throw new Error(`Unknown quiz: ${id}`);
  return quiz;
}
