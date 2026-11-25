import { useState } from 'react';
import { QUESTIONS, quizFile } from '../lib/questions';

interface StartScreenProps {
  onStart: (shuffle: boolean) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [shuffle, setShuffle] = useState(false);
  return (
    <main className="screen start">
      <h1 className="screen-title">{quizFile.title}</h1>
      <p>{QUESTIONS.length} questions. Répondez à votre rythme : vos réponses sont enregistrées sur cet appareil.</p>
      <p className="muted">Les bonnes réponses ne sont pas affichées pendant le test. Elles le seront après l'envoi.</p>

      <label className="switch-row">
        <input type="checkbox" role="switch" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
        <span>
          Mélanger les réponses
          <span className="muted small block">Change l'ordre des propositions pour ce nouvel essai.</span>
        </span>
      </label>

      <button type="button" className="btn primary big" onClick={() => onStart(shuffle)}>
        Commencer le test
      </button>
    </main>
  );
}
