import { spawnSync } from "node:child_process";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { matchesReleaseBranch } from "./check-release-branch.mjs";

const script = fileURLToPath(new URL("./check-release-branch.mjs", import.meta.url));
const checkCli = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

describe("candidate release-branch guard", () => {
  it("accepts exact release branches with or without v and descriptive suffixes", () => {
    for (const branch of [
      "release/v1.3.0", "release/1.3.0", "release/v1.3.0-rc.1",
      "release/1.3.0-test-build", "release/v1.3.0-a_b"
    ]) {
      expect(matchesReleaseBranch(branch, "1.3.0"), branch).toBe(true);
    }
  });

  it("rejects version mismatches and unsafe or ambiguous branch names", () => {
    for (const branch of [
      "release/v1.3.1", "release/v1.3.00", "release/v1.3.0beta",
      "release/v1.3.0-", "release/v1.3.0/other", "release/v1.3.0--suffix",
      "release/v1.3.0-candidate/other", "releases/v1.3.0", "feature/release/v1.3.0"
    ]) {
      expect(matchesReleaseBranch(branch, "1.3.0"), branch).toBe(false);
    }
  });

  it("fails closed for missing, nonnumeric or malformed versions", () => {
    expect(matchesReleaseBranch("release/v1.3.0", "")).toBe(false);
    expect(matchesReleaseBranch("release/v1.3.0", "v1.3.0")).toBe(false);
    expect(matchesReleaseBranch("release/v1.3.0", "1.3.0-rc.1")).toBe(false);
    expect(matchesReleaseBranch("release/v1.3.0", "1.3")).toBe(false);
    expect(matchesReleaseBranch("", "1.3.0")).toBe(false);
  });

  it("exercises the exact CLI entrypoint used by GitHub Actions", () => {
    expect(checkCli("release/v1.3.0-rc.1", "1.3.0").status).toBe(0);
    const mismatch = checkCli("release/v1.3.1", "1.3.0");
    expect(mismatch.status).toBe(1);
    expect(mismatch.stderr).toContain("::error::Release branch");
    expect(checkCli("release/v1.3.0").status).toBe(1);
  });
});
