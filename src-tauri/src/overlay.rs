use crate::models::ComfortSettings;
use serde::Serialize;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use tauri::{
    webview::{PageLoadEvent, WebviewWindowBuilder},
    AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl,
};

const PREFIX: &str = "comfort-overlay-";

/// A non-invasive tint overlay. It does not modify calibration, gamma,
/// operating-system night-mode settings, or physical monitor backlights.
pub struct OverlayState(pub Mutex<ComfortSettings>);

/// Emergency tray dismissal stays effective even if the main UI is frozen.
pub struct EmergencyOff(pub AtomicBool);

impl EmergencyOff {
    fn trip(&self) {
        self.0.store(true, Ordering::SeqCst);
    }

    fn rearm(&self) {
        self.0.store(false, Ordering::SeqCst);
    }

    fn engaged(&self) -> bool {
        self.0.load(Ordering::SeqCst)
    }
}

/// Close-to-tray must not reactivate overlays from queued or periodic
/// frontend refreshes while the main window is hidden.
#[derive(Default)]
pub struct MainWindowHidden(pub AtomicBool);

fn mark_main_hidden(hidden: &MainWindowHidden, emergency: &EmergencyOff, is_hidden: bool) {
    // Store hidden first, then latch. A concurrent explicit rearm must fail if
    // this close arrives during its native command.
    hidden.0.store(is_hidden, Ordering::SeqCst);
    if is_hidden {
        emergency.trip();
    }
}

fn rearm_if_visible(hidden: &MainWindowHidden, emergency: &EmergencyOff) -> bool {
    if hidden.0.load(Ordering::SeqCst) {
        return false;
    }
    emergency.rearm();
    // A close could begin during rearm. Preserve the safety latch in that race.
    if hidden.0.load(Ordering::SeqCst) {
        emergency.trip();
        return false;
    }
    true
}

/// Only an explicit UI enable action can clear the emergency latch. Reopening
/// the tray window and profile automation are not authorization to rearm it.
pub fn rearm_emergency_stop(app: &AppHandle) -> Result<(), String> {
    let hidden = app.state::<MainWindowHidden>();
    let emergency = app.state::<EmergencyOff>();
    if rearm_if_visible(&hidden, &emergency) {
        Ok(())
    } else {
        Err("Open EyeZen before re-enabling screen comfort.".into())
    }
}

pub fn set_main_hidden(app: &AppHandle, is_hidden: bool) {
    let hidden = app.state::<MainWindowHidden>();
    let emergency = app.state::<EmergencyOff>();
    mark_main_hidden(&hidden, &emergency, is_hidden);
    if is_hidden {
        close_overlays(app);
    }
}

fn main_is_hidden(app: &AppHandle) -> bool {
    app.state::<MainWindowHidden>().0.load(Ordering::SeqCst)
}

impl Default for EmergencyOff {
    fn default() -> Self {
        Self(AtomicBool::new(false))
    }
}

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

/// Identify our own windows made obsolete by a changed monitor layout.
fn is_stale_overlay(label: &str, monitor_count: usize) -> bool {
    let Some(suffix) = label.strip_prefix(PREFIX) else {
        return false;
    };
    suffix
        .parse::<usize>()
        .map_or(true, |index| index >= monitor_count)
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

pub fn emergency_stop(app: &AppHandle) {
    if let Some(flag) = app.try_state::<EmergencyOff>() {
        flag.trip();
    }
    close_overlays(app);
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
        // This is also called by asynchronous UI effects and schedules.
        // Clearing EmergencyOff here would re-enable tint without user consent.
        close_overlays(&app);
        return Ok(OverlayResult {
            status: "disabled",
            message: "EyeZen comfort overlays removed from every display.".into(),
            display_count: 0,
        });
    }

    if app.state::<EmergencyOff>().engaged() {
        close_overlays(&app);
        return Ok(OverlayResult {
            status: "disabled",
            message: "Emergency stop is active. Switch screen comfort off and on to resume.".into(),
            display_count: 0,
        });
    }

    if main_is_hidden(&app) {
        close_overlays(&app);
        return Ok(OverlayResult {
            status: "disabled",
            message: "EyeZen is hidden in the tray; screen comfort remains off.".into(),
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

    let monitors = match app.available_monitors() {
        Ok(monitors) => monitors,
        Err(error) => {
            // An enumeration failure can follow a disconnect or session change.
            // Never leave yesterday's overlays active at stale coordinates.
            close_overlays(&app);
            return Err(format!("Cannot enumerate displays: {error}"));
        }
    };
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
                                let _ = window.eval(update_script(&settings));
                            }
                        }
                    }
                })
                .build()
                .map_err(|e| format!("Cannot open overlay {index}: {e}"))?;
                window
            };
            // Reassert click-through for *existing* overlays too. Repositioning
            // and monitor/session changes must never expose a reused window that
            // can intercept desktop input. Fail closed before making it visible.
            if let Err(error) = window.set_ignore_cursor_events(true) {
                let _ = window.close();
                return Err(format!(
                    "Cannot enable click-through on display {index}: {error}"
                ));
            }
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
            // A close request can arrive while a refresh is still in flight.
            // Never let it resurrect tint windows after close-to-tray.
            if main_is_hidden(&app) || app.state::<EmergencyOff>().engaged() {
                return Err(
                    "EyeZen was hidden or emergency-stopped during the overlay refresh.".into(),
                );
            }
        }
        for (label, window) in app.webview_windows() {
            if is_stale_overlay(&label, monitors.len()) {
                let _ = window.close();
            }
        }
        if main_is_hidden(&app) || app.state::<EmergencyOff>().engaged() {
            return Err("EyeZen was hidden or emergency-stopped during the refresh.".into());
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
    fn retired_monitor_overlays_are_identified_without_touching_other_windows() {
        assert!(!is_stale_overlay("main", 1));
        assert!(!is_stale_overlay("comfort-overlay-0", 1));
        assert!(is_stale_overlay("comfort-overlay-1", 1));
        assert!(is_stale_overlay("comfort-overlay-not-an-index", 2));
        assert!(is_stale_overlay("comfort-overlay-", 0));
        assert!(!is_stale_overlay("comfort-overlay-3", 4));
        assert!(is_stale_overlay("comfort-overlay-3", 3));
    }

    #[test]
    fn emergency_stop_is_latched_until_explicit_rearm() {
        let state = EmergencyOff::default();
        assert!(!state.engaged());
        state.trip();
        assert!(state.engaged());
        // A routine disabled-state refresh is not an authorization to rearm.
        assert!(state.engaged());
        state.rearm();
        assert!(!state.engaged());
        state.trip();
        assert!(state.engaged());
    }

    #[test]
    fn close_to_tray_latches_emergency_off_even_after_reopen() {
        let hidden = MainWindowHidden::default();
        let emergency = EmergencyOff::default();
        assert!(!emergency.engaged());

        mark_main_hidden(&hidden, &emergency, true);
        assert!(hidden.0.load(Ordering::SeqCst));
        assert!(emergency.engaged());

        mark_main_hidden(&hidden, &emergency, false);
        assert!(!hidden.0.load(Ordering::SeqCst));
        assert!(emergency.engaged());
        assert!(rearm_if_visible(&hidden, &emergency));
        assert!(!emergency.engaged());
    }

    #[test]
    fn rearm_rejects_hidden_window_and_remains_latched() {
        let hidden = MainWindowHidden::default();
        let emergency = EmergencyOff::default();

        mark_main_hidden(&hidden, &emergency, true);
        assert!(!rearm_if_visible(&hidden, &emergency));
        assert!(emergency.engaged());

        mark_main_hidden(&hidden, &emergency, false);
        assert!(emergency.engaged());
        // Restoring the main UI does not implicitly enable tint.
        assert!(!hidden.0.load(Ordering::SeqCst));
    }

    #[test]
    fn normal_visible_window_does_not_latch_emergency_stop() {
        let hidden = MainWindowHidden::default();
        let emergency = EmergencyOff::default();
        mark_main_hidden(&hidden, &emergency, false);
        assert!(!hidden.0.load(Ordering::SeqCst));
        assert!(!emergency.engaged());
    }

    #[test]
    fn intensity_zero_produces_no_tint_or_dimming() {
        let settings = ComfortSettings {
            enabled: true,
            warmth: 100,
            intensity: 0,
        };
        assert_eq!(fractions(&settings), (0.0, 0.0));
    }

    #[test]
    fn stronger_intensity_does_not_reduce_tint_opacity() {
        let mut settings = ComfortSettings {
            enabled: true,
            warmth: 75,
            intensity: 20,
        };
        let low = fractions(&settings);
        settings.intensity = 80;
        let high = fractions(&settings);
        assert!(high.0 > low.0);
        assert!(high.1 > low.1);
        assert!(high.0 <= 0.35);
        assert!(high.1 <= 0.22);
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
