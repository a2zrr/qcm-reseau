import { QUIZZES } from '../lib/quizzes';
import { quizStatus, type QuizStatus } from '../lib/progress';
import { loadAttempt } from '../lib/storage';
import { fmtFixed } from '../lib/format';

function statusText(status: QuizStatus): string {
  switch (status.kind) {
    case 'new':
      return 'Pas commencé';
    case 'progress':
      return `En cours : ${status.answered} / ${status.total} répondues`;
    case 'done':
      return `Terminé · note : ${fmtFixed(status.grade20, 2)} / ${status.gradeScale}`;
  }
}

const BUTTON: Record<QuizStatus['kind'], string> = {
  new: 'Commencer',
  progress: 'Reprendre',
  done: 'Revoir',
};

export function HomeScreen() {
  return (
    <main className="screen home">
      <h1 className="screen-title">QCM Réseau</h1>
      <p className="muted">
        Choisissez un QCM. Chaque QCM garde sa propre progression, ses résultats et ses réglages sur cet appareil.
      </p>
      <ul className="quiz-list">
        {QUIZZES.map((quiz) => {
          const status = quizStatus(quiz, loadAttempt(quiz.storageKey));
          return (
            <li key={quiz.id} className="card quiz-card">
              <h2 className="card-title">{quiz.label}</h2>
              <p>{quiz.questions.length} questions</p>
              <p className="muted small">{statusText(status)}</p>
              <a className="btn primary" href={`#${quiz.id}`}>
                {BUTTON[status.kind]}
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
