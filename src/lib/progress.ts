import type { Attempt } from '../types';
import type { QuizDef } from './quizzes';
import { isAnswered } from './attempt';
import { summarize } from './scoring';

export type QuizStatus =
  | { kind: 'new' }
  | { kind: 'progress'; answered: number; total: number }
  | { kind: 'done'; grade20: number; gradeScale: number };

/** Home-screen status of one quiz, from its saved attempt (or none). */
export function quizStatus(quiz: QuizDef, attempt: Attempt | null): QuizStatus {
  if (!attempt) return { kind: 'new' };
  if (attempt.view === 'quiz') {
    const answered = quiz.questions.filter((q) => isAnswered(q, attempt.answers[q.id])).length;
    return { kind: 'progress', answered, total: quiz.questions.length };
  }
  const summary = summarize(
    quiz.questions,
    attempt.answers,
    quiz.file.pointsPerQuestion,
    quiz.file.gradeScale,
  );
  return { kind: 'done', grade20: summary.grade20, gradeScale: quiz.file.gradeScale };
}
