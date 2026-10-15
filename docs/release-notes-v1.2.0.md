# EyeZen v1.2.0 — Web edition, documentation and continued desktop improvements

## What is new

EyeZen now includes an initial functional, local-first **web edition** published as static files on GitHub Pages, together with a comprehensive, responsive documentation website.

- **EyeZen Web:** Ten themes, nine built-in profiles and custom profiles, schedules, manual override, optional break reminders with in-app countdowns, accessibility choices and JSON backups.
- **Durable browser preferences:** Settings persist in validated, origin-scoped browser local storage instead of resetting on every visit. Corrupt or invalid records are not silently overwritten.
- **Permission-aware web notifications:** An explicit button requests browser notification access. Automatic reminders never trigger unsolicited permission prompts; tab/OS suspension can delay or suppress notifications.
- **Documentation:** Public guide, feature catalog, supported-versus-unavailable matrix, privacy, install instructions, desktop architecture and FAQ at `/EyeZen/docs/`.
- **Deployment:** GitHub Actions builds with Vite's `/EyeZen/` base path, checks the website and docs, and deploys via GitHub Pages.

## Compatibility and migration

Desktop and web settings both use schema version 1. Files exported from Settings can be imported manually on the other edition. Browser settings are not synced to the desktop automatically. The desktop continues using the Tauri OS application configuration directory and native Rust backend.

## Web vs desktop limitations

**EyeZen Web cannot control other windows or desktop monitors.** Web appearance, profiles, scheduling and reminders apply inside the web app; web comfort values represent saved preferences only. Physical brightness/backlight, gamma, HDR, ICC color calibration, Night Light and Night Shift are unavailable in both editions.

Desktop version 1.2.0 retains opt-in per-monitor *visual tint overlays* on supported Windows/macOS sessions. Linux X11 is experimental; Linux Wayland cannot reliably place global overlays. Fullscreen/secure desktops may draw above them. This is not medical software.

Automatic schedules and reminders require the browser tab or desktop process to be active. Browser storage can be cleared by browser/user settings, private browsing or an origin change: export backups before clearing data.

## Quality gates

Frontend lint, TypeScript types, Vitest browser-persistence tests and production build must pass. Windows/macOS/Linux Rust tests, Clippy and signed-off installer packaging are independent release gates. OS-specific installation, accessibility and real monitor acceptance tests are not replaced by CI.

## Desktop packages

Official unsigned assets are published on GitHub Releases after all release CI gates pass: Windows x64 MSI, macOS Apple Silicon DMG, Linux amd64 DEB, Linux x86_64 RPM and SHA-256 hashes. Confirm availability on the exact release page before sharing download links.

## URLs
- Web edition: https://sanskarin.github.io/EyeZen/
- Website and docs: https://sanskarin.github.io/EyeZen/docs/
- Releases: https://github.com/sanskarIN/EyeZen/releases
- Source: https://github.com/sanskarIN/EyeZen

License: Mozilla Public License 2.0. No telemetry or user account is required for local features.
