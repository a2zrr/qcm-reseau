import { useCallback, useMemo, useState } from 'react';
import type { Answer, Attempt, MatchQuestion, MultipleQuestion, OrderQuestion, Question, SingleQuestion } from '../types';
import type { AttemptSummary, QuestionScore, Status } from '../lib/scoring';
import { orderSolution } from '../lib/scoring';
import { displayCount, identity } from '../lib/attempt';
import { fmtNumber, markerFor } from '../lib/format';
import { PAGE_SIZE, chunk, type QuizDef } from '../lib/quizzes';
import { PageIndicator, SwipeArea } from './Pager';
import { usePageKeys } from '../hooks/usePageKeys';
import { RichText } from './RichText';

const STATUS_LABEL: Record<Status, string> = {
  correct: 'Correct',
  partial: 'Partiellement correct',
  incorrect: 'Incorrect',
};

interface ReviewScreenProps {
  quiz: QuizDef;
  attempt: Attempt;
  summary: AttemptSummary;
  onBack: () => void;
}

export function ReviewScreen({ quiz, attempt, summary, onBack }: ReviewScreenProps) {
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [page, setPage] = useState(0);

  const list = useMemo(
    () => (onlyErrors ? quiz.questions.filter((q) => summary.perQuestion[q.id].status !== 'correct') : quiz.questions),
    [onlyErrors, quiz, summary],
  );
  const pages = useMemo(() => chunk(list, PAGE_SIZE), [list]);
  const pageCount = pages.length;
  const current = Math.min(page, Math.max(pageCount - 1, 0));

  const goPage = useCallback(
    (p: number) => setPage(Math.min(Math.max(p, 0), Math.max(pageCount - 1, 0))),
    [pageCount],
  );
  usePageKeys(current, pageCount, goPage, true);

  const pageContents = pages.map((pageQs) => (
    <div className="page-inner" key={pageQs[0].id}>
      {pageQs.map((q) => (
        <ReviewCard
          key={q.id}
          question={q}
          perm={attempt.perms[q.id] ?? identity(displayCount(q))}
          answer={attempt.answers[q.id]}
          score={summary.perQuestion[q.id]}
          pointsPerQuestion={quiz.file.pointsPerQuestion}
        />
      ))}
    </div>
  ));

  return (
    <div className="review">
      <header className="quiz-header">
        <div className="review-top">
          <h1 className="screen-title">Revoir mes réponses</h1>
          <button type="button" className="btn secondary small-btn" onClick={onBack}>
            Retour aux résultats
          </button>
        </div>
        <label className="switch-row compact">
          <input
            type="checkbox"
            role="switch"
            checked={onlyErrors}
            onChange={(e) => {
              setOnlyErrors(e.target.checked);
              setPage(0);
            }}
          />
          <span>Seulement mes erreurs</span>
        </label>
        <p className="progress-text">
          {list.length} question{list.length > 1 ? 's' : ''} affichée{list.length > 1 ? 's' : ''}
        </p>
        {pageCount > 0 ? (
          <PageIndicator count={pageCount} current={current} onGo={goPage} />
        ) : (
          <p className="muted">Aucune erreur à revoir : toutes vos réponses sont correctes.</p>
        )}
      </header>

      {pageCount > 0 && (
        <>
          <SwipeArea page={current} pages={pageContents} onSwipe={goPage} />
          <footer className="bottom-bar">
            <button type="button" className="btn secondary" disabled={current === 0} onClick={() => goPage(current - 1)}>
              Précédent
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={current === pageCount - 1}
              onClick={() => goPage(current + 1)}
            >
              Suivant
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

interface ReviewCardProps {
  question: Question;
  perm: number[];
  answer: Answer | undefined;
  score: QuestionScore;
  pointsPerQuestion: number;
}

function ReviewCard({ question, perm, answer, score, pointsPerQuestion }: ReviewCardProps) {
  const pts = fmtNumber(score.fraction * pointsPerQuestion);
  return (
    <article className={`card review-card status-${score.status}`} aria-labelledby={`rv-${question.id}`}>
      <header className="review-head">
        <h2 id={`rv-${question.id}`} className="card-title">
          Question {question.id}
        </h2>
        <span className={`badge badge-${score.status}`}>{STATUS_LABEL[score.status]}</span>
        <span className="points">
          {pts} / {pointsPerQuestion} pt
        </span>
      </header>
      <p className="prompt">
        <RichText text={question.prompt} />
      </p>

      {!answer && <p className="unanswered-note">Sans réponse</p>}

      {(question.type === 'single' || question.type === 'multiple') && (
        <OptionsReview q={question} perm={perm} answer={answer} />
      )}
      {question.type === 'match' && <MatchReview q={question} answer={answer} />}
      {question.type === 'order' && <OrderReview q={question} perm={perm} answer={answer} />}

      {question.note && (
        <p className="note">
          <strong>Remarque :</strong> <RichText text={question.note} />
        </p>
      )}
    </article>
  );
}

function OptionsReview({ q, perm, answer }: { q: SingleQuestion | MultipleQuestion; perm: number[]; answer: Answer | undefined }) {
  const chosen = new Set<number>(
    answer?.type === 'single' ? [answer.value] : answer?.type === 'multiple' ? answer.values : [],
  );
  const correct = new Set<number>(q.correct);

  return (
    <ul className="rv-options">
      {perm.map((orig, pos) => {
        const isCorrect = correct.has(orig);
        const isChosen = chosen.has(orig);
        const cls = [
          'rv-opt',
          isCorrect ? 'is-correct' : '',
          isChosen && !isCorrect ? 'is-wrong' : '',
          isCorrect && !isChosen ? 'is-missed' : '',
        ].join(' ');
        const tags: string[] = [];
        if (isCorrect) tags.push('Bonne réponse');
        if (isChosen) tags.push(isCorrect ? 'Votre choix' : 'Votre choix (erreur)');
        if (isCorrect && !isChosen) tags.push('Non cochée');
        const marker = markerFor(q.numbering, pos);
        return (
          <li key={orig} className={cls}>
            {marker && <span className="marker">{marker}</span>}
            <span className="rv-text">
              <RichText text={q.options[orig]} />
            </span>
            <span className="tags">
              {tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function MatchReview({ q, answer }: { q: MatchQuestion; answer: Answer | undefined }) {
  const values = answer?.type === 'match' ? answer.values : [];
  return (
    <ul className="rv-blanks">
      {q.blanks.map((blank, i) => {
        const mine = values[i] ?? null;
        const ok = mine === blank.answer;
        return (
          <li key={i} className={`rv-blank ${ok ? 'is-correct' : 'is-wrong'}`}>
            <div className="rv-label">
              <RichText text={blank.label} />
            </div>
            <div className="rv-pair">
              <div className="rv-cell">
                <span className="tag">Votre réponse</span>
                <span>{mine ?? 'Sans réponse'}</span>
              </div>
              {!ok && (
                <div className="rv-cell is-correct">
                  <span className="tag">Bonne réponse</span>
                  <span>
                    <RichText text={blank.answer} />
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function OrderReview({ q, perm, answer }: { q: OrderQuestion; perm: number[]; answer: Answer | undefined }) {
  const mine = answer?.type === 'order' ? answer.values : perm;
  const solution = orderSolution(q);
  return (
    <ol className="rv-order">
      {solution.map((correctIdx, pos) => {
        const myIdx = mine[pos];
        const ok = myIdx === correctIdx;
        return (
          <li key={pos} className="rv-pair-row">
            <span className="pos" aria-hidden="true">
              {pos + 1}
            </span>
            <div className={`rv-cell ${ok ? 'is-correct' : 'is-wrong'}`}>
              <span className="tag">Votre ordre</span>
              <span>
                <RichText text={q.items[myIdx]} />
              </span>
            </div>
            {!ok && (
              <div className="rv-cell is-correct">
                <span className="tag">Bonne réponse</span>
                <span>
                  <RichText text={q.items[correctIdx]} />
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
