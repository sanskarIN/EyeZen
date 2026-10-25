/**
 * Remaining pause time uses a deadline, not the number of timer callbacks.
 * Background tabs and sleeping devices can delay JavaScript timers for minutes.
 */
export function secondsUntil(deadline: number, now: number): number {
  if (!Number.isFinite(deadline) || !Number.isFinite(now)) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1_000));
}
