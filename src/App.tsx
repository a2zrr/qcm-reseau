import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Answer, Attempt } from './types';
import { buildPerms, withAnswer } from './lib/attempt';
import { QUESTIONS, quizFile } from './lib/questions';
import { clearAttempt, loadAttempt, saveAttempt } from './lib/storage';
import { summarize } from './lib/scoring';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ReviewScreen } from './components/ReviewScreen';

export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());

  useEffect(() => {
    if (attempt) saveAttempt(attempt);
    else clearAttempt();
  }, [attempt]);

  const update = useCallback((fn: (a: Attempt) => Attempt) => {
    setAttempt((a) => (a ? fn(a) : a));
  }, []);

  const summary = useMemo(
    () =>
      attempt
        ? summarize(QUESTIONS, attempt.answers, quizFile.pointsPerQuestion, quizFile.gradeScale)
        : null,
    [attempt],
  );

  if (!attempt) {
    return (
      <StartScreen
        onStart={(shuffle) =>
          setAttempt({
            version: 1,
            startedAt: new Date().toISOString(),
            shuffle,
            perms: buildPerms(QUESTIONS, shuffle),
            answers: {},
            view: 'quiz',
            page: 0,
          })
        }
      />
    );
  }

  if (attempt.view === 'quiz') {
    return (
      <QuizScreen
        attempt={attempt}
        onAnswer={(id: number, answer: Answer | undefined) =>
          update((a) => ({ ...a, answers: withAnswer(a.answers, id, answer) }))
        }
        onPage={(page) => update((a) => ({ ...a, page }))}
        onSubmit={() => update((a) => ({ ...a, view: 'results' }))}
      />
    );
  }

  if (!summary) return null;

  if (attempt.view === 'review') {
    return (
      <ReviewScreen
        attempt={attempt}
        summary={summary}
        onBack={() => update((a) => ({ ...a, view: 'results' }))}
      />
    );
  }

  return (
    <ResultsScreen
      summary={summary}
      onReview={() => update((a) => ({ ...a, view: 'review' }))}
      onRestart={() => setAttempt(null)}
    />
  );
}
