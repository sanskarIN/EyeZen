import { describe, expect, it } from "vitest";
import { createDefaults } from "../defaults";
import { loadWebState, saveWebState, WEB_STORAGE_KEY, type WebStorage } from "./web-storage";

function memoryStore() {
  const map = new Map<string, string>();
  const storage: WebStorage = {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value); },
  };
  return { map, storage };
}

describe("browser local-first settings", () => {
  it("loads fresh defaults without writing until changes are saved", () => {
    const { storage, map } = memoryStore();
    expect(loadWebState(storage)).toEqual(createDefaults());
    expect(map.size).toBe(0);
  });
  it("round-trips theme, profile and reminder preferences", () => {
    const { storage } = memoryStore();
    const settings = createDefaults();
    settings.theme = "sepia";
    settings.activeProfileId = "reading";
    settings.breaks.enabled = true;
    settings.onboardingComplete = true;
    saveWebState(storage, settings);
    expect(loadWebState(storage)).toEqual(settings);
  });
  it("does not erase corrupt saved data", () => {
    const { storage, map } = memoryStore();
    map.set(WEB_STORAGE_KEY, "{broken");
    expect(() => loadWebState(storage)).toThrow(/corrupt/);
    expect(map.get(WEB_STORAGE_KEY)).toBe("{broken");
  });
  it("rejects unsupported schema and invalid profiles", () => {
    const { storage, map } = memoryStore();
    map.set(WEB_STORAGE_KEY, JSON.stringify({ ...createDefaults(), schemaVersion: 99 }));
    expect(() => loadWebState(storage)).toThrow(/not valid/);
    const bad = createDefaults();
    bad.profiles[0].theme = "unknown";
    expect(() => saveWebState(storage, bad)).toThrow(/validation/);
  });
  it("enforces the same safety limit as native saved settings", () => {
    const { storage, map } = memoryStore();
    map.set(WEB_STORAGE_KEY, " ".repeat(128_001));
    expect(() => loadWebState(storage)).toThrow(/128 KB/);
  });
  it("reports blocked writes without claiming persistence", () => {
    const blocked: WebStorage = {
      getItem: () => null,
      setItem: () => { throw Error("quota"); },
    };
    expect(() => saveWebState(blocked, createDefaults())).toThrow(/Unable to save/);
  });
  it("does not share data between origins (uses only injected storage)", () => {
    const a = memoryStore(), b = memoryStore();
    const changed = createDefaults();
    changed.theme = "dark";
    saveWebState(a.storage, changed);
    expect(loadWebState(b.storage).theme).toBe("system");
  });
});
