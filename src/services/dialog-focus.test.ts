import { describe, expect, it } from "vitest";
import { wrappedTabTarget } from "./dialog-focus";

describe("modal dialog keyboard navigation", () => {
  it("wraps forward Tab from the last control to the first", () => {
    expect(wrappedTabTarget(3, 4, false)).toBe(0);
    expect(wrappedTabTarget(0, 4, false)).toBeNull();
    expect(wrappedTabTarget(1, 4, false)).toBeNull();
  });
  it("wraps Shift+Tab from the first control to the last", () => {
    expect(wrappedTabTarget(0, 4, true)).toBe(3);
    expect(wrappedTabTarget(2, 4, true)).toBeNull();
  });
  it("recovers a focus target when focus is outside the modal", () => {
    expect(wrappedTabTarget(-1, 4, false)).toBe(0);
    expect(wrappedTabTarget(-1, 4, true)).toBe(3);
    expect(wrappedTabTarget(7, 4, false)).toBe(0);
  });
  it("keeps single-control dialogs keyboard-contained", () => {
    expect(wrappedTabTarget(0, 1, false)).toBe(0);
    expect(wrappedTabTarget(0, 1, true)).toBe(0);
    expect(wrappedTabTarget(0, 0, false)).toBeNull();
  });
});
