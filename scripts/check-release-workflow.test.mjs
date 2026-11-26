import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkReleaseWorkflow } from "./check-release-workflow.mjs";

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");

describe("manual release publisher structural guard", () => {
  it("accepts the exact v1.2.2 manually gated workflow", () => {
    expect(checkReleaseWorkflow(workflow, "1.2.2")).toBe(true);
  });

  it("rejects duplicate publishing sections and incomplete original repairs", () => {
    expect(() => checkReleaseWorkflow(
      workflow + "\n      - name: Publish GitHub release only when all bundles succeed\n",
      "1.2.2"
    )).toThrow(/manual publisher/);
    expect(() => checkReleaseWorkflow(
      workflow.replace("gh release create v1.2.2", "gh release create v1.2.1"),
      "1.2.2"
    )).toThrow();
  });

  it("rejects additional automatic triggers and missing SHA/acceptance guard", () => {
    expect(() => checkReleaseWorkflow(
      workflow.replace("  workflow_dispatch:", "  push:\n    branches: [main]\n  workflow_dispatch:"),
      "1.2.2"
    )).toThrow(/manual-only/i);
    expect(() => checkReleaseWorkflow(
      workflow.replace("run: node scripts/check-release-authorization.mjs",
        "run: echo bypassed-authorization"),
      "1.2.2"
    )).toThrow(/exact commit/);
  });

  it("refuses publisher workflows without a complete remote tag-existence gate", () => {
    const tagLookup = "git ls-remote --tags --refs origin refs/tags/v1.2.2";
    expect(workflow).toContain(tagLookup);
    expect(() => checkReleaseWorkflow(workflow.replace(tagLookup, "echo skip-tag-check"), "1.2.2"))
      .toThrow(/remote tag existence/);
    expect(() => checkReleaseWorkflow(
      workflow.replace("Tag v1.2.2 already exists; refusing to publish", "Tag check skipped"),
      "1.2.2"
    )).toThrow(/pre-existing tag refusal/);
  });

  it("rejects a release version mismatch and invalid inputs", () => {
    expect(() => checkReleaseWorkflow(workflow, "1.2.3")).toThrow();
    expect(() => checkReleaseWorkflow(workflow, "v1.2.2")).toThrow();
    expect(() => checkReleaseWorkflow(null, "1.2.2")).toThrow();
  });

  it("exercises the CLI entrypoint used by CI", () => {
    const script = fileURLToPath(new URL("./check-release-workflow.mjs", import.meta.url));
    const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("publisher structure");
  });
});
