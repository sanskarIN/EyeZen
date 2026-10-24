import { describe, expect, it } from "vitest";
import { createDefaults } from "../defaults";
import { clearWebState, loadWebState, readRawWebState, saveWebState, WEB_STORAGE_KEY, type WebStorage } from "./web-storage";

function memoryStore() {
  const map = new Map<string, string>();
  const storage: WebStorage = {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value); },
    removeItem: key => { map.delete(key); },
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
      removeItem: () => { throw Error("blocked"); },
    };
    expect(() => saveWebState(blocked, createDefaults())).toThrow(/Unable to save/);
  });
  it("provides the original corrupt bytes for a user-requested backup", () => {
    const { storage, map } = memoryStore();
    const original = "{not valid json!}";
    map.set(WEB_STORAGE_KEY, original);
    expect(() => loadWebState(storage)).toThrow(/corrupt/);
    expect(readRawWebState(storage)).toBe(original);
    expect(map.get(WEB_STORAGE_KEY)).toBe(original);
  });
  it("clears only EyeZen data after explicit recovery", () => {
    const { storage, map } = memoryStore();
    map.set("another.project", "leave me alone");
    map.set(WEB_STORAGE_KEY, "{bad");
    clearWebState(storage);
    expect(map.get("another.project")).toBe("leave me alone");
    expect(readRawWebState(storage)).toBeNull();
    expect(loadWebState(storage)).toEqual(createDefaults());
  });
  it("does not pretend blocked storage recovery succeeded", () => {
    const blocked: WebStorage = {
      getItem: () => { throw Error("access denied"); },
      setItem: () => { throw Error("access denied"); },
      removeItem: () => { throw Error("access denied"); },
    };
    expect(() => readRawWebState(blocked)).toThrow(/cannot be read/);
    expect(() => clearWebState(blocked)).toThrow(/cannot be cleared/);
  });
  it("does not share data between origins (uses only injected storage)", () => {
    const a = memoryStore(), b = memoryStore();
    const changed = createDefaults();
    changed.theme = "dark";
    saveWebState(a.storage, changed);
    expect(loadWebState(b.storage).theme).toBe("system");
  });
});
