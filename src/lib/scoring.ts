import type { Answer, OrderQuestion, Question } from '../types';

export type Status = 'correct' | 'partial' | 'incorrect';

export interface QuestionScore {
  /** Fraction of the question's points earned, in [0, 1]. */
  fraction: number;
  status: Status;
}

export interface AttemptSummary {
  points: number;
  maxPoints: number;
  grade20: number;
  percent: number;
  counts: Record<Status, number>;
  perQuestion: Record<number, QuestionScore>;
}

const EPS = 1e-9;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export function statusFromFraction(fraction: number): Status {
  if (fraction >= 1 - EPS) return 'correct';
  if (fraction <= EPS) return 'incorrect';
  return 'partial';
}

/** The right order as item indexes (`correct` may hold indexes or item texts). */
export function orderSolution(q: OrderQuestion): number[] {
  return q.correct.map((c) => (typeof c === 'number' ? c : q.items.indexOf(c)));
}

function computeFraction(question: Question, answer: Answer | undefined): number {
  switch (question.type) {
    case 'single': {
      if (answer?.type !== 'single') return 0;
      return question.correct.includes(answer.value) ? 1 : 0;
    }
    case 'multiple': {
      if (answer?.type !== 'multiple' || question.correct.length === 0) return 0;
      const n = question.correct.length;
      let right = 0;
      let wrong = 0;
      for (const value of new Set(answer.values)) {
        if (question.correct.includes(value)) right++;
        else wrong++;
      }
      return clamp01((right - wrong) / n);
    }
    case 'match': {
      if (answer?.type !== 'match' || question.blanks.length === 0) return 0;
      const ok = question.blanks.filter((b, i) => answer.values[i] === b.answer).length;
      return ok / question.blanks.length;
    }
    case 'order': {
      if (answer?.type !== 'order' || question.items.length === 0) return 0;
      const solution = orderSolution(question);
      const ok = answer.values.filter((value, pos) => solution[pos] === value).length;
      return ok / question.items.length;
    }
  }
}

/** Pure scoring of one question. Unanswered questions score 0. */
export function scoreQuestion(question: Question, answer: Answer | undefined): QuestionScore {
  const fraction = computeFraction(question, answer);
  return { fraction, status: statusFromFraction(fraction) };
}

/** Pure scoring of a whole attempt, converted to the grade scale. */
export function summarize(
  questions: Question[],
  answers: Record<number, Answer | undefined>,
  pointsPerQuestion: number,
  gradeScale: number,
): AttemptSummary {
  const counts: Record<Status, number> = { correct: 0, partial: 0, incorrect: 0 };
  const perQuestion: Record<number, QuestionScore> = {};
  let fractionSum = 0;

  for (const q of questions) {
    const score = scoreQuestion(q, answers[q.id]);
    perQuestion[q.id] = score;
    fractionSum += score.fraction;
    counts[score.status]++;
  }

  const points = fractionSum * pointsPerQuestion;
  const maxPoints = questions.length * pointsPerQuestion;
  return {
    points,
    maxPoints,
    grade20: maxPoints > 0 ? (points / maxPoints) * gradeScale : 0,
    percent: maxPoints > 0 ? (points / maxPoints) * 100 : 0,
    counts,
    perQuestion,
  };
}
