use crate::models::ComfortSettings;
use serde::Serialize;
use std::sync::Mutex;
use tauri::{
    webview::{PageLoadEvent, WebviewWindowBuilder},
    AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl,
};

const PREFIX: &str = "comfort-overlay-";

/// A non-invasive tint overlay. It does not modify calibration, gamma,
/// operating-system night-mode settings, or physical monitor backlights.
pub struct OverlayState(pub Mutex<ComfortSettings>);

impl Default for OverlayState {
    fn default() -> Self {
        Self(Mutex::new(ComfortSettings::default()))
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayResult {
    pub status: &'static str,
    pub message: String,
    pub display_count: usize,
}

fn fractions(settings: &ComfortSettings) -> (f32, f32) {
    if !settings.enabled {
        return (0.0, 0.0);
    }
    let strength = f32::from(settings.intensity) / 100.0;
    let warmth = f32::from(settings.warmth) / 100.0;
    // Keep both layers deliberately modest so text remains legible.
    (strength * warmth * 0.35, strength * 0.22)
}

fn update_script(settings: &ComfortSettings) -> String {
    let (warm, dim) = fractions(settings);
    format!(
        "document.documentElement.style.setProperty('--warm-alpha','{warm:.4}');document.documentElement.style.setProperty('--dim-alpha','{dim:.4}');"
    )
}

/// A windowing protocol may prohibit screen-global positioning or click-through.
pub fn support_reason() -> Option<&'static str> {
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("WAYLAND_DISPLAY").is_some()
            || std::env::var("XDG_SESSION_TYPE").ok().as_deref() == Some("wayland")
        {
            return Some(
                "Wayland blocks reliable global overlay placement; no overlays were created.",
            );
        }
        if std::env::var_os("DISPLAY").is_none() {
            return Some("An X11 session is required for the experimental Linux comfort overlay.");
        }
    }
    None
}

fn close_overlays(app: &AppHandle) {
    for (label, window) in app.webview_windows() {
        if label.starts_with(PREFIX) {
            let _ = window.close();
        }
    }
}

pub fn disable(app: &AppHandle) {
    if let Some(runtime) = app.try_state::<OverlayState>() {
        if let Ok(mut settings) = runtime.0.lock() {
            settings.enabled = false;
        }
    }
    close_overlays(app);
}

pub async fn apply(app: AppHandle, settings: ComfortSettings) -> Result<OverlayResult, String> {
    if settings.warmth > 100 || settings.intensity > 100 {
        return Err("Comfort values must be between 0 and 100.".into());
    }

    {
        let state = app.state::<OverlayState>();
        let mut current = state
            .0
            .lock()
            .map_err(|_| "Comfort state lock unavailable")?;
        *current = settings.clone();
    }

    if !settings.enabled {
        close_overlays(&app);
        return Ok(OverlayResult {
            status: "disabled",
            message: "EyeZen comfort overlays removed from every display.".into(),
            display_count: 0,
        });
    }

    if let Some(reason) = support_reason() {
        close_overlays(&app);
        return Ok(OverlayResult {
            status: "unsupported",
            message: reason.into(),
            display_count: 0,
        });
    }

    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    if monitors.is_empty() {
        close_overlays(&app);
        return Ok(OverlayResult {
            status: "unavailable",
            message: "No displays were detected; nothing was applied.".into(),
            display_count: 0,
        });
    }

    // Re-check screen geometry on each call, including hot-plug and DPI changes.
    // Overlay labels are owned by EyeZen and cannot clash with the main window.
    let draw = update_script(&settings);
    let result = (|| -> Result<(), String> {
        for (index, monitor) in monitors.iter().enumerate() {
            let label = format!("{PREFIX}{index}");
            let window = if let Some(existing) = app.get_webview_window(&label) {
                existing
            } else {
                let window = WebviewWindowBuilder::new(
                    &app,
                    &label,
                    WebviewUrl::App("comfort-overlay.html".into()),
                )
                .title("EyeZen comfort tint")
                .decorations(false)
                .transparent(true)
                .shadow(false)
                .always_on_top(true)
                .visible_on_all_workspaces(true)
                .skip_taskbar(true)
                .focused(false)
                .resizable(false)
                .visible(false)
                .on_page_load(|window, payload| {
                    if matches!(payload.event(), PageLoadEvent::Finished) {
                        let app = window.app_handle();
                        if let Some(state) = app.try_state::<OverlayState>() {
                            if let Ok(settings) = state.0.lock() {
                                let _ = window.eval(&update_script(&settings));
                            }
                        }
                    }
                })
                .build()
                .map_err(|e| format!("Cannot open overlay {index}: {e}"))?;
                // Never expose an overlay that can intercept desktop input.
                if let Err(error) = window.set_ignore_cursor_events(true) {
                    let _ = window.close();
                    return Err(format!(
                        "Cannot enable click-through on display {index}: {error}"
                    ));
                }
                window
            };
            window
                .set_position(PhysicalPosition::new(
                    monitor.position().x,
                    monitor.position().y,
                ))
                .map_err(|e| format!("Cannot position display {index}: {e}"))?;
            window
                .set_size(PhysicalSize::new(
                    monitor.size().width,
                    monitor.size().height,
                ))
                .map_err(|e| format!("Cannot size display {index}: {e}"))?;
            window
                .eval(&draw)
                .map_err(|e| format!("Cannot color display {index}: {e}"))?;
            window
                .show()
                .map_err(|e| format!("Cannot show display {index}: {e}"))?;
        }
        for (label, window) in app.webview_windows() {
            if let Some(suffix) = label.strip_prefix(PREFIX) {
                if suffix
                    .parse::<usize>()
                    .map_or(true, |index| index >= monitors.len())
                {
                    let _ = window.close();
                }
            }
        }
        Ok(())
    })();

    if let Err(error) = result {
        close_overlays(&app); // Fail closed: never leave a partial or blocking tint.
        return Err(error);
    }

    Ok(OverlayResult {
        status: "applied",
        message: format!(
            "EyeZen tint active on {} detected display(s). Not a hardware brightness or color-temperature adjustment.",
            monitors.len()
        ),
        display_count: monitors.len(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tint_never_exceeds_readable_opacity() {
        let settings = ComfortSettings {
            enabled: true,
            warmth: 100,
            intensity: 100,
        };
        let (warm, dim) = fractions(&settings);
        assert!((warm - 0.35).abs() < 0.001);
        assert!((dim - 0.22).abs() < 0.001);
    }

    #[test]
    fn disabled_clears_all_effects() {
        let settings = ComfortSettings {
            enabled: false,
            warmth: 100,
            intensity: 100,
        };
        assert_eq!(fractions(&settings), (0.0, 0.0));
    }

    #[test]
    fn generated_script_contains_only_bounded_numbers() {
        let settings = ComfortSettings {
            enabled: true,
            warmth: 45,
            intensity: 30,
        };
        let script = update_script(&settings);
        assert!(script.contains("0.0472") || script.contains("0.0473"));
        assert!(script.contains("0.0660"));
    }
}
