import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const LEVELS = ["critical", "high", "moderate", "low", "info"];

/** Read npm's machine-readable counts without converting a failed audit to zero findings. */
export function npmVulnerabilityCounts(report, scope) {
  const counts = report?.metadata?.vulnerabilities;
  if (!counts || typeof counts !== "object") {
    throw new Error(`Missing vulnerability metadata in ${scope} npm audit report.`);
  }
  return Object.fromEntries(LEVELS.map(level => {
    const count = counts[level];
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`Invalid ${level} count in ${scope} npm audit report.`);
    }
    return [level, count];
  }));
}

/** Differentiate dev tooling advisories from packages shipped to users. */
export function summarizeNpmAudits(allReport, productionReport) {
  const all = npmVulnerabilityCounts(allReport, "all-dependency");
  const production = npmVulnerabilityCounts(productionReport, "production-only");
  const row = (name, counts) => `| ${name} | ${LEVELS.map(level => counts[level]).join(" | ")} |`;
  return [
    "### npm dependency advisory results",
    "",
    "| Dependency scope | Critical | High | Moderate | Low | Info |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    row("All dependencies (including development tools)", all),
    row("Production dependencies only", production),
    "",
    "High/critical advisories fail the corresponding npm audit step. Moderate/low findings remain visible, not automatically cleared. Production-only results do not prove development tools are safe to process untrusted input.",
    "",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const all = JSON.parse(readFileSync(process.argv[2] ?? "npm-audit.json", "utf8"));
    const production = JSON.parse(readFileSync(process.argv[3] ?? "npm-production-audit.json", "utf8"));
    const summary = summarizeNpmAudits(all, production);
    if (!process.env.GITHUB_STEP_SUMMARY) {
      throw new Error("GITHUB_STEP_SUMMARY is not available.");
    }
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    process.stdout.write(summary);
  } catch (error) {
    process.stderr.write("Cannot summarize npm audit reports: " + String(error) + "\n");
    process.exitCode = 1;
  }
}
