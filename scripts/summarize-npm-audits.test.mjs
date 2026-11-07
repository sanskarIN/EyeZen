import { describe, expect, it } from "vitest";
import {
  npmVulnerabilityCounts, npmVulnerabilityRows, summarizeNpmAudits,
} from "./summarize-npm-audits.mjs";

const report = (counts = {}, vulnerabilities = {}) => ({
  metadata: { vulnerabilities: {
    critical: 0, high: 0, moderate: 0, low: 0, info: 0, ...counts,
  } },
  vulnerabilities,
});

const affected = (severity, fixAvailable = false, isDirect = false) => ({
  name: "sample",
  severity,
  isDirect,
  fixAvailable,
  via: [],
  effects: [],
  range: "*",
  nodes: [],
});

describe("npm security audit reporting", () => {
  it("distinguishes development-tool findings from shipped dependencies", () => {
    const summary = summarizeNpmAudits(report({ moderate: 2 }, {
      minimatch: affected("moderate"),
      "other-tool": affected("moderate"),
    }), report());
    expect(summary).toContain("| All dependencies (including development tools) | 0 | 0 | 2 | 0 | 0 |");
    expect(summary).toContain("| Production dependencies only | 0 | 0 | 0 | 0 | 0 |");
    expect(summary).toContain("| minimatch | moderate | Transitive | Not offered by npm |");
    expect(summary).toContain("**Production-only affected packages:** No affected packages reported.");
    expect(summary).toContain("Moderate/low findings remain visible");
  });

  it("reports high and critical advisories in either dependency scope", () => {
    const all = report({ high: 2, critical: 1 }, {
      "critical-one": affected("critical", true, true),
      "high-one": affected("high", { name: "parser", version: "12.0.0", isSemVerMajor: true }),
      "high-two": affected("high"),
    });
    const production = report({ high: 1 }, { "high-two": affected("high") });
    const summary = summarizeNpmAudits(all, production);
    expect(summary).toContain("| All dependencies (including development tools) | 1 | 2 | 0 | 0 | 0 |");
    expect(summary).toContain("| Production dependencies only | 0 | 1 | 0 | 0 | 0 |");
    expect(summary).toContain("| critical-one | critical | Direct | Offered by npm |");
    expect(summary).toContain("| high-one | high | Transitive | Update parser@12.0.0 (major) |");
    expect(summary.indexOf("| critical-one |")).toBeLessThan(summary.indexOf("| high-one |"));
  });

  it("escapes untrusted package and remediation text before publishing Markdown", () => {
    const summary = summarizeNpmAudits(report({ low: 1 }, {
      "malicious|package": affected("low", {
        name: "update|to<script>",
        version: "2.0.0\nunsafe",
      }),
    }), report());
    expect(summary).toContain("malicious\\|package");
    expect(summary).toContain("update\\|to&lt;script&gt;@2.0.0 unsafe");
    expect(summary).not.toContain("<script>");
  });

  it("never turns missing or malformed results into reassuring zeroes", () => {
    expect(() => npmVulnerabilityCounts({}, "all-dependency")).toThrow(/Missing vulnerability metadata/);
    expect(() => summarizeNpmAudits(report(), { error: "registry unreachable" })).toThrow(/Missing vulnerability metadata/);
    expect(() => npmVulnerabilityCounts(report({ moderate: -1 }), "all-dependency")).toThrow(/Invalid moderate/);
    expect(() => npmVulnerabilityCounts(report({ low: "0" }), "all-dependency")).toThrow(/Invalid low/);
    const incomplete = { metadata: { vulnerabilities: { moderate: 0 } }, vulnerabilities: {} };
    expect(() => summarizeNpmAudits(incomplete, report())).toThrow(/Invalid critical/);
    expect(() => npmVulnerabilityRows(report({ moderate: 1 }), "all-dependency"))
      .toThrow(/Nonzero advisory counts without package details/);
    expect(() => npmVulnerabilityRows({ ...report(), vulnerabilities: null }, "all-dependency"))
      .toThrow(/Missing vulnerability package details/);
    expect(() => npmVulnerabilityRows(report({ high: 1 }, {
      "bad-item": { severity: "unreported" },
    }), "all-dependency")).toThrow(/Invalid vulnerability package detail/);
  });
});
