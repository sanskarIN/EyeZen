import { invoke, isTauri } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import type { ComfortSettings, EyeZenState, OperationResult, OverlayResult, PlatformReport, ScheduleRule } from "../types";
import { matchingRule } from "../services/schedule";
import { loadWebState, saveWebState } from "./web-storage";

export const desktop = isTauri();
export async function loadState(): Promise<EyeZenState> {
  return desktop ? invoke<EyeZenState>("load_state") : loadWebState(window.localStorage);
}
export async function saveState(data: EyeZenState): Promise<void> {
  if (desktop) await invoke("save_state", { data });
  else saveWebState(window.localStorage, data);
}
export async function platformReport(): Promise<PlatformReport> {
  if (desktop) return invoke<PlatformReport>("get_platform_report");
  return { os: "Browser web edition", architecture: "browser", displays: [], capabilities: [
    { id: "colorTemperature", status: "unsupported", detail: "Hardware controls require an implemented desktop backend." },
    { id: "brightness", status: "unsupported", detail: "Not available in a browser preview." },
    { id: "displayDetection", status: "unsupported", detail: "No display enumeration in preview mode." },
    { id: "screenOverlay", status: "unsupported", detail: "A web page cannot tint desktop windows or other applications." },
    { id: "themes", status: "available", detail: "Themes persist in this browser on this origin." },
    { id: "profiles", status: "available", detail: "Profiles and schedules persist in browser local storage." },
  ] };
}
export async function applyComfortOverlay(settings: ComfortSettings): Promise<OverlayResult> {
  if (desktop) return invoke<OverlayResult>("apply_comfort_overlay", { settings });
  return { status: "unsupported", message: "Browser previews cannot alter other desktop windows.", displayCount: 0 };
}
export async function requestDisplayAdjustment(): Promise<OperationResult> {
  return desktop ? invoke<OperationResult>("request_display_adjustment") :
    { status: "unsupported", message: "No display adjustment made: running a browser preview." };
}
export async function activeSchedule(rules: ScheduleRule[]): Promise<string | null> {
  if (desktop) return invoke<string | null>("matching_schedule", { rules });
  return matchingRule(rules, new Date())?.profileId ?? null;
}
export async function notifyBreak(): Promise<boolean> {
  if (!desktop) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    new Notification("EyeZen · Time for a pause", {
      body: "Consider looking away from the screen for a moment.",
      tag: "eyezen-break",
    });
    return true;
  }
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  if (!granted) return false;
  sendNotification({ title: "EyeZen · Time for a pause", body: "Consider looking away from the screen for a moment." });
  return true;
}

/** Only call from an explicit user click; browsers disallow unsolicited prompts. */
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (desktop || typeof Notification === "undefined" || !window.isSecureContext) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}
