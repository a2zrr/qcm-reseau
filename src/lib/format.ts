import type { Numbering } from '../types';

/** Marker shown before an option: "a." / "1." / null (none). Defaults to letters. */
export function markerFor(numbering: Numbering | undefined, index: number): string | null {
  if (numbering === 'none') return null;
  if (numbering === 'numbers') return `${index + 1}.`;
  return `${String.fromCharCode(97 + index)}.`;
}

/** French number, up to `maxDigits` decimals, no forced trailing zeros. */
export function fmtNumber(n: number, maxDigits = 2): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: maxDigits });
}

/** French number with exactly `digits` decimals. */
export function fmtFixed(n: number, digits: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
