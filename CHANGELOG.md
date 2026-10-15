# Changelog

All notable release changes will be documented here.

## [Unreleased] — 1.1.0 preparation

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
