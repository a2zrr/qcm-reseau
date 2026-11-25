import { useCallback, useMemo, useRef, useState } from 'react';
import type { Answer, Attempt } from '../types';
import { isAnswered } from '../lib/attempt';
import { PAGES, QUESTIONS, pageOfQuestion, quizFile } from '../lib/questions';
import { Modal } from './Modal';
import { PageIndicator, SwipeArea } from './Pager';
import { usePageKeys } from '../hooks/usePageKeys';
import { QuestionCard } from './QuestionCard';

interface QuizScreenProps {
  attempt: Attempt;
  onAnswer: (id: number, answer: Answer | undefined) => void;
  onPage: (page: number) => void;
  onSubmit: () => void;
}

export function QuizScreen({ attempt, onAnswer, onPage, onSubmit }: QuizScreenProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pageCount = PAGES.length;
  const page = Math.min(Math.max(attempt.page, 0), pageCount - 1);

  const answeredIds = useMemo(
    () => new Set(QUESTIONS.filter((q) => isAnswered(q, attempt.answers[q.id])).map((q) => q.id)),
    [attempt.answers],
  );
  const unanswered = QUESTIONS.filter((q) => !answeredIds.has(q.id)).map((q) => q.id);
  const total = QUESTIONS.length;
  const pct = total > 0 ? (answeredIds.size / total) * 100 : 0;

  const goPage = useCallback(
    (p: number) => {
      const target = Math.min(Math.max(p, 0), pageCount - 1);
      if (target === page) return;
      onPage(target);
      // Bring the quiz header back into view if the user had scrolled down a long card.
      const header = headerRef.current;
      if (header && header.getBoundingClientRect().top < 0) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        header.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      }
    },
    [page, pageCount, onPage],
  );

  usePageKeys(page, pageCount, goPage, !confirmOpen);

  const jumpTo = (id: number) => {
    setConfirmOpen(false);
    goPage(pageOfQuestion(id));
    requestAnimationFrame(() => {
      document.getElementById(`q-${id}-title`)?.focus({ preventScroll: true });
    });
  };

  const pageContents = PAGES.map((pageQs) => (
    <div className="page-inner" key={pageQs[0].id}>
      {pageQs.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          perm={attempt.perms[q.id]}
          answer={attempt.answers[q.id]}
          onAnswer={(a) => onAnswer(q.id, a)}
        />
      ))}
    </div>
  ));

  return (
    <div className="quiz">
      <header className="quiz-header" ref={headerRef}>
        <h1 className="screen-title">{quizFile.title}</h1>
        <p className="progress-text" aria-live="polite">
          {answeredIds.size} / {total} questions répondues
        </p>
        <div
          className="progress-bar"
          role="progressbar"
          aria-label="Progression"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredIds.size}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <PageIndicator
          count={pageCount}
          current={page}
          isDone={(p) => PAGES[p].every((q) => answeredIds.has(q.id))}
          onGo={goPage}
        />
      </header>

      <SwipeArea page={page} pages={pageContents} onSwipe={goPage} />

      <footer className="bottom-bar">
        <button type="button" className="btn secondary" disabled={page === 0} onClick={() => goPage(page - 1)}>
          Précédent
        </button>
        <button type="button" className="btn primary" onClick={() => setConfirmOpen(true)}>
          Terminer le test
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={page === pageCount - 1}
          onClick={() => goPage(page + 1)}
        >
          Suivant
        </button>
      </footer>

      {confirmOpen && (
        <Modal
          title="Terminer le test ?"
          onClose={() => setConfirmOpen(false)}
          actions={
            <>
              <button type="button" className="btn secondary" autoFocus onClick={() => setConfirmOpen(false)}>
                Retour
              </button>
              <button type="button" className="btn primary" onClick={onSubmit}>
                Envoyer
              </button>
            </>
          }
        >
          {unanswered.length === 0 ? (
            <p>Toutes les questions ont une réponse.</p>
          ) : (
            <>
              <p>
                {unanswered.length === 1
                  ? 'Il reste 1 question sans réponse :'
                  : `Il reste ${unanswered.length} questions sans réponse :`}
              </p>
              <ul className="jump-list">
                {unanswered.map((id) => (
                  <li key={id}>
                    <button type="button" className="chip" onClick={() => jumpTo(id)}>
                      Question {id}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="muted">Après l'envoi, vous ne pourrez plus modifier vos réponses.</p>
        </Modal>
      )}
    </div>
  );
}
