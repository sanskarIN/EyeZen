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
