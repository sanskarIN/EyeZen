export interface ComfortSettings { enabled: boolean; warmth: number; intensity: number }
export interface BreakPreferences {
  enabled: boolean; intervalMinutes: number; durationSeconds: number;
  quietStart: string; quietEnd: string;
}
export interface ComfortProfile {
  id: string; name: string; theme: string;
  comfort: ComfortSettings; breaks: BreakPreferences;
}
export interface ScheduleRule {
  id: string; profileId: string; weekdays: number[];
  start: string; end: string; priority: number; enabled: boolean;
}
export interface EyeZenState {
  schemaVersion: number;
  theme: string;
  accent: string;
  textScale: number;
  reducedMotion: boolean;
  activeProfileId: string;
  profiles: ComfortProfile[];
  schedules: ScheduleRule[];
  breaks: BreakPreferences;
  comfort: ComfortSettings;
  manualOverride: boolean;
  onboardingComplete: boolean;
}
export interface Capability { id: string; status: "available" | "unsupported" | "unavailable"; detail: string }
export interface PlatformReport {
  os: string; architecture: string; capabilities: Capability[];
  displays: { id: string; name: string }[];
}
export interface OperationResult { status: string; message: string }
export interface OverlayResult { status: "applied" | "disabled" | "unsupported" | "unavailable"; message: string; displayCount: number }
export interface ThemePreset {
  id: string; name: string; description: string;
  background: string; surface: string; foreground: string;
  muted: string; border: string; preview: string;
}
