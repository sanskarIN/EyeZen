import { describe, expect, it } from "vitest";
import { createDefaults } from "../defaults";
import { activateProfile, activateProfileRespectingStop, activateScheduledProfile, removeProfile, validProfileName } from "./profiles";

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

  it("rejects a delayed lookup after a user enables manual override", () => {
    const initial = createDefaults();
    const schedules = [{
      id: "morning", profileId: "reading", weekdays: [0], start: "08:00",
      end: "10:00", priority: 1, enabled: true
    }];
    const automatic = { ...initial, schedules };
    const afterManualChoice = { ...automatic, manualOverride: true };
    expect(activateScheduledProfile(afterManualChoice, "reading", schedules)).toBe(afterManualChoice);
  });

  it("ignores an old schedule result when rules were changed during lookup", () => {
    const schedules = [{
      id: "morning", profileId: "reading", weekdays: [0], start: "08:00",
      end: "10:00", priority: 1, enabled: true
    }];
    const original = { ...createDefaults(), schedules };
    const edited = { ...original, schedules: schedules.map(rule => ({ ...rule, enabled: false })) };
    expect(activateScheduledProfile(edited, "reading", schedules)).toBe(edited);
    // Even a lookup from the current rules cannot apply a now-disabled rule.
    expect(activateScheduledProfile(edited, "reading", edited.schedules)).toBe(edited);
  });

  it("ignores unmatched or already-selected schedule results without rendering a change", () => {
    const schedules = [{
      id: "morning", profileId: "reading", weekdays: [0], start: "08:00",
      end: "10:00", priority: 1, enabled: true
    }];
    const original = { ...createDefaults(), schedules };
    expect(activateScheduledProfile(original, null, schedules)).toBe(original);
    expect(activateScheduledProfile(original, "nonexistent", schedules)).toBe(original);
    const active = { ...original, activeProfileId: "reading" };
    expect(activateScheduledProfile(active, "reading", schedules)).toBe(active);
  });

  it("applies current automatic rules without enabling tint after a tray stop", () => {
    const initial = createDefaults();
    const schedules = [{
      id: "evening", profileId: "reading", weekdays: [0], start: "18:00",
      end: "23:00", priority: 1, enabled: true
    }];
    const state = { ...initial, schedules,
      profiles: initial.profiles.map(profile => profile.id === "reading" ?
        { ...profile, comfort: { ...profile.comfort, enabled: true } } : profile)
    };
    const result = activateScheduledProfile(state, "reading", schedules, true);
    expect(result.activeProfileId).toBe("reading");
    expect(result.manualOverride).toBe(false);
    expect(result.comfort.enabled).toBe(false);
    expect(result.profiles.find(profile => profile.id === "reading")?.comfort.enabled).toBe(true);
    expect(activateScheduledProfile(state, "reading", schedules).comfort.enabled).toBe(true);
  });

  it("does not treat a manual profile selection as permission to rearm emergency tint", () => {
    const initial = createDefaults();
    const state = { ...initial, profiles: initial.profiles.map(profile => profile.id === "reading" ?
      { ...profile, comfort: { ...profile.comfort, enabled: true } } : profile) };
    const stopped = activateProfileRespectingStop(state, "reading", true, true);
    expect(stopped.activeProfileId).toBe("reading");
    expect(stopped.manualOverride).toBe(true);
    expect(stopped.comfort.enabled).toBe(false);
    expect(stopped.profiles.find(profile => profile.id === "reading")?.comfort.enabled).toBe(true);
    expect(activateProfileRespectingStop(state, "reading", true, false).comfort.enabled).toBe(true);
    expect(activateProfileRespectingStop(state, "missing", true, true)).toBe(state);
  });
});
