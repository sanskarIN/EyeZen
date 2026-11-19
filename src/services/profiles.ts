import type { EyeZenState } from "../types";

export function activateProfile(state: EyeZenState, id: string, manualOverride = true): EyeZenState {
  const profile = state.profiles.find(item => item.id === id);
  if (!profile) return state;
  return { ...state, activeProfileId: id, theme: profile.theme,
    comfort: { ...profile.comfort }, breaks: { ...profile.breaks }, manualOverride };
}

export function removeProfile(state: EyeZenState, id: string): EyeZenState {
  if (state.profiles.length < 2 || !state.profiles.some(item => item.id === id)) return state;
  const profiles = state.profiles.filter(item => item.id !== id);
  const schedules = state.schedules.filter(rule => rule.profileId !== id);
  if (state.activeProfileId !== id) return { ...state, profiles, schedules };
  // A deleted active profile must not leave stale theme/reminder preferences behind.
  return activateProfile({ ...state, profiles, schedules }, profiles[0].id, true);
}

export function validProfileName(name: string): boolean {
  return name.trim().length > 0 && new TextEncoder().encode(name).length <= 80;
}

/** Preserve an explicit OFF gesture even when a saved backup requests tint. */
export function respectComfortStop(state: EyeZenState, stopped: boolean): EyeZenState {
  if (!stopped || !state.comfort.enabled) return state;
  return { ...state, comfort: { ...state.comfort, enabled: false } };
}

/**
 * A tray emergency stop disables tint independently of profile preferences.
 * Changing profiles is never an explicit request to rearm the safety latch.
 */
export function activateProfileRespectingStop(
  state: EyeZenState,
  id: string,
  manualOverride = true,
  comfortStopped = false
): EyeZenState {
  const next = activateProfile(state, id, manualOverride);
  return next === state ? state : respectComfortStop(next, comfortStopped);
}

/**
 * Native schedule lookup is asynchronous: ignore stale results after a manual
 * override or schedule edit, even before the old React effect cleans up.
 */
export function activateScheduledProfile(
  state: EyeZenState,
  profileId: string | null,
  schedulesAtLookup: EyeZenState["schedules"],
  comfortStopped = false
): EyeZenState {
  if (!profileId || state.manualOverride || state.schedules !== schedulesAtLookup ||
    state.activeProfileId === profileId ||
    !state.schedules.some(rule => rule.enabled && rule.profileId === profileId)) return state;
  return activateProfileRespectingStop(state, profileId, false, comfortStopped);
}
