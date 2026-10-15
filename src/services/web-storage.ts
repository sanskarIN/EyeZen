import type { EyeZenState } from "../types";
import { createDefaults } from "../defaults";
import { validateBackup } from "./imports";

/**
 * Browser-only, same-origin device storage. Nothing is uploaded to GitHub Pages.
 * Keep the native Tauri settings path entirely separate from the web edition.
 */
export const WEB_STORAGE_KEY = "eyezen.web.settings.v1";
const MAX_BYTES = 128_000;

export interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadWebState(storage: WebStorage): EyeZenState {
  let json: string | null;
  try {
    json = storage.getItem(WEB_STORAGE_KEY);
  } catch {
    throw new Error("Browser storage is blocked. Allow local site storage to save EyeZen settings.");
  }
  if (json === null) return createDefaults();
  if (new TextEncoder().encode(json).length > MAX_BYTES) {
    throw new Error("Saved web settings exceed the 128 KB limit. Export or clear this site's storage.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new Error("Saved web settings are corrupt. They have not been overwritten.");
  }
  if (!validateBackup(parsed)) {
    throw new Error("Saved web settings are not valid EyeZen version-1 settings. They have not been overwritten.");
  }
  return parsed;
}

export function saveWebState(storage: WebStorage, state: EyeZenState): void {
  if (!validateBackup(state)) throw new Error("Settings validation failed; nothing was saved.");
  const serialized = JSON.stringify(state);
  if (new TextEncoder().encode(serialized).length > MAX_BYTES) {
    throw new Error("Settings exceed the 128 KB browser storage limit.");
  }
  try {
    storage.setItem(WEB_STORAGE_KEY, serialized);
  } catch {
    throw new Error("Unable to save in browser storage. Check private mode, permissions, or available space.");
  }
}
