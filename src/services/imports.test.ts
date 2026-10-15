import { describe, it, expect } from "vitest";
import { createDefaults } from "../defaults";
import { parseProfile, validateBackup } from "./imports";

describe("configuration import validation", () => {
  it("accepts current schema defaults", () => {
    expect(validateBackup(createDefaults())).toBe(true);
  });
  it("rejects malformed settings and missing active profile", () => {
    expect(validateBackup({})).toBe(false);
    expect(validateBackup({ ...createDefaults(), activeProfileId: "missing" })).toBe(false);
  });
  it("rejects malformed clock times and duplicates", () => {
    const d = createDefaults();
    d.breaks.quietStart = "25:99";
    expect(validateBackup(d)).toBe(false);
    const other = createDefaults();
    other.profiles.push(other.profiles[0]);
    expect(validateBackup(other)).toBe(false);
  });
  it("rejects impossible profile themes", () => {
    const backup = createDefaults();
    backup.profiles[0].theme = "not-a-theme";
    expect(validateBackup(backup)).toBe(false);
  });
  it("rejects duplicate weekday rules and invalid rule IDs", () => {
    const backup = createDefaults();
    backup.schedules.push({
      id: "repeat", profileId: "reading", weekdays: [0, 0],
      start: "08:00", end: "09:00", priority: 1, enabled: true
    });
    expect(validateBackup(backup)).toBe(false);
    backup.schedules[0].weekdays = [0];
    backup.schedules[0].id = "x".repeat(71);
    expect(validateBackup(backup)).toBe(false);
  });
  it("rejects nonfinite or excessive Unicode input", () => {
    const backup = createDefaults();
    backup.textScale = Number.NaN;
    expect(validateBackup(backup)).toBe(false);
    backup.textScale = 1;
    backup.profiles[0].name = "🌙".repeat(25);
    expect(validateBackup(backup)).toBe(false);
  });
  it("imports a valid profile with a new safe ID", () => {
    const source = createDefaults().profiles[0];
    const copy = parseProfile(source);
    expect(copy.name).toBe(source.name);
    expect(copy.id).not.toBe(source.id);
  });
  it("supports versioned profile exports and rejects future schemas", () => {
    const profile = createDefaults().profiles[0];
    const wrapped = { schemaVersion: 1, kind: "eyezen-profile", profile };
    expect(parseProfile(wrapped).name).toBe(profile.name);
    expect(() => parseProfile({ ...wrapped, schemaVersion: 2 })).toThrow();
  });
  it("rejects malformed imported comfort values", () => {
    expect(() => parseProfile({ ...createDefaults().profiles[0], comfort: { enabled: true, warmth: 999, intensity: 0 } })).toThrow();
  });
});
