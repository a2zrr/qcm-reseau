export type Numbering = 'letters' | 'numbers' | 'none';

interface BaseQuestion {
  id: number;
  prompt: string;
  note?: string;
}

export interface SingleQuestion extends BaseQuestion {
  type: 'single';
  options: string[];
  /** Indexes (0-based) of the correct option(s). */
  correct: number[];
  numbering?: Numbering;
}

export interface MultipleQuestion extends BaseQuestion {
  type: 'multiple';
  options: string[];
  /** Indexes (0-based) of the correct options. */
  correct: number[];
  numbering?: Numbering;
}

export interface MatchBlank {
  label: string;
  answer: string;
}

export interface MatchQuestion extends BaseQuestion {
  type: 'match';
  blanks: MatchBlank[];
  choices: string[];
}

export interface OrderQuestion extends BaseQuestion {
  type: 'order';
  items: string[];
  /** The right order: item indexes, or item texts. */
  correct: Array<number | string>;
}

export type Question = SingleQuestion | MultipleQuestion | MatchQuestion | OrderQuestion;

export interface QuestionsFile {
  title: string;
  source?: string;
  pointsPerQuestion: number;
  gradeScale: number;
  questions: Question[];
}

/** A user's answer to one question. A missing entry means "unanswered". Indexes are always the ORIGINAL ones. */
export type Answer =
  | { type: 'single'; value: number }
  | { type: 'multiple'; values: number[] }
  | { type: 'match'; values: (string | null)[] }
  | { type: 'order'; values: number[] };

export type View = 'quiz' | 'results' | 'review';

export interface Attempt {
  version: 1;
  startedAt: string;
  shuffle: boolean;
  /** Display order per question id: display position -> original index. */
  perms: Record<number, number[]>;
  answers: Record<number, Answer>;
  view: View;
  page: number;
}
