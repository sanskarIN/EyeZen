# Testing and release acceptance

Run these checks before proposing any new stable version, including v1.2.1:

~~~sh
npm ci
npm run icons
npm run lint
npm run typecheck
npm run test
npm run build
cd src-tauri
cargo fmt --all -- --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
~~~

## Covered by source tests

Rust: default state validation, active profile references, invalid break intervals, serde round-trip, backup/recovery (including restoration from a valid previous backup, defaults when a missing primary has an invalid previous backup while preserving that original file, and preservation of corrupt originals), oversized-but-schema-valid settings rejected before file replacement, overnight schedule matching, deterministic priority, deliberate unsupported hardware outcome.

TypeScript/Vitest: overnight matching, conflict tie-breaking, quiet-hours and invalid clock syntax.

## Additional manual tests required

- Install and launch packaged artifacts on each OS.
- Change a theme, quit, relaunch, verify persistence and active profile.
- Create/edit/export/import/delete a profile; check malformed/oversized JSON rejected.
- Test overlapping and overnight schedules with selected weekdays.
- Test OS clock changes, daylight saving, suspend/resume and user manual overrides.
- Start a 30-second optional pause, immediately hide the browser tab or suspend the computer for longer than 30 seconds, then return; verify the pause has finished instead of resuming a stale countdown. Repeat with a short background interval and check the remaining time tracks actual elapsed seconds.
- Verify break notifications with permissions accepted/denied and quiet hours.
- Test shortcut conflicts on each OS, register/unregister, and tray lifecycle.
- Inspect keyboard navigation and screen-reader announcements.
- Test low contrast / scaled UI at 800×580 and larger.
- Validate behavior with multiple real monitors, HDR and color-accurate apps.
- Verify failure and restoration behavior when OS native display adapter implementations are later added.
- Confirm no unexpected network traffic, overlay, telemetry or background monitoring.
- Verify Windows installer, macOS bundle/dmg, Linux bundle and uninstall.

## Evidence requirements

A passing frontend job establishes only the specific scripts that ran. A passing Rust CI build verifies compilation/tests on that runner; it does not prove control of physical hardware. Test records should include commit SHA, OS version, hardware, check executed, observed behavior, and remaining blockers.

Stable tags should not be created when release-critical checks are incomplete.

## v1.2.1 acceptance scope

See [v1.2.1 quality gates](v1.2.1-quality-gates.md) for the proposed staged verification plan. The GitHub Actions workflows test compilation and packaging, not physical display placement or interaction on every OS/compositor. Record actual hardware and OS details when signing off manual checks.
