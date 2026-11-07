import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);
const docs = readFileSync(new URL("public/docs/index.html", root), "utf8");
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

describe("published documentation integrity", () => {
  it("identifies the same stable version as the application manifest", () => {
    expect(docs).toContain(`v${version} documentation`);
    expect(docs).toContain(`Latest stable: v${version}`);
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
