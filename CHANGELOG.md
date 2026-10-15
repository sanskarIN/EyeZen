# Changelog

All notable release changes will be documented here.

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
