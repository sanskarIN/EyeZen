/**
 * Decide whether Tab needs to wrap within a modal dialog.
 *
 * A negative activeIndex means focus unexpectedly landed outside the dialog;
 * immediately re-home focus rather than allowing a keyboard escape.
 * Otherwise let native sequential Tab behavior handle intermediate controls.
 */
export function wrappedTabTarget(activeIndex: number, count: number, shiftKey: boolean): number | null {
  if (!Number.isInteger(count) || count < 1) return null;
  if (activeIndex < 0 || activeIndex >= count) return shiftKey ? count - 1 : 0;
  if (shiftKey && activeIndex === 0) return count - 1;
  if (!shiftKey && activeIndex === count - 1) return 0;
  return null;
}
