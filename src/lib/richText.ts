/** Splits raw text into lines, honouring real newlines and literal "\n" sequences. */
export function toLines(text: string): string[] {
  return text.replace(/\\n/g, '\n').split('\n');
}

export interface Segment {
  text: string;
  bold: boolean;
}

/** Splits one line into plain and **bold** segments. */
export function parseBold(line: string): Segment[] {
  const out: Segment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = re.lastIndex;
  }
  if (last < line.length) out.push({ text: line.slice(last), bold: false });
  return out;
}

/** Plain text version (no bold markers, single line), for aria-labels and select options. */
export function plainText(text: string): string {
  return toLines(text).join(' ').replace(/\*\*/g, '');
}
