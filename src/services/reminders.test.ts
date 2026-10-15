import { describe, expect, it } from "vitest";
import { newBreaks } from "../defaults";
import { evaluateBreak } from "./reminders";

const date = (hour: number, minute: number) => new Date(2026, 9, 15, hour, minute);
describe("optional break reminders", () => {
  it("does not emit reminders before the configured interval", () => {
    const prefs = { ...newBreaks(), enabled: true };
    const before = date(11, 0);
    const soon = evaluateBreak(before.getTime(), prefs, date(11, 20), false);
    expect(soon.due).toBe(false);
    expect(soon.anchor).toBe(before.getTime());
  });
  it("emits one reminder when due", () => {
    const prefs = { ...newBreaks(), enabled: true };
    const result = evaluateBreak(date(11, 0).getTime(), prefs, date(11, 25), false);
    expect(result.due).toBe(true);
    expect(result.anchor).toBe(date(11, 25).getTime());
  });
  it("resets without notification during quiet hours", () => {
    const prefs = { ...newBreaks(), enabled: true };
    const result = evaluateBreak(date(22, 0).getTime(), prefs, date(22, 30), false);
    expect(result.due).toBe(false);
    expect(result.anchor).toBe(date(22, 30).getTime());
  });
  it("does not catch up paused, disabled, or clock-rolled-back periods", () => {
    const prefs = { ...newBreaks(), enabled: true };
    expect(evaluateBreak(date(11, 0).getTime(), prefs, date(12, 0), true).due).toBe(false);
    expect(evaluateBreak(date(12, 0).getTime(), prefs, date(11, 0), false).anchor).toBe(date(11, 0).getTime());
    expect(evaluateBreak(date(11, 0).getTime(), { ...prefs, enabled: false }, date(12, 0), false).due).toBe(false);
  });
});
