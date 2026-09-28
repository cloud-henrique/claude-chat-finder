/**
 * Selection and scrolling math for the result list and the preview pane.
 * Stateless on purpose: the visible window is derived from the selection,
 * so no scroll position has to be kept in sync with the data.
 */

/** Moves a selection by `delta`, clamped to the list (no wrap-around). */
export function moveSelection(
  index: number,
  delta: number,
  length: number,
): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(0, index + delta), length - 1);
}

export interface Window {
  start: number;
  end: number;
}

/**
 * Returns the slice of a list to display so that `selected` stays visible,
 * keeping it centered where possible and flush at the list's edges.
 */
export function visibleWindow(
  selected: number,
  total: number,
  height: number,
): Window {
  const size = Math.max(0, Math.floor(height));
  if (total <= 0 || size === 0) return { start: 0, end: 0 };
  if (total <= size) return { start: 0, end: total };

  const start = Math.min(
    Math.max(0, selected - Math.floor(size / 2)),
    total - size,
  );
  return { start, end: start + size };
}

/** Clamps a scroll offset to the last full page of `total` lines. */
export function clampScroll(
  offset: number,
  total: number,
  height: number,
): number {
  const max = Math.max(0, total - Math.max(1, Math.floor(height)));
  return Math.min(Math.max(0, offset), max);
}
