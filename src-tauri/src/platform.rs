use serde::Serialize;
use tauri::AppHandle;

use crate::overlay;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Capability {
    pub id: &'static str,
    pub status: &'static str,
    pub detail: &'static str,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformReport {
    pub os: &'static str,
    pub architecture: &'static str,
    pub capabilities: Vec<Capability>,
    pub displays: Vec<DisplayInfo>,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DisplayInfo {
    pub id: String,
    pub name: String,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationResult {
    pub status: &'static str,
    pub message: &'static str,
}

pub fn report(app: &AppHandle) -> PlatformReport {
    let backend_ready = overlay::support_reason().is_none();
    let monitors = app.available_monitors().unwrap_or_default();
    let displays = monitors
        .iter()
        .enumerate()
        .map(|(index, monitor)| DisplayInfo {
            id: format!("display-{index}"),
            name: format!(
                "{} · {}×{} · ({}, {})",
                monitor
                    .name()
                    .map(String::as_str)
                    .unwrap_or("Unnamed monitor"),
                monitor.size().width,
                monitor.size().height,
                monitor.position().x,
                monitor.position().y,
            ),
        })
        .collect();

    PlatformReport {
        os: std::env::consts::OS,
        architecture: std::env::consts::ARCH,
        capabilities: vec![
            Capability {
                id: "screenOverlay",
                status: if backend_ready && !monitors.is_empty() { "available" } else { "unavailable" },
                detail: if backend_ready {
                    "Opt-in tint overlay on each enumerated screen. Click-through; not a physical monitor or calibrated color adjustment. Some fullscreen apps may draw above it."
                } else {
                    "Global click-through overlays are unavailable in this session (for example, Wayland)."
                },
            },
            Capability {
                id: "colorTemperature",
                status: "unsupported",
                detail: "Hardware color-temperature calibration, Night Light and Night Shift remain untouched.",
            },
            Capability {
                id: "brightness",
                status: "unsupported",
                detail: "Physical monitor/backlight brightness remains untouched; a visual tint is not hardware brightness.",
            },
            Capability {
                id: "displayDetection",
                status: if monitors.is_empty() { "unavailable" } else { "available" },
                detail: "Displays enumerated from the actual operating-system monitor registry.",
            },
            Capability {
                id: "themes",
                status: "available",
                detail: "EyeZen interface themes are controlled locally.",
            },
            Capability {
                id: "profiles",
                status: "available",
                detail: "Profile switches also update the opt-in screen tint when the overlay backend is supported.",
            },
        ],
        displays,
    }
}

pub fn apply_display_settings() -> OperationResult {
    OperationResult {
        status: "unsupported",
        message: "Hardware calibration and physical brightness remain unavailable. Use EyeZen Screen Comfort to apply a reversible visual tint instead.",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn hardware_is_never_claimed_available() {
        assert_eq!(apply_display_settings().status, "unsupported");
    }
}
