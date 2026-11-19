import console from "node:console";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";

const count = (text, exact) => text.split(exact).length - 1;

/**
 * A narrow structural check for the one-time manual publishing workflow.
 * GitHub Actions remains the authoritative YAML/schema validator.
 */
export function checkReleaseWorkflow(source, version) {
  if (typeof source !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("Missing release workflow text or invalid version");
  }
  const expected = [
    ["workflow name", "name: Publish EyeZen v" + version, 1],
    ["workflow_dispatch only", "  workflow_dispatch:", 1],
    ["verify job", "\n  verify:\n", 1],
    ["package job", "\n  package:\n", 1],
    ["publish job", "\n  publish:\n", 1],
    ["exact commit and acceptance guard in verify/publish", "run: node scripts/check-release-authorization.mjs", 2],
    ["version gate", "run: npm run check:versions", 1],
    ["release version", 'gh release create v' + version + ' ', 1],
    ["release notes", "--notes-file docs/release-notes-v" + version + ".md", 1],
    ["unsigned MSI/DMG/DEB/RPM manifest", "run: node scripts/verify-release-assets.mjs artifacts " + version, 1],
    ["downloaded package inventory", "- uses: actions/download-artifact@v4", 1],
    ["manual publisher", "- name: Publish GitHub release only when all bundles succeed", 1],
  ];
  for (const [label, needle, quantity] of expected) {
    if (count(source, needle) !== quantity) {
      throw new Error(label + " expected " + quantity + " occurrence(s)");
    }
  }
  if (!/^on:\r?\n[ ]{2}workflow_dispatch:/m.test(source) ||
      /^\s{2}(push|pull_request|schedule):/m.test(source) ||
      !source.includes("github.ref == 'refs/heads/main'") ||
      !source.includes("github.event.inputs.confirm_release == 'PUBLISH'") ||
      !source.includes("confirm_source_sha:") ||
      !source.includes("confirm_acceptance:") ||
      !source.includes("contents: write") ||
      !source.includes("Acquire::Retries=3")) {
    throw new Error("Manual-only source, authorization or package safety guard is missing");
  }
  const declared = [...source.matchAll(/(?:EyeZen v|gh release create v|eyezen-|release-notes-v)(\d+\.\d+\.\d+)/g)]
    .map(match => match[1]);
  if (declared.length < 4 || declared.some(value => value !== version)) {
    throw new Error("Publisher references an inconsistent release version");
  }
  return true;
}

const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    const packageVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
    const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
    checkReleaseWorkflow(workflow, packageVersion);
    console.log("EyeZen v" + packageVersion + ": manual publisher structure and version gate verified");
  } catch (error) {
    console.error("::error::" + String(error));
    process.exitCode = 1;
  }
}
