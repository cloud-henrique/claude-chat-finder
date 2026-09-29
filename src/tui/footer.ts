/**
 * The one-line key hint at the bottom of the screen.
 *
 * There are more shortcuts than fit in 80 columns, and truncating the line
 * would cut the last hint mid-word, so the hints are ranked instead: the least
 * important one is dropped until the line fits, keeping the rest in a stable
 * reading order. Ranking beats truncating because what falls off the end is a
 * decision, not an accident of ordering.
 */

interface Hint {
  text: string;
  /** Lower drops last. */
  rank: number;
}

const SEPARATOR = " · ";

/** In display order; `rank` decides what survives a narrow terminal. */
const HINTS: Hint[] = [
  { text: "↑↓ results", rank: 2 },
  { text: "PgUp/PgDn scroll", rank: 6 },
  { text: "Tab mode", rank: 7 },
  { text: "^T case", rank: 8 },
  { text: "^Y md", rank: 3 },
  { text: "^R json", rank: 4 },
  { text: "^O reveal", rank: 5 },
  { text: "^U clear", rank: 9 },
  { text: "^C quit", rank: 1 },
];

/** The hint line for a terminal `width` columns wide. */
export function footerHint(width: number): string {
  let kept = HINTS;

  while (kept.length > 1 && join(kept).length > width) {
    const droppable = kept.reduce((worst, hint) =>
      hint.rank > worst.rank ? hint : worst,
    );
    kept = kept.filter((hint) => hint !== droppable);
  }

  return join(kept);
}

function join(hints: Hint[]): string {
  return hints.map((hint) => hint.text).join(SEPARATOR);
}
