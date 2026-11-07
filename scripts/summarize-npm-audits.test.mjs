import { describe, expect, it } from "vitest";
import { npmVulnerabilityCounts, summarizeNpmAudits } from "./summarize-npm-audits.mjs";

const report = (counts = {}) => ({
  metadata: { vulnerabilities: {
    critical: 0, high: 0, moderate: 0, low: 0, info: 0, ...counts,
  } },
});

describe("npm security audit reporting", () => {
  it("distinguishes development-tool findings from shipped dependencies", () => {
    const summary = summarizeNpmAudits(report({ moderate: 2 }), report());
    expect(summary).toContain("| All dependencies (including development tools) | 0 | 0 | 2 | 0 | 0 |");
    expect(summary).toContain("| Production dependencies only | 0 | 0 | 0 | 0 | 0 |");
    expect(summary).toContain("Moderate/low findings remain visible");
  });

  it("reports high and critical advisories in either dependency scope", () => {
    const summary = summarizeNpmAudits(report({ high: 2, critical: 1 }), report({ high: 1 }));
    expect(summary).toContain("| All dependencies (including development tools) | 1 | 2 | 0 | 0 | 0 |");
    expect(summary).toContain("| Production dependencies only | 0 | 1 | 0 | 0 | 0 |");
  });

  it("never turns missing or malformed results into reassuring zeroes", () => {
    expect(() => npmVulnerabilityCounts({}, "all-dependency")).toThrow(/Missing vulnerability metadata/);
    expect(() => summarizeNpmAudits(report(), { error: "registry unreachable" })).toThrow(/Missing vulnerability metadata/);
    expect(() => npmVulnerabilityCounts(report({ moderate: -1 }), "all-dependency")).toThrow(/Invalid moderate/);
    expect(() => npmVulnerabilityCounts(report({ low: "0" }), "all-dependency")).toThrow(/Invalid low/);
    const incomplete = { metadata: { vulnerabilities: { moderate: 0 } } };
    expect(() => summarizeNpmAudits(incomplete, report())).toThrow(/Invalid critical/);
  });
});
