import { describe, expect, it } from "vitest";
import { secondsUntil } from "./pause";

describe("optional pause countdown", () => {
  const started = Date.UTC(2026, 9, 25, 12, 0, 0);
  const deadline = started + 30_000;

  it("uses real elapsed time instead of counting timer callbacks", () => {
    expect(secondsUntil(deadline, started)).toBe(30);
    expect(secondsUntil(deadline, started + 10_000)).toBe(20);
    // No callback was delivered for twenty more seconds.
    expect(secondsUntil(deadline, started + 29_000)).toBe(1);
    expect(secondsUntil(deadline, started + 31_000)).toBe(0);
  });

  it("rounds partial seconds up so the countdown does not finish early", () => {
    expect(secondsUntil(deadline, deadline - 1)).toBe(1);
    expect(secondsUntil(deadline, deadline - 1_001)).toBe(2);
    expect(secondsUntil(deadline, deadline)).toBe(0);
  });

  it("handles invalid clocks without displaying an infinite pause", () => {
    expect(secondsUntil(Number.NaN, started)).toBe(0);
    expect(secondsUntil(deadline, Number.POSITIVE_INFINITY)).toBe(0);
  });
});
