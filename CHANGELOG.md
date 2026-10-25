# Changelog

All notable release changes will be documented here.

## [Unreleased] — v1.2.1 stabilization (pending checks)

### In preparation
- Never request desktop OS notification permission from an automatic reminder; permission is requested from a user action
- Remove existing screen tint overlays when monitor enumeration fails, with regression tests
- Reevaluate schedule rules promptly when the window regains focus or visibility
- Offer opt-in raw browser settings export and a confirmed, key-only reset on corrupt local-storage records
- Add boundary and recovery tests; reconcile the v1.2.0 GitHub Pages deployment status
- Restore validated previous native settings when a primary configuration is corrupt, preserving quarantined originals
- Align native schedule and settings time parsing with strict zero-padded HH:MM syntax used by the browser
- Real-world multi-monitor acceptance, accessibility review and package signing remain distinct from passing CI

## [1.2.0] — 2026-10-15

### Added
- Working static web edition with local browser persistence, profile editing, themes, reminders and manual JSON import/export
- Public GitHub Pages documentation and platform compatibility guide
- Successful cross-platform unsigned installer release and deployment workflows

### Limitations
- Browser app cannot tint other desktop windows or control hardware displays
- Native overlay behavior on physical monitors still requires platform-specific acceptance evidence
- No publisher signing, hardware brightness, calibrated color management or guaranteed process-independent scheduling


## [1.1.1] — 2026-10-15 — desktop-wide visual comfort

### Added
- Opt-in click-through transparent tint windows for each actual enumerated display where supported
- Color warmth/intensity translated into bounded visual amber tint and dim layers across the desktop
- Multi-monitor geometry and DPI-aware positions with periodic hotplug refresh while the app is open
- Screen overlay status separate from real monitor hardware capabilities
- Emergency "Disable screen comfort" tray action and automatic overlay removal on quit/close
- Fail-closed behavior when transparent window click-through or placement fails

### Compatibility notes
- Visual tint is NOT native display color temperature, physical brightness, HDR or ICC adjustment
- Wayland desktop-wide overlays unavailable; Linux X11 is experimental
- macOS uses Tauri private transparency API and cannot target the Mac App Store
- Actual multi-monitor user hardware testing is still required

## [1.1.0] — 2026-10-15 — reliability and comfort routines

### Added
- Optional in-app screen-pause countdown that uses the configured reminder duration
- Focus/visibility wake checks for scheduled break reminders (only while the app is running)
- New profile-lifecycle and reminder calculation regression tests
- Draft v1.1.0 release documentation, pinned build preparation, and manual publication gate

### Fixed
- Profile deletion synchronizes active theme and reminder preferences
- Profile names are validated before persistence, including UTF-8 byte length
- Windows interrupted-write recovery restores a preserved prior config
- Config reads reject files larger than 128 KB
- Native and frontend import rules reject invalid themes/weekday duplicates
- Schedule conflict ordering matches Rust's deterministic ID tie-break
- Optional reminder banner clears when reminders are disabled or paused

### Not implemented
- Browser web edition and GitHub Pages (browser build is preview-only)
- Native brightness, gamma, color-temperature, monitor enumeration
- Guaranteed scheduling while the whole application is closed or suspended

## [1.0.0] — 2026-10-15

### Added
- Tauri 2 + React/TypeScript app architecture
- Persisted settings model, schema version and validation
- Default workspace profiles and theme palettes
- Profile creation/editing/import/export
- Dashboard, comfort preference controls, display capability reporting
- Time-of-week scheduling UI and manual override
- Session-level break assistant with opt-in notifications
- Theme accessibility settings, global dashboard shortcut registration
- Native tray Open/Quit integration
- CI on Windows, Linux and macOS, Rust/frontend tests
- Privacy, architecture, security and contribution documentation

### Known limitations
- Native brightness/color-temperature adjustments and physical display enumeration are not implemented
- Reminder and schedule runtime may be suspended when the application is closed
- Platform-specific install/launch and hardware validation remain outside CI coverage
- Hardware, assistive-technology, notarization and publisher-signing remain to be verified

Use [what_changed.md](what_changed.md) for more detailed progress and outstanding release blockers.
