use serde::{Deserialize, Serialize};
use std::collections::HashSet;

pub const CURRENT_SCHEMA: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ComfortSettings {
    pub enabled: bool,
    pub warmth: u8,
    pub intensity: u8,
}
impl Default for ComfortSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            warmth: 45,
            intensity: 30,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BreakPreferences {
    pub enabled: bool,
    pub interval_minutes: u16,
    pub duration_seconds: u16,
    pub quiet_start: String,
    pub quiet_end: String,
}
impl Default for BreakPreferences {
    fn default() -> Self {
        Self {
            enabled: false,
            interval_minutes: 25,
            duration_seconds: 30,
            quiet_start: "22:00".into(),
            quiet_end: "07:00".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ComfortProfile {
    pub id: String,
    pub name: String,
    pub theme: String,
    pub comfort: ComfortSettings,
    pub breaks: BreakPreferences,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleRule {
    pub id: String,
    pub profile_id: String,
    pub weekdays: Vec<u32>,
    pub start: String,
    pub end: String,
    pub priority: u8,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EyeZenState {
    pub schema_version: u32,
    pub theme: String,
    pub accent: String,
    pub text_scale: f64,
    pub reduced_motion: bool,
    pub active_profile_id: String,
    pub profiles: Vec<ComfortProfile>,
    pub schedules: Vec<ScheduleRule>,
    pub breaks: BreakPreferences,
    pub comfort: ComfortSettings,
    pub manual_override: bool,
    pub onboarding_complete: bool,
}

impl Default for EyeZenState {
    fn default() -> Self {
        let names = [
            ("coding", "Coding", "midnight"),
            ("reading", "Reading", "sepia"),
            ("office", "Office Work", "light"),
            ("productivity", "General Productivity", "system"),
            ("gaming", "Gaming", "dark"),
            ("video", "Video Editing", "dark"),
            ("photo", "Photo Editing", "dark"),
            ("evening", "Evening Comfort", "warmDark"),
            ("accessible", "Accessibility", "highContrast"),
        ];
        let profiles = names
            .iter()
            .map(|(id, name, theme)| ComfortProfile {
                id: (*id).into(),
                name: (*name).into(),
                theme: (*theme).into(),
                comfort: ComfortSettings::default(),
                breaks: BreakPreferences::default(),
            })
            .collect();
        Self {
            schema_version: CURRENT_SCHEMA,
            theme: "system".into(),
            accent: "#81cbb0".into(),
            text_scale: 1.0,
            reduced_motion: false,
            active_profile_id: "productivity".into(),
            profiles,
            schedules: Vec::new(),
            breaks: BreakPreferences::default(),
            comfort: ComfortSettings::default(),
            manual_override: false,
            onboarding_complete: false,
        }
    }
}

fn supported_theme(name: &str) -> bool {
    matches!(
        name,
        "light" | "dark" | "system" | "warmDark" | "warmLight" | "sepia"
            | "midnight" | "amoled" | "highContrast" | "grayscale"
    )
}

fn check_time(value: &str) -> bool {
    chrono::NaiveTime::parse_from_str(value, "%H:%M").is_ok()
}
fn check_breaks(value: &BreakPreferences) -> Result<(), String> {
    if !(5..=240).contains(&value.interval_minutes) {
        return Err("Break interval must be 5–240 minutes".into());
    }
    if !(10..=600).contains(&value.duration_seconds) {
        return Err("Break duration must be 10–600 seconds".into());
    }
    if !check_time(&value.quiet_start) || !check_time(&value.quiet_end) {
        return Err("Quiet hours must use HH:MM".into());
    }
    Ok(())
}
impl EyeZenState {
    pub fn validate(&self) -> Result<(), String> {
        if self.schema_version != CURRENT_SCHEMA {
            return Err("Unsupported settings schema version".into());
        }
        if self.profiles.is_empty() || self.profiles.len() > 100 {
            return Err("Expected 1–100 profiles".into());
        }
        if self.schedules.len() > 100 {
            return Err("Too many schedules".into());
        }
        if !(0.8..=1.6).contains(&self.text_scale) || !self.text_scale.is_finite() {
            return Err("Text scale must be between 0.8 and 1.6".into());
        }
        if self.accent.len() != 7
            || !self.accent.starts_with('#')
            || !self.accent[1..].bytes().all(|b| b.is_ascii_hexdigit())
        {
            return Err("Accent must be a six-digit hex color".into());
        }
        let mut ids = HashSet::new();
        for profile in &self.profiles {
            if profile.id.is_empty() || profile.id.len() > 70 || !ids.insert(profile.id.as_str()) {
                return Err("Profile IDs must be unique and nonempty (max 70 characters)".into());
            }
            if profile.name.trim().is_empty() || profile.name.len() > 80 {
                return Err("Profile names must be 1–80 characters".into());
            }
            if !supported_theme(&profile.theme) {
                return Err("Unknown profile theme".into());
            }
            check_breaks(&profile.breaks)?;
        }
        if !ids.contains(self.active_profile_id.as_str()) {
            return Err("Active profile does not exist".into());
        }
        if !supported_theme(&self.theme) {
            return Err("Unknown theme".into());
        }
        if self.comfort.warmth > 100 || self.comfort.intensity > 100 {
            return Err("Comfort values must be 0–100".into());
        }
        for profile in &self.profiles {
            if profile.comfort.warmth > 100 || profile.comfort.intensity > 100 {
                return Err("Profile comfort values must be 0–100".into());
            }
        }
        check_breaks(&self.breaks)?;
        let mut schedule_ids = HashSet::new();
        for rule in &self.schedules {
            if rule.id.is_empty() || rule.id.len() > 70 || !schedule_ids.insert(rule.id.as_str()) {
                return Err("Schedule IDs must be unique and nonempty".into());
            }
            if !ids.contains(rule.profile_id.as_str()) {
                return Err("Schedule refers to missing profile".into());
            }
            if rule.weekdays.is_empty()
                || rule.weekdays.len() > 7
                || rule.weekdays.iter().any(|d| *d > 6)
                || rule.weekdays.iter().collect::<HashSet<_>>().len() != rule.weekdays.len()
            {
                return Err("Choose valid weekdays (Monday = 0)".into());
            }
            if !check_time(&rule.start) || !check_time(&rule.end) || rule.start == rule.end {
                return Err("Schedule needs different valid HH:MM start and end".into());
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn defaults_are_valid() {
        assert!(EyeZenState::default().validate().is_ok());
    }
    #[test]
    fn rejects_dangling_profiles() {
        let state = EyeZenState {
            active_profile_id: "missing".into(),
            ..EyeZenState::default()
        };
        assert!(state.validate().is_err());
    }
    #[test]
    fn rejects_incorrect_ranges() {
        let mut state = EyeZenState::default();
        state.breaks.interval_minutes = 0;
        assert!(state.validate().is_err());
    }
    #[test]
    fn rejects_out_of_range_comfort_values() {
        let mut state = EyeZenState::default();
        state.comfort.warmth = 255;
        assert!(state.validate().is_err());
    }
    #[test]
    fn rejects_unknown_themes() {
        let state = EyeZenState {
            theme: "untrusted".into(),
            ..EyeZenState::default()
        };
        assert!(state.validate().is_err());
    }
    #[test]
    fn rejects_duplicate_weekdays() {
        let mut state = EyeZenState::default();
        state.schedules.push(ScheduleRule {
            id: "duplicate-weekdays".into(),
            profile_id: "reading".into(),
            weekdays: vec![0, 0],
            start: "09:00".into(),
            end: "17:00".into(),
            priority: 1,
            enabled: true,
        });
        assert!(state.validate().is_err());
    }
    #[test]
    fn round_trip_settings() {
        let state = EyeZenState::default();
        let json = serde_json::to_string(&state).unwrap();
        let recovered: EyeZenState = serde_json::from_str(&json).unwrap();
        assert_eq!(recovered, state);
    }
}
