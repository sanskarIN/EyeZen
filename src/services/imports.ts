import type { ComfortProfile, EyeZenState } from "../types";
import { newBreaks, newComfort, themes } from "../defaults";
import { validTime } from "./schedule";

const hex = /^#[a-fA-F0-9]{6}$/;
export function validateBackup(value: unknown): value is EyeZenState {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<EyeZenState>;
  if (d.schemaVersion !== 1 || !Array.isArray(d.profiles) || !Array.isArray(d.schedules) ||
    d.profiles.length < 1 || d.profiles.length > 100 || d.schedules.length > 100 ||
    typeof d.theme !== "string" || !themes.some(t => t.id === d.theme) ||
    typeof d.accent !== "string" || !hex.test(d.accent) ||
    typeof d.textScale !== "number" || d.textScale < .8 || d.textScale > 1.6 ||
    typeof d.reducedMotion !== "boolean" || typeof d.manualOverride !== "boolean" ||
    typeof d.onboardingComplete !== "boolean" || typeof d.activeProfileId !== "string") return false;
  const ids = new Set<string>();
  for (const p of d.profiles) {
    if (!p || typeof p.id !== "string" || !p.id || p.id.length > 70 ||
      ids.has(p.id) || typeof p.name !== "string" || !p.name.trim() || p.name.length > 80 ||
      typeof p.theme !== "string" || !validComfort(p.comfort) || !validBreaks(p.breaks)) return false;
    ids.add(p.id);
  }
  if (!ids.has(d.activeProfileId) || !validComfort(d.comfort) || !validBreaks(d.breaks)) return false;
  const ruleIds = new Set<string>();
  for (const rule of d.schedules) {
    if (!rule || typeof rule.id !== "string" || !rule.id || ruleIds.has(rule.id) ||
      !ids.has(rule.profileId) || !Array.isArray(rule.weekdays) || !rule.weekdays.length ||
      rule.weekdays.some((day: unknown) => !Number.isInteger(day) || (day as number) < 0 || (day as number) > 6) ||
      !validTime(rule.start) || !validTime(rule.end) || rule.start === rule.end ||
      !Number.isInteger(rule.priority) || rule.priority < 0 || rule.priority > 255 ||
      typeof rule.enabled !== "boolean") return false;
    ruleIds.add(rule.id);
  }
  return true;
}
function validComfort(c: unknown) {
  if (!c || typeof c !== "object") return false;
  const v = c as ReturnType<typeof newComfort>;
  return typeof v.enabled === "boolean" && Number.isInteger(v.warmth) &&
    v.warmth >= 0 && v.warmth <= 100 && Number.isInteger(v.intensity) &&
    v.intensity >= 0 && v.intensity <= 100;
}
function validBreaks(b: unknown) {
  if (!b || typeof b !== "object") return false;
  const v = b as ReturnType<typeof newBreaks>;
  return typeof v.enabled === "boolean" && Number.isInteger(v.intervalMinutes) &&
    v.intervalMinutes >= 5 && v.intervalMinutes <= 240 &&
    Number.isInteger(v.durationSeconds) && v.durationSeconds >= 10 && v.durationSeconds <= 600 &&
    validTime(v.quietStart) && validTime(v.quietEnd);
}
export function parseProfile(value: unknown): ComfortProfile {
  if (!value || typeof value !== "object") throw Error("The file is not a profile.");
  const object = value as Record<string, unknown>;
  const wrapped = "schemaVersion" in object || "kind" in object || "profile" in object;
  if (wrapped && (object.schemaVersion !== 1 || object.kind !== "eyezen-profile")) {
    throw Error("Unsupported EyeZen profile export version or format.");
  }
  const raw = (wrapped ? object.profile : value) as Partial<ComfortProfile>;
  if (!raw || typeof raw !== "object") throw Error("The file does not contain a valid profile.");
  if (typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 80 ||
    typeof raw.theme !== "string" || !themes.some(t => t.id === raw.theme) ||
    !validComfort(raw.comfort) || !validBreaks(raw.breaks)) {
    throw Error("The profile format or values are invalid.");
  }
  return { id: crypto.randomUUID(), name: raw.name, theme: raw.theme,
    comfort: { ...raw.comfort! }, breaks: { ...raw.breaks! } };
}
export function exportJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
export async function readJson(file: File) {
  if (file.size > 128_000) throw Error("JSON files must be smaller than 128 KB.");
  return JSON.parse(await file.text()) as unknown;
}
