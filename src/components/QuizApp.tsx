import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Answer, Attempt } from '../types';
import { buildPerms, withAnswer } from '../lib/attempt';
import type { QuizDef } from '../lib/quizzes';
import { clearAttempt, loadAttempt, saveAttempt } from '../lib/storage';
import { summarize } from '../lib/scoring';
import { StartScreen } from './StartScreen';
import { QuizScreen } from './QuizScreen';
import { ResultsScreen } from './ResultsScreen';
import { ReviewScreen } from './ReviewScreen';

/** Runs one quiz (start, progress, results, review). Its attempt lives under `quiz.storageKey`. */
export function QuizApp({ quiz }: { quiz: QuizDef }) {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt(quiz.storageKey));

  useEffect(() => {
    if (attempt) saveAttempt(quiz.storageKey, attempt);
  }, [attempt, quiz.storageKey]);

  const update = useCallback((fn: (a: Attempt) => Attempt) => {
    setAttempt((a) => (a ? fn(a) : a));
  }, []);

  const summary = useMemo(
    () =>
      attempt
        ? summarize(quiz.questions, attempt.answers, quiz.file.pointsPerQuestion, quiz.file.gradeScale)
        : null,
    [attempt, quiz],
  );

  const withNav = (screen: ReactNode) => (
    <>
      <nav className="quiz-nav">
        <a href="#accueil">Changer de QCM</a>
      </nav>
      {screen}
    </>
  );

  if (!attempt) {
    return withNav(
      <StartScreen
        quiz={quiz}
        onStart={(shuffle) =>
          setAttempt({
            version: 1,
            startedAt: new Date().toISOString(),
            shuffle,
            perms: buildPerms(quiz.questions, shuffle),
            answers: {},
            view: 'quiz',
            page: 0,
          })
        }
      />,
    );
  }

  if (attempt.view === 'quiz') {
    return withNav(
      <QuizScreen
        quiz={quiz}
        attempt={attempt}
        onAnswer={(id: number, answer: Answer | undefined) =>
          update((a) => ({ ...a, answers: withAnswer(a.answers, id, answer) }))
        }
        onPage={(page) => update((a) => ({ ...a, page }))}
        onSubmit={() => update((a) => ({ ...a, view: 'results' }))}
      />,
    );
  }

  if (!summary) return null;

  if (attempt.view === 'review') {
    return withNav(
      <ReviewScreen
        quiz={quiz}
        attempt={attempt}
        summary={summary}
        onBack={() => update((a) => ({ ...a, view: 'results' }))}
      />,
    );
  }

  return withNav(
    <ResultsScreen
      quiz={quiz}
      summary={summary}
      onReview={() => update((a) => ({ ...a, view: 'review' }))}
      onRestart={() => {
        clearAttempt(quiz.storageKey);
        setAttempt(null);
      }}
    />,
  );
}
