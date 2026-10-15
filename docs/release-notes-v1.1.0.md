# EyeZen v1.1.0 — Reliability and comfort routines

This document is a **draft** for the upcoming EyeZen v1.1.0 release. Publication requires green checks and approval.

## Changes since 1.0.0

- Improved state/profile lifecycle: deleting an active profile now applies the replacement's theme and reminder preferences instead of leaving stale state.
- Safer profile name editing, with UTF-8-aware length validation and commit-on-blur behavior.
- Stricter JSON import and native configuration checks for unknown themes, duplicate weekdays and invalid identifiers.
- Recovery for interrupted Windows settings-file replacements and bounded local configuration reads.
- Deterministic priority tie-breaking shared between browser preview and native Rust logic.
- Optional in-app break prompt with a timed pause, early finish and dismissal.
- Wake/focus reevaluation of due reminders, while still avoiding unbounded catch-up notifications.
- More tests covering profile lifecycle, invalid input, timing, and recovery.
- Reproducible cross-platform builds through dependency lockfiles and CI gates.

## Compatibility

- The saved settings schema remains **version 1**, so existing 1.0.0 settings are intended to remain compatible.
- Legacy unwrapped profile JSON imports continue to work; versioned profile exports still use schema version 1.
- No cloud account, analytics service or permanent screen overlay is introduced.

## Important limitations

EyeZen does **not** yet modify native monitor brightness, hardware color temperature, Windows Night Light, macOS Night Shift or calibrated ICC profiles. Profile warmth controls continue to represent **stored preferences**, not applied hardware changes.

The scheduling and reminder loop runs while the webview process is active, and cannot promise reminders when the application is quit. No medical or preventive eye-health outcome is guaranteed.

Unsigned desktop packages require platform-specific installation checks, and desktop environments can have different notification/tray/shortcut behavior.

## Delivery

Planned unsigned builds: Windows x64 MSI, macOS Apple Silicon DMG, and Linux x86_64 DEB/RPM. Real devices and architectures not included in those runners require additional testing. Do not describe untested OS/architectures as supported.

Source: https://github.com/sanskarIN/EyeZen
License: Mozilla Public License 2.0 (MPL-2.0).
