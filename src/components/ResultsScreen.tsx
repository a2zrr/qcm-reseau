import { useState } from 'react';
import type { AttemptSummary } from '../lib/scoring';
import { fmtFixed, fmtNumber } from '../lib/format';
import type { QuizDef } from '../lib/quizzes';
import { Modal } from './Modal';

interface ResultsScreenProps {
  quiz: QuizDef;
  summary: AttemptSummary;
  onReview: () => void;
  onRestart: () => void;
}

export function ResultsScreen({ quiz, summary, onReview, onRestart }: ResultsScreenProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { counts } = summary;
  return (
    <main className="screen results">
      <h1 className="screen-title">Résultats</h1>

      <section className="score-card" aria-label="Score">
        <p className="score-points">
          {fmtNumber(summary.points)} <span>/ {summary.maxPoints}</span>
        </p>
        <p className="score-grade">
          Note : <strong>{fmtFixed(summary.grade20, 2)} / {quiz.file.gradeScale}</strong>
        </p>
        <p className="muted">Pourcentage : {fmtFixed(summary.percent, 1)} %</p>
      </section>

      <ul className="counts">
        <li>
          <span>Correctes</span>
          <strong>{counts.correct}</strong>
        </li>
        <li>
          <span>Partiellement correctes</span>
          <strong>{counts.partial}</strong>
        </li>
        <li>
          <span>Incorrectes</span>
          <strong>{counts.incorrect}</strong>
        </li>
      </ul>

      <div className="actions">
        <button type="button" className="btn primary big" onClick={onReview}>
          Revoir mes réponses
        </button>
        <button type="button" className="btn danger-outline big" onClick={() => setConfirmOpen(true)}>
          Recommencer
        </button>
      </div>

      {confirmOpen && (
        <Modal
          title="Recommencer le test ?"
          onClose={() => setConfirmOpen(false)}
          actions={
            <>
              <button type="button" className="btn secondary" autoFocus onClick={() => setConfirmOpen(false)}>
                Annuler
              </button>
              <button type="button" className="btn danger" onClick={onRestart}>
                Effacer et recommencer
              </button>
            </>
          }
        >
          <p>Vos réponses et vos résultats seront supprimés de cet appareil. Cette action est irréversible.</p>
        </Modal>
      )}
    </main>
  );
}
