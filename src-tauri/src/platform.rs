use serde::Serialize;

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
pub fn report() -> PlatformReport {
    PlatformReport {
        os: std::env::consts::OS, architecture: std::env::consts::ARCH,
        capabilities: vec![
            Capability { id: "colorTemperature", status: "unsupported",
                detail: "Native display color control is not yet implemented. Use operating-system display settings." },
            Capability { id: "brightness", status: "unsupported",
                detail: "Hardware brightness integration is not yet implemented; this is not an on-screen dimming overlay." },
            Capability { id: "displayDetection", status: "unsupported",
                detail: "Display enumeration is not currently available in this build." },
            Capability { id: "themes", status: "available",
                detail: "EyeZen interface themes are controlled locally." },
            Capability { id: "profiles", status: "available",
                detail: "Profile settings are saved locally; unsupported hardware controls are not applied." },
        ],
        displays: Vec::new(),
    }
}
pub fn apply_display_settings() -> OperationResult {
    OperationResult { status: "unsupported",
        message: "No native display adjustment was made. This build does not include hardware display controls." }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn never_reports_fake_display_success() {
        assert_eq!(apply_display_settings().status, "unsupported");
        assert!(report().displays.is_empty());
    }
}
