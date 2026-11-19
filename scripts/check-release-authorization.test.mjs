import { spawnSync } from "node:child_process";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateReleaseAuthorization } from "./check-release-authorization.mjs";

const VALID_SHA = "a".repeat(40);
const valid = {
  ref: "refs/heads/main",
  sha: VALID_SHA,
  reviewedSha: VALID_SHA,
  publish: "PUBLISH",
  acceptance: "REVIEWED",
  version: "1.2.2",
};

describe("one-time stable release authorization", () => {
  it("accepts only the explicitly reviewed main SHA with both confirmations", () => {
    expect(validateReleaseAuthorization(valid)).toBe(true);
  });

  it("rejects release PRs, tags and other refs", () => {
    for (const ref of ["refs/heads/release/v1.2.2-rc.1", "refs/tags/v1.2.2", "refs/heads/dev", "", undefined]) {
      expect(() => validateReleaseAuthorization({ ...valid, ref })).toThrow(/main/);
    }
  });

  it("rejects missing, invalid, uppercase or stale source commits", () => {
    for (const sha of ["", "deadbeef", "A".repeat(40), "g".repeat(40), null]) {
      expect(() => validateReleaseAuthorization({ ...valid, reviewedSha: sha })).toThrow(/SHA/);
    }
    expect(() => validateReleaseAuthorization({ ...valid, sha: "b".repeat(40) })).toThrow(/SHA/);
  });

  it("rejects missing approvals and another version even if SHA matches", () => {
    for (const publish of ["NO", "", "publish", undefined]) {
      expect(() => validateReleaseAuthorization({ ...valid, publish })).toThrow();
    }
    for (const acceptance of ["NO", "", "PENDING", undefined]) {
      expect(() => validateReleaseAuthorization({ ...valid, acceptance })).toThrow();
    }
    expect(() => validateReleaseAuthorization({ ...valid, version: "1.2.1" })).toThrow(/1.2.2/);
  });

  it("checks the executable CLI used by the manual release workflow", () => {
    const script = fileURLToPath(new URL("./check-release-authorization.mjs", import.meta.url));
    const env = {
      ...process.env,
      GITHUB_REF: valid.ref,
      GITHUB_SHA: valid.sha,
      CONFIRM_SHA: valid.reviewedSha,
      CONFIRM_RELEASE: valid.publish,
      CONFIRM_ACCEPTANCE: valid.acceptance,
      RELEASE_VERSION: valid.version,
    };
    expect(spawnSync(process.execPath, [script], { env, encoding: "utf8" }).status).toBe(0);
    const stale = spawnSync(process.execPath, [script], {
      env: { ...env, CONFIRM_SHA: "b".repeat(40) }, encoding: "utf8",
    });
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain("::error::");
  });
});
