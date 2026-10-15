# EyeZen v1.0.0 — Initial desktop release

**Your screen. Your comfort. Your environment.**

EyeZen v1.0.0 is a local-first desktop workspace-personalization utility for Windows, macOS, and Linux, built with Rust, Tauri 2, React and TypeScript.

## Included in this release

- Ten built-in EyeZen interface themes, accent customization, text scaling and reduced motion.
- Nine built-in workspace profiles and profile creation, editing, duplication through new profile creation, import/export, and deletion.
- Day-of-week and overnight automatic profile schedules with priority and visible manual override.
- Configurable, optional break reminders with quiet hours and OS notification integration, where permitted.
- Basic Open/Quit tray actions and optional session-level global dashboard shortcut.
- Local settings persistence, backups, validation, and recovery after a damaged settings file.
- Explicit OS capability registry, with honest feedback about unsupported display adjustments.
- Source tests and CI packaging checks for three desktop operating systems.

## Important limitations (please read before installing)

**EyeZen v1.0.0 does not control physical monitor brightness or system color temperature.** Warmth/intensity controls save preferences only; they do not alter a monitor or the OS's Night light/Night Shift. There is no color overlay and no multi-monitor enumeration in this version.

Schedules and break reminders run while the application's webview is active. They cannot be guaranteed while the app is closed or suspended. Tray behavior, notifications, and shortcuts vary by environment. OS-specific hardware and accessibility acceptance testing is still recommended before relying on these features.

EyeZen is not medical software and does not guarantee improved eye health.

## Installation and artifact status

The attached Linux DEB/RPM, Windows MSI and macOS DMG bundles are **CI-built, unsigned artifacts**. Windows and macOS may display publisher/signing warnings. The macOS DMG is not notarized. OS installers should be verified locally before wider deployment.

Inspect the [platform support matrix](https://github.com/sanskarIN/EyeZen/blob/main/docs/platform-support.md), [testing requirements](https://github.com/sanskarIN/EyeZen/blob/main/docs/testing.md), and [change log](https://github.com/sanskarIN/EyeZen/blob/main/CHANGELOG.md).

## Source and license

Source code: https://github.com/sanskarIN/EyeZen

Mozilla Public License 2.0 (MPL-2.0). Dependency licenses remain their respective upstream licenses.
