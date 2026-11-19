import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);
const docs = readFileSync(new URL("public/docs/index.html", root), "utf8");
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

describe("published documentation integrity", () => {
  it("labels candidate documentation without advertising unreleased builds as stable", () => {
    expect(docs).toContain(`v${version} documentation`);
    const published = /Latest stable: v(\\d+\\.\\d+\\.\\d+)/.exec(docs)?.[1];
    expect(published).toBeDefined();
    const fields = (value) => value.split(".").map(Number);
    const [major, minor, patch] = fields(published ?? "0.0.0");
    const [nextMajor, nextMinor, nextPatch] = fields(version);
    expect([major, minor, patch].every(Number.isInteger)).toBe(true);
    const comparison = major - nextMajor || minor - nextMinor || patch - nextPatch;
    expect(comparison).toBeLessThanOrEqual(0);
    if (published !== version) {
      expect(docs).toContain(`v${version} release candidate`);
      expect(docs).toContain("not yet published as stable");
    }
  });

  it("resolves every same-page navigation link to an existing element", () => {
    const targets = [...docs.matchAll(/\bhref="#([^"]+)"/g)].map(match => match[1]);
    const ids = new Set([...docs.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    expect(targets.length).toBeGreaterThan(10);
    expect(targets.filter(target => !ids.has(target))).toEqual([]);
    expect(targets).toContain("limitations");
    expect(targets).toContain("accessibility");
  });

  it("keeps the web-vs-desktop limitation explicit in the public guide", () => {
    expect(docs).toContain("The web edition cannot tint other apps or change monitor hardware.");
    expect(docs).toContain("desktop installers are unsigned");
  });
});
