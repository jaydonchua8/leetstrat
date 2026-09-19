import { Fragment, type ReactNode } from 'react';

/**
 * Renders the small subset of markdown the seed uses: paragraphs separated
 * by blank lines, "- " bullet lists, and `inline code`. Deliberately not a
 * markdown library — the statements are ours, so the format is fixed.
 */
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function Statement({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="statement">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const bullets = lines.filter((l) => l.startsWith('- '));
        if (bullets.length === lines.length) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        // A heading-ish line ("Constraints:") followed by bullets.
        const lead = lines.filter((l) => !l.startsWith('- '));
        return (
          <Fragment key={i}>
            <p>{inline(lead.join(' '))}</p>
            {bullets.length > 0 && (
              <ul>
                {bullets.map((l, j) => (
                  <li key={j}>{inline(l.slice(2))}</li>
                ))}
              </ul>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
