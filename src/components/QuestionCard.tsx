import type {
  Answer,
  MatchQuestion,
  MultipleQuestion,
  OrderQuestion,
  Question,
  SingleQuestion,
} from '../types';
import { markerFor } from '../lib/format';
import { plainText } from '../lib/richText';
import { RichText } from './RichText';

interface QuestionCardProps {
  question: Question;
  /** Display order for this question (display position -> original index). */
  perm: number[];
  answer: Answer | undefined;
  onAnswer: (answer: Answer | undefined) => void;
}

export function QuestionCard({ question, perm, answer, onAnswer }: QuestionCardProps) {
  return (
    <article className="card" id={`q-${question.id}`} aria-labelledby={`q-${question.id}-title`}>
      <h2 id={`q-${question.id}-title`} className="card-title" tabIndex={-1}>
        Question {question.id}
      </h2>
      <p className="prompt">
        <RichText text={question.prompt} />
      </p>
      {question.type === 'single' && (
        <SingleInput q={question} perm={perm} answer={answer} onAnswer={onAnswer} />
      )}
      {question.type === 'multiple' && (
        <MultipleInput q={question} perm={perm} answer={answer} onAnswer={onAnswer} />
      )}
      {question.type === 'match' && (
        <MatchInput q={question} perm={perm} answer={answer} onAnswer={onAnswer} />
      )}
      {question.type === 'order' && (
        <OrderInput q={question} perm={perm} answer={answer} onAnswer={onAnswer} />
      )}
    </article>
  );
}

interface TypedProps<Q> {
  q: Q;
  perm: number[];
  answer: Answer | undefined;
  onAnswer: (answer: Answer | undefined) => void;
}

function SingleInput({ q, perm, answer, onAnswer }: TypedProps<SingleQuestion>) {
  const name = `q${q.id}-single`;
  return (
    <fieldset className="choices">
      <legend className="sr-only">Choisissez une réponse</legend>
      {perm.map((orig, pos) => {
        const marker = markerFor(q.numbering, pos);
        const checked = answer?.type === 'single' && answer.value === orig;
        return (
          <label key={orig} className={`option${checked ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name={name}
              checked={checked}
              onChange={() => onAnswer({ type: 'single', value: orig })}
            />
            {marker && <span className="marker">{marker}</span>}
            <span className="option-text">
              <RichText text={q.options[orig]} />
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function MultipleInput({ q, perm, answer, onAnswer }: TypedProps<MultipleQuestion>) {
  const selected = answer?.type === 'multiple' ? answer.values : [];
  const toggle = (orig: number) => {
    const next = selected.includes(orig) ? selected.filter((v) => v !== orig) : [...selected, orig];
    onAnswer(next.length > 0 ? { type: 'multiple', values: next } : undefined);
  };
  return (
    <fieldset className="choices">
      <legend className="sr-only">Choisissez une ou plusieurs réponses</legend>
      <p className="hint">Veuillez choisir au moins une réponse</p>
      {perm.map((orig, pos) => {
        const marker = markerFor(q.numbering, pos);
        const checked = selected.includes(orig);
        return (
          <label key={orig} className={`option${checked ? ' is-selected' : ''}`}>
            <input type="checkbox" checked={checked} onChange={() => toggle(orig)} />
            {marker && <span className="marker">{marker}</span>}
            <span className="option-text">
              <RichText text={q.options[orig]} />
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function MatchInput({ q, perm, answer, onAnswer }: TypedProps<MatchQuestion>) {
  const values: (string | null)[] =
    answer?.type === 'match' ? answer.values : q.blanks.map(() => null);

  const setBlank = (i: number, value: string | null) => {
    const next = [...values];
    next[i] = value;
    onAnswer(next.some((v) => v !== null) ? { type: 'match', values: next } : undefined);
  };

  return (
    <div className="blanks">
      {q.blanks.map((blank, i) => {
        const id = `q${q.id}-blank-${i}`;
        return (
          <div className="blank" key={i}>
            <label htmlFor={id} className="blank-label">
              <RichText text={blank.label} />
            </label>
            <select
              id={id}
              className="select"
              value={values[i] ?? ''}
              onChange={(e) => setBlank(i, e.target.value === '' ? null : e.target.value)}
            >
              <option value="">Choisir une réponse…</option>
              {perm.map((orig) => (
                <option key={orig} value={q.choices[orig]}>
                  {plainText(q.choices[orig])}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function OrderInput({ q, perm, answer, onAnswer }: TypedProps<OrderQuestion>) {
  const current: number[] = answer?.type === 'order' ? answer.values : perm;

  const move = (pos: number, dir: -1 | 1) => {
    const target = pos + dir;
    if (target < 0 || target >= current.length) return;
    const next = [...current];
    [next[pos], next[target]] = [next[target], next[pos]];
    onAnswer({ type: 'order', values: next });
    // Keep keyboard focus on the moved item (its DOM node moves), on an enabled button.
    requestAnimationFrame(() => {
      const item = document.querySelector<HTMLElement>(`[data-item="${q.id}-${target}"]`);
      const btn =
        item?.querySelector<HTMLButtonElement>(`button[data-dir="${dir}"]:not([disabled])`) ??
        item?.querySelector<HTMLButtonElement>('button:not([disabled])');
      btn?.focus();
    });
  };

  return (
    <>
      <p className="hint">Remettez les éléments dans le bon ordre avec les flèches.</p>
      <ol className="order-list">
        {current.map((orig, pos) => (
          <li key={orig} className="order-item" data-item={`${q.id}-${pos}`}>
            <span className="pos" aria-hidden="true">
              {pos + 1}
            </span>
            <span className="order-text">
              <RichText text={q.items[orig]} />
            </span>
            <div className="order-btns">
              <button
                type="button"
                className="icon-btn"
                data-dir="-1"
                aria-label={`Monter l'élément en position ${pos + 1}`}
                disabled={pos === 0}
                onClick={() => move(pos, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                data-dir="1"
                aria-label={`Descendre l'élément en position ${pos + 1}`}
                disabled={pos === current.length - 1}
                onClick={() => move(pos, 1)}
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
