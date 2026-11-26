import { useEffect, useState } from 'react';
import { QUIZZES, getQuiz, type QuizId } from './lib/quizzes';
import { loadAttempt } from './lib/storage';
import { HomeScreen } from './components/HomeScreen';
import { QuizApp } from './components/QuizApp';

type Route = 'home' | QuizId;

/** Routes live in the hash (#accueil, #2021, #2019): no new URL paths, so `/` is unchanged. */
function routeFromHash(hash: string): Route | null {
  if (hash === '#accueil') return 'home';
  const quiz = QUIZZES.find((q) => hash === `#${q.id}`);
  return quiz ? quiz.id : null;
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  // With no hash, a 2021 attempt in progress (or submitted) opens straight away, as before.
  // Decided once at load so that the quiz does not disappear mid-session.
  const [initial] = useState<Route>(() => (loadAttempt(getQuiz('2021').storageKey) ? '2021' : 'home'));

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const route = routeFromHash(hash) ?? initial;
  if (route === 'home') return <HomeScreen />;
  return <QuizApp key={route} quiz={getQuiz(route)} />;
}
