import { describe, expect, it } from "vitest";
import { matchingRule, isQuiet, validTime } from "./schedule";
import type { ScheduleRule } from "../types";

const base: ScheduleRule = { id: "night", profileId: "reading", start: "22:00", end: "07:00",
  weekdays: [0, 1, 2, 3, 4, 5, 6], enabled: true, priority: 2 };
describe("scheduling", () => {
  it("supports overnight intervals", () => {
    expect(matchingRule([base], new Date(2026, 9, 15, 2, 0))?.id).toBe("night");
    expect(matchingRule([base], new Date(2026, 9, 15, 12, 0))).toBeUndefined();
  });
  it("uses priority and then lexical ID for conflicts", () => {
    const other = { ...base, id: "a", priority: 2 };
    expect(matchingRule([base, other], new Date(2026, 9, 15, 2, 0))?.id).toBe("a");
  });
  it("checks quiet hours and rejects malformed times", () => {
    expect(isQuiet("22:00", "07:00", new Date(2026, 9, 15, 23, 0))).toBe(true);
    expect(validTime("25:99")).toBe(false);
  });
});
