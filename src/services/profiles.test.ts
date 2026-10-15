import { describe, expect, it } from "vitest";
import { createDefaults } from "../defaults";
import { activateProfile, removeProfile, validProfileName } from "./profiles";

describe("profile lifecycle", () => {
  it("applies profile settings without mutating the source", () => {
    const original = createDefaults();
    const next = activateProfile(original, "reading");
    expect(next.activeProfileId).toBe("reading");
    expect(next.theme).toBe("sepia");
    expect(next.manualOverride).toBe(true);
    expect(original.theme).toBe("system");
    expect(original.activeProfileId).toBe("productivity");
  });
  it("rejects unknown profile IDs", () => {
    const original = createDefaults();
    expect(activateProfile(original, "unknown")).toBe(original);
  });
  it("resets active preferences when deleting the active profile", () => {
    let state = activateProfile(createDefaults(), "reading");
    state = removeProfile(state, "reading");
    expect(state.profiles.some(p => p.id === "reading")).toBe(false);
    expect(state.activeProfileId).toBe(state.profiles[0].id);
    expect(state.theme).toBe(state.profiles[0].theme);
  });
  it("does not change appearance when removing an inactive profile", () => {
    const original = createDefaults();
    const result = removeProfile(original, "reading");
    expect(result.activeProfileId).toBe(original.activeProfileId);
    expect(result.theme).toBe(original.theme);
  });
  it("requires a nonblank profile name within 80 UTF-8 bytes", () => {
    expect(validProfileName("My space")).toBe(true);
    expect(validProfileName("   ")).toBe(false);
    expect(validProfileName("🌙".repeat(21))).toBe(false);
  });
});
