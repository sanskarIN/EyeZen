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
  it("treats start as inclusive and end as exclusive", () => {
    const daytime = { ...base, id: "daytime", start: "09:00", end: "17:00", weekdays: [0] };
    expect(matchingRule([daytime], new Date(2026, 9, 19, 8, 59))).toBeUndefined();
    expect(matchingRule([daytime], new Date(2026, 9, 19, 9, 0))?.id).toBe("daytime");
    expect(matchingRule([daytime], new Date(2026, 9, 19, 16, 59))?.id).toBe("daytime");
    expect(matchingRule([daytime], new Date(2026, 9, 19, 17, 0))).toBeUndefined();
  });
  it("uses the previous weekday for the after-midnight part of overnight rules", () => {
    const mondayNight = { ...base, weekdays: [0] };
    expect(matchingRule([mondayNight], new Date(2026, 9, 19, 21, 59))).toBeUndefined();
    expect(matchingRule([mondayNight], new Date(2026, 9, 19, 22, 0))?.id).toBe("night");
    expect(matchingRule([mondayNight], new Date(2026, 9, 20, 6, 59))?.id).toBe("night");
    expect(matchingRule([mondayNight], new Date(2026, 9, 20, 7, 0))).toBeUndefined();
    expect(matchingRule([mondayNight], new Date(2026, 9, 21, 2, 0))).toBeUndefined();
  });
  it("ignores disabled rules and preserves input order", () => {
    const first = { ...base, id: "z" }, second = { ...base, id: "a", enabled: false };
    const rules = [first, second];
    expect(matchingRule(rules, new Date(2026, 9, 19, 23, 0))?.id).toBe("z");
    expect(rules.map(rule => rule.id)).toEqual(["z", "a"]);
  });
  it("applies quiet hour boundaries without phantom all-day quiet time", () => {
    const monday = new Date(2026, 9, 19, 22, 0);
    expect(isQuiet("22:00", "07:00", monday)).toBe(true);
    expect(isQuiet("22:00", "07:00", new Date(2026, 9, 20, 7, 0))).toBe(false);
    expect(isQuiet("09:00", "09:00", monday)).toBe(false);
    expect(validTime("09:60")).toBe(false);
    expect(validTime("9:00")).toBe(false);
  });
});
