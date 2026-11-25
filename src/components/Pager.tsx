import { useRef, type ReactNode } from 'react';

interface PageIndicatorProps {
  count: number;
  current: number;
  isDone?: (page: number) => boolean;
  onGo: (page: number) => void;
}

export function PageIndicator({ count, current, isDone, onGo }: PageIndicatorProps) {
  return (
    <nav aria-label="Pages du test">
      <ul className="pager">
        {Array.from({ length: count }, (_, i) => {
          const done = isDone?.(i) ?? false;
          return (
            <li key={i}>
              <button
                type="button"
                className={`pill${done ? ' is-done' : ''}`}
                aria-current={i === current ? 'page' : undefined}
                aria-label={`Page ${i + 1}${done ? ', questions répondues' : ''}`}
                onClick={() => onGo(i)}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface SwipeAreaProps {
  page: number;
  pages: ReactNode[];
  onSwipe: (page: number) => void;
}

const SWIPE_MIN_PX = 50;

/**
 * Horizontal slide container. `touch-action: pan-y` (CSS) keeps vertical scrolling native;
 * we only act on touch gestures that are mostly horizontal and longer than SWIPE_MIN_PX.
 */
export function SwipeArea({ page, pages, onSwipe }: SwipeAreaProps) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="swipe-viewport"
      onTouchStart={(e) => {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchCancel={() => {
        start.current = null;
      }}
      onTouchEnd={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
          onSwipe(dx < 0 ? page + 1 : page - 1);
        }
      }}
    >
      <div className="swipe-track" style={{ transform: `translateX(${-page * 100}%)` }}>
        {pages.map((content, i) => (
          <section
            key={i}
            className="swipe-page"
            aria-label={`Page ${i + 1} sur ${pages.length}`}
            aria-hidden={i !== page}
            inert={i !== page}
          >
            {content}
          </section>
        ))}
      </div>
    </div>
  );
}
