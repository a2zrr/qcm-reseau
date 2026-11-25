import { Fragment } from 'react';
import { parseBold, toLines } from '../lib/richText';

/** Renders **bold** and line breaks as React elements (never innerHTML). */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {toLines(text).map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {parseBold(line).map((seg, si) =>
            seg.bold ? <strong key={si}>{seg.text}</strong> : <Fragment key={si}>{seg.text}</Fragment>,
          )}
        </Fragment>
      ))}
    </>
  );
}
