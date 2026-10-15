import type { BreakPreferences } from "../types";
import { isQuiet } from "./schedule";

/** Pure decision for the *running app*; not a background notification service. */
export function evaluateBreak(
  previousAt: number,
  preferences: BreakPreferences,
  now: Date,
  paused: boolean
): { due: boolean; anchor: number } {
  const time = now.getTime();
  if (!Number.isFinite(time)) return { due: false, anchor: previousAt };
  if (!preferences.enabled || paused || !Number.isFinite(previousAt) || previousAt > time) {
    return { due: false, anchor: time };
  }
  if (time - previousAt < preferences.intervalMinutes * 60_000) {
    return { due: false, anchor: previousAt };
  }
  // Advance when quiet to prevent a burst of stale reminders after quiet hours.
  return { due: !isQuiet(preferences.quietStart, preferences.quietEnd, now), anchor: time };
}
