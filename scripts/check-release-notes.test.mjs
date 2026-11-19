import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const notes = readFileSync(new URL(`docs/release-notes-v${version}.md`, root), "utf8");

describe("v1.2.2 published release notes integrity", () => {
  it("uses the candidate version for the future release title", () => {
    expect(notes).toMatch(new RegExp(`^# EyeZen v${version.replaceAll(".", "\\.")}`, "m"));
  });

  it("does not accidentally publish a stale pre-release status statement", () => {
    expect(notes).not.toMatch(/Candidate status:|no stable v1\.2\.2 packages have been published|as of initial candidate preparation/i);
  });

  it("discloses unsigned installers and independent device acceptance requirements", () => {
    expect(notes).toContain("unsigned");
    expect(notes).toContain("SHA-256");
    expect(notes).toContain("click-through");
    expect(notes).toContain("release gate #50");
    expect(notes).toContain("Linux X11");
    expect(notes).toContain("Wayland");
    expect(notes).toContain("RustSec");
  });
});
