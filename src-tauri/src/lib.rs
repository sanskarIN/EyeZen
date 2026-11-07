mod models;
mod overlay;
mod platform;
mod scheduler;
mod storage;

use models::{ComfortSettings, EyeZenState, ScheduleRule};
use platform::{OperationResult, PlatformReport};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, State,
};

// Only hide the main UI when a working tray icon was actually installed.
#[derive(Default)]
struct TrayReady(AtomicBool);

fn should_hide_to_tray(label: &str, tray_ready: bool) -> bool {
    label == "main" && tray_ready
}

#[tauri::command]
fn load_state(app: tauri::AppHandle) -> Result<EyeZenState, String> {
    let path = storage::state_path(&app)?;
    storage::recover(&path)
}

#[tauri::command]
fn save_state(
    app: tauri::AppHandle,
    data: EyeZenState,
    guard: State<'_, Mutex<()>>,
) -> Result<(), String> {
    let _lock = guard
        .lock()
        .map_err(|_| "Settings write lock is unavailable")?;
    let path = storage::state_path(&app)?;
    storage::save(&path, &data)
}

#[tauri::command]
fn get_platform_report(app: tauri::AppHandle) -> PlatformReport {
    platform::report(&app)
}

#[tauri::command]
async fn apply_comfort_overlay(
    app: tauri::AppHandle,
    settings: ComfortSettings,
) -> Result<overlay::OverlayResult, String> {
    overlay::apply(app, settings).await
}

#[tauri::command]
fn rearm_emergency_comfort_stop(app: tauri::AppHandle) {
    // This command is only called by the explicit UI comfort-enable gesture,
    // never by a periodic refresh, profile automation, or state restoration.
    overlay::rearm_emergency_stop(&app);
}

#[tauri::command]
fn request_display_adjustment() -> OperationResult {
    platform::apply_display_settings()
}

#[tauri::command]
fn matching_schedule(rules: Vec<ScheduleRule>) -> Option<String> {
    scheduler::matching_rule(&rules, chrono::Local::now()).map(|r| r.profile_id.clone())
}

pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(()))
        .manage(overlay::OverlayState::default())
        .manage(overlay::EmergencyOff::default())
        .manage(overlay::MainWindowHidden::default())
        .manage(TrayReady::default())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Open EyeZen", true, None::<&str>)?;
            let emergency = MenuItem::with_id(
                app,
                "comfort-off",
                "Disable screen comfort",
                true,
                None::<&str>,
            )?;
            let quit = MenuItem::with_id(app, "quit", "Quit EyeZen", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &emergency, &quit])?;
            if let Some(icon) = app.default_window_icon() {
                TrayIconBuilder::new()
                    .icon(icon.clone())
                    .menu(&menu)
                    .on_menu_event(|app, event| match event.id().as_ref() {
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.show().is_ok() {
                                    overlay::set_main_hidden(app, false);
                                    let _ = window.unminimize();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        "comfort-off" => {
                            overlay::emergency_stop(app);
                            if let Some(main) = app.get_webview_window("main") {
                                let _ = main
                                    .eval("window.dispatchEvent(new Event('eyezen:comfort-off'))");
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .build(app)?;
                app.state::<TrayReady>().0.store(true, Ordering::SeqCst);
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() != "main" {
                    return;
                }
                let app = window.app_handle();
                let tray_ready = app.state::<TrayReady>().0.load(Ordering::SeqCst);
                if should_hide_to_tray(window.label(), tray_ready) {
                    // Block stale or recurring overlay refreshes *before*
                    // hiding. Otherwise a hidden EyeZen could tint the desktop.
                    overlay::set_main_hidden(app, true);
                    if window.hide().is_ok() {
                        api.prevent_close();
                        if let Some(main) = app.get_webview_window("main") {
                            let _ =
                                main.eval("window.dispatchEvent(new Event('eyezen:comfort-off'))");
                        }
                        return;
                    }
                    // If hiding fails, let the window close normally instead
                    // of trapping the user in a process without a visible UI.
                    overlay::set_main_hidden(app, false);
                }
                overlay::disable(app);
            }
        })
        .invoke_handler(tauri::generate_handler![
            load_state,
            save_state,
            get_platform_report,
            request_display_adjustment,
            matching_schedule,
            apply_comfort_overlay,
            rearm_emergency_comfort_stop
        ])
        .run(tauri::generate_context!())
        .expect("unable to start EyeZen");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_main_window_can_be_retained_by_a_ready_tray() {
        assert!(should_hide_to_tray("main", true));
        assert!(!should_hide_to_tray("main", false));
        assert!(!should_hide_to_tray("comfort-overlay-0", true));
        assert!(!should_hide_to_tray("other-window", true));
    }
}
