import type { BreakPreferences, ComfortProfile, EyeZenState, ThemePreset } from "./types";

export const themes: ThemePreset[] = [
  { id: "light", name: "Light", description: "Clear and airy", background: "#f5f7f8", surface: "#ffffff", foreground: "#16262b", muted: "#657b80", border: "#dee7e6", preview: "#f5f7f8" },
  { id: "dark", name: "Dark", description: "Soft charcoal", background: "#161e27", surface: "#202b35", foreground: "#f2f6f3", muted: "#a7b8b9", border: "#35414b", preview: "#161e27" },
  { id: "system", name: "System", description: "Follows OS appearance", background: "#161e27", surface: "#202b35", foreground: "#f2f6f3", muted: "#a7b8b9", border: "#35414b", preview: "#b7c9cc" },
  { id: "warmDark", name: "Warm Dark", description: "Earthy evening tones", background: "#221c1b", surface: "#312824", foreground: "#f7ece0", muted: "#c6aa94", border: "#54413b", preview: "#554138" },
  { id: "warmLight", name: "Warm Light", description: "Soft neutral warmth", background: "#f9f1e5", surface: "#fffaf2", foreground: "#3d302a", muted: "#786e65", border: "#e7d8c7", preview: "#f9f1e5" },
  { id: "sepia", name: "Sepia Reading", description: "Book-inspired palette", background: "#ece0c5", surface: "#f8edda", foreground: "#433525", muted: "#796a55", border: "#d4c4a5", preview: "#ece0c5" },
  { id: "midnight", name: "Midnight", description: "Quiet deep blue", background: "#111827", surface: "#1b2940", foreground: "#edf3ff", muted: "#9daec9", border: "#37465c", preview: "#111827" },
  { id: "amoled", name: "AMOLED-Inspired", description: "Near-black surfaces", background: "#070a0b", surface: "#12191c", foreground: "#ecf5f1", muted: "#9ab3ac", border: "#263a36", preview: "#070a0b" },
  { id: "highContrast", name: "High Contrast", description: "Stronger visual separation", background: "#070b13", surface: "#0d1626", foreground: "#ffffff", muted: "#e1e6f1", border: "#e3f8f1", preview: "#070b13" },
  { id: "grayscale", name: "Grayscale", description: "Minimal monochrome", background: "#222222", surface: "#303030", foreground: "#eeeeee", muted: "#bdbdbd", border: "#555555", preview: "#505050" },
];
export const newBreaks = (): BreakPreferences => ({
  enabled: false, intervalMinutes: 25, durationSeconds: 30, quietStart: "22:00", quietEnd: "07:00"
});
export const newComfort = () => ({ enabled: false, warmth: 45, intensity: 30 });
export function createDefaults(): EyeZenState {
  const specs: Array<[string, string, string]> = [
    ["coding", "Coding", "midnight"],
    ["reading", "Reading", "sepia"],
    ["office", "Office Work", "light"],
    ["productivity", "General Productivity", "system"],
    ["gaming", "Gaming", "dark"],
    ["video", "Video Editing", "dark"],
    ["photo", "Photo Editing", "dark"],
    ["evening", "Evening Comfort", "warmDark"],
    ["accessible", "Accessibility", "highContrast"],
  ];
  const profiles: ComfortProfile[] = specs.map(([id, name, theme]) =>
    ({ id, name, theme, comfort: newComfort(), breaks: newBreaks() }));
  return {
    schemaVersion: 1, theme: "system", accent: "#81cbb0", textScale: 1,
    reducedMotion: false, activeProfileId: "productivity", profiles,
    schedules: [], breaks: newBreaks(), comfort: newComfort(),
    manualOverride: false, onboardingComplete: false
  };
}
