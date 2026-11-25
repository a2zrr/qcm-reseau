import { useEffect } from "react";

/** Keyboard page navigation with ← / →. Ignored while typing or choosing in a dropdown. */
export function usePageKeys(page: number, count: number, go: (p: number) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('input[type="text"], input:not([type]), textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      go(e.key === 'ArrowLeft' ? page - 1 : page + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, count, go, enabled]);
}
