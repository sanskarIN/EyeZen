import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { affectedMinimatchVersion, checkMinimatchLock, MINIMATCH_ADVISORY } from "./check-minimatch-advisory.mjs";

const nested = "node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch";
function sample(version = "11.0.9") {
  return {
    name: "eyezen",
    lockfileVersion: 3,
    packages: {
      "": { name: "eyezen" },
      "node_modules/minimatch": { version: "3.1.5" },
      [nested]: { version },
    },
  };
}

describe("minimatch moderate advisory regression gate", () => {
  it("accepts the patched TypeScript parser dependency and unrelated old major", () => {
    expect(checkMinimatchLock(sample()).map(item => item.version)).toEqual(["3.1.5", "11.0.9"]);
    for (const version of ["1.0.0", "3.1.5", "6.9.0", "11.0.1", "11.0.9", "12.0.0"]) {
      expect(affectedMinimatchVersion(version), version).toBe(false);
    }
  });

  it("rejects the complete affected range including unpatched 11.0.0", () => {
    for (const version of ["7.0.0", "8.9.9", "9.0.0", "10.2.6", "10.99.0", "11.0.0", "11.0.1-rc.1"]) {
      expect(affectedMinimatchVersion(version), version).toBe(true);
      expect(() => checkMinimatchLock(sample(version))).toThrow(MINIMATCH_ADVISORY);
    }
  });

  it("fails closed on invalid lockfile schemas and malformed locked versions", () => {
    for (const lock of [null, {}, { lockfileVersion: 2, packages: {} }, { lockfileVersion: 3 }, { lockfileVersion: 3, packages: [] }]) {
      expect(() => checkMinimatchLock(lock)).toThrow();
    }
    for (const version of ["10", "v10.2.6", "unknown", "", null, "1.2.3.4", "99999999999999999999.0.0"]) {
      expect(() => checkMinimatchLock(sample(version))).toThrow();
    }
  });

  it("identifies the exact npm package path instead of unrelated similarly named packages", () => {
    const lock = sample();
    lock.packages["node_modules/example-minimatch"] = { version: "10.2.6" };
    expect(checkMinimatchLock(lock)).toHaveLength(2);
    lock.packages["node_modules/vendor/node_modules/minimatch"] = { version: "10.2.6" };
    expect(() => checkMinimatchLock(lock)).toThrow("vendor/node_modules/minimatch");
  });

  it("exercises the exact CLI path used in CI", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "eyezen-minimatch-check-"));
    const script = fileURLToPath(new URL("./check-minimatch-advisory.mjs", import.meta.url));
    try {
      const lock = path.join(dir, "package-lock.json");
      writeFileSync(lock, JSON.stringify(sample()));
      const good = spawnSync(process.execPath, [script, lock], { encoding: "utf8" });
      expect(good.status).toBe(0);
      expect(good.stdout).toContain(MINIMATCH_ADVISORY);
      writeFileSync(lock, JSON.stringify(sample("10.2.6")));
      const bad = spawnSync(process.execPath, [script, lock], { encoding: "utf8" });
      expect(bad.status).toBe(1);
      expect(bad.stderr).toContain(MINIMATCH_ADVISORY);
      const missing = spawnSync(process.execPath, [script, path.join(dir, "missing.json")], { encoding: "utf8" });
      expect(missing.status).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
