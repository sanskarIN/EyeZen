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

/** Escape untrusted registry-returned text before adding it to a Markdown table. */
function safeCell(value) {
  return String(value).slice(0, 180).replace(/&/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\r?\n|\r/g, " ").replace(/\|/g, "\\|");
}

/** Preserve package-level evidence alongside severity counts in CI summaries. */
export function npmVulnerabilityRows(report, scope) {
  const counts = npmVulnerabilityCounts(report, scope);
  const vulnerabilities = report?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== "object" || Array.isArray(vulnerabilities)) {
    throw new Error("Missing vulnerability package details in " + scope + " npm audit report.");
  }
  const entries = Object.entries(vulnerabilities);
  if (Object.values(counts).some(count => count > 0) && entries.length === 0) {
    throw new Error("Nonzero advisory counts without package details in " + scope + " report.");
  }
  return entries.map(([name, detail]) => {
    if (!detail || typeof detail !== "object" || !LEVELS.includes(detail.severity)) {
      throw new Error("Invalid vulnerability package detail in " + scope + " report.");
    }
    const dependency = detail.isDirect === true ? "Direct" :
      detail.isDirect === false ? "Transitive" : "Unknown";
    const fix = detail.fixAvailable === false ? "Not offered by npm" :
      detail.fixAvailable === true ? "Offered by npm" :
      detail.fixAvailable && typeof detail.fixAvailable === "object" &&
        typeof detail.fixAvailable.name === "string" &&
        typeof detail.fixAvailable.version === "string" ?
        "Update " + detail.fixAvailable.name + "@" + detail.fixAvailable.version +
        (detail.fixAvailable.isSemVerMajor === true ? " (major)" : "") : "Not specified";
    return { name, severity: detail.severity, dependency, fix };
  }).sort((a, b) => LEVELS.indexOf(a.severity) - LEVELS.indexOf(b.severity) ||
    a.name.localeCompare(b.name, "en"));
}

function packageTable(scope, entries) {
  if (!entries.length) return ["", "**" + scope + ":** No affected packages reported."];
  return [
    "",
    "**" + scope + "**",
    "",
    "| Package | Severity | Dependency | npm remediation |",
    "| --- | --- | --- | --- |",
    ...entries.map(entry => "| " + [
      entry.name, entry.severity, entry.dependency, entry.fix,
    ].map(safeCell).join(" | ") + " |"),
  ];
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
    ...packageTable("All-dependency affected packages", npmVulnerabilityRows(allReport, "all-dependency")),
    ...packageTable("Production-only affected packages", npmVulnerabilityRows(productionReport, "production-only")),
    "",
    "High/critical advisories fail the corresponding npm audit step. Moderate/low findings remain visible, not automatically cleared. An npm-reported fix is not proof that the update is compatible, that Dependabot can resolve it, or that affected code is reachable. Production-only results do not prove development tools are safe to process untrusted input.",
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
