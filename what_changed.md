# EyeZen — what_changed.md

Last working update: **2026-10-15**

This file is the detailed development handoff requested in place of long chat updates.

## Repository & delivery

- Repository: https://github.com/sanskarIN/EyeZen
- Work branch: release-1.0.0 (source files have been pushed directly using the linked GitHub connection)
- Default branch: main (initially contained only the complete MPL-2.0 LICENSE)
- Intended milestone: stable v1.0.0
- **Actual status: v1.0.0-rc.1 — release candidate, NOT a stable published release.**
- Commits: separate, descriptive, scoped commits for files/modules and corrections; GitHub commit metadata uses Sanskar / sanskarin@outlook.in.
- The existing license was preserved without replacement.
- Direct native installer verification and deployment cannot be truthfully claimed from this environment. Do not tag/publish v1.0.0 stable until the release checklist is complete.

## Implemented

### Project foundation
- Tauri 2 / Rust application; React 19 + TypeScript + Vite 6 frontend
- Versioned settings schema, custom config models and default values
- Validation, local persistence, settings recovery from corrupt files
- Native Tauri command boundary, platform capability report and honest unsupported-operation result
- Tauri tray menu for Open and Quit, and permission-scoped notification/global-shortcut plugins
- Restrictive CSP; no runtime remote fonts or tracking
- Cross-platform GitHub Actions CI and manual artifact build workflow
- SVG application icon; generated PNG/ICO/ICNS via npm run icons

### User experience
- Complete sidebar navigation for all 10 required primary feature areas
- Dashboard with active profile, appearance, automation/reminder status and quick controls
- Eye Comfort preference sliders, safe reset, color-accurate preference reset, explicit hardware limitations
- Theme Studio with ten carefully designed interface presets, global accent, font scaling and reduced motion
- Built-in profiles for coding, reading, office, productivity, gaming, video editing, photo editing, evening and accessibility
- Profile creation, editing, deletion, application, JSON import/export
- Weekday and overnight scheduling rules with numeric priority, deterministic conflicts and manual override
- Break interval, duration, quiet hours, session reminder counter, pause/resume and permissioned OS notification test
- Display view with real (currently empty) enumeration and explicit per-capability support status
- Accessibility center with readable labels, focus indicators, adjustable fonts, reduced motion, high contrast
- Settings backup import/export, full reset, optional session-level global dashboard shortcut
- First-run theme/reminder onboarding with skip support
- Explicit browser-preview mode without fake desktop persistence or simulated native hardware success

### Tests
- Rust state defaults, range validation, round-trip serialization, recovery, schedule priority, overnight windows, unsupported hardware behavior
- TypeScript unit tests for matching rules, quiet hours, profile import and complete settings validation
- Linux, Windows and macOS CI matrix configured
- Frontend lint, typecheck, tests, and production build **passed** on an early CI run; subsequent runs also passed the frontend job on the new test commit.
- Rust formatting initially failed due to generated source layout. An automatic Rustfmt workflow was added, formatted files were committed to the release branch, and subsequent macOS Rust formatting step passed.
- The first Rust Clippy run identified two lints (unnecessary explicit lifetimes and default state field reassignments). Both source issues have been corrected with dedicated commits; newer Rust CI jobs are being rerun.
- The branch received further cargo fmt changes through GitHub Actions. Recheck the latest CI run before reporting full success.

## Intentional boundaries (not hidden bugs)

The prompt explicitly forbids fake hardware success. Therefore this candidate does **not** implement hardware brightness, OS Night light/Night Shift, real color-temperature adjustment, monitor enumeration/control, HDR operations, or a disguised color overlay. These features require targeted native integration and physical verification. Slider values are stored preferences only.

Scheduling and break reminders currently run in the webview runtime, not a validated persistent native background daemon. Closing/suspending the process may stop reminders or scheduled transitions. Tray currently offers Open/Quit, not the full requested quick menu. Global dashboard shortcut is opt-in per session, not yet editable/persisted. Custom full-theme composition, app autostart and deeply integrated per-monitor adjustments remain future work.

Import/export currently uses frontend JSON file input/download and backend validation. It is not a native file picker and does not require broad filesystem grants. No users or OS integrations are misrepresented as tested.

## Files and organization

- package.json / tsconfig.json / vite.config.ts / eslint.config.js / index.html
- src/main.tsx, src/App.tsx, src/defaults.ts, src/types.ts, src/styles.css
- src/components/ui.tsx
- src/services/native.ts, schedule.ts, schedule.test.ts, imports.ts, imports.test.ts
- src-tauri/Cargo.toml, build.rs, tauri.conf.json, capabilities/default.json
- src-tauri/src/main.rs, lib.rs, models.rs, platform.rs, scheduler.rs, storage.rs
- src-tauri/icons/app-icon.svg
- .github/workflows/ci.yml, release.yml, format.yml
- README.md, CHANGELOG.md, CONTRIBUTING.md, SECURITY.md
- docs/architecture.md, docs/platform-support.md, docs/privacy.md, docs/testing.md, docs/release-checklist.md
- LICENSE (preexisting MPL-2.0)

## GitHub pull request

- Draft review: https://github.com/sanskarIN/EyeZen/pull/1
- Draft status is intentional until full CI, hardware, installation and accessibility release gates pass.

## Known issues / follow-up engineering priorities

1. Resolve any remaining Rust compilation, Clippy and bundle problems from the cross-platform CI runs.
2. Install and launch the desktop app on Windows, macOS and Linux; validate actual webview/tray and native notification behavior.
3. Implement a reliable background scheduling/reminder service with wake/sleep handling and explicit permissions.
4. Finish the native OS support matrix and safe native display controls. Do not use undocumented OS hacks.
5. Expand reusable custom theme editing, theme file import/export and profile conflict validation.
6. Complete all tray quick actions, persistent shortcut settings and optional startup behavior.
7. Add more robust app-level UI tests and keyboard/screen-reader checks on real platforms.
8. Review OS packaging, code signing, SBOM/dependency licenses, vulnerability scanning and distribution requirements.
9. Only then assess whether v1.0.0 stable release acceptance criteria have been met.

## Release policy

**No claim of a stable v1.0.0 release or finished physical display integration has been made.** CI status is inspectable in the repository. Stable tagging requires successful tests and hardware/OS acceptance according to docs/release-checklist.md.

## Final v1.0.0 release engineering (2026-10-15)

### Root cause of failed platform packaging checks

All frontend checks, Rust formatting, Clippy, Rust tests, and application release compilation were green in the last completed three-platform CI attempt. The remaining failures were **packaging version syntax**, not failed application compilation:

- **Linux RPM** rejected `1.0.0-rc.1` because its package version format disallows a hyphen in that form.
- **Windows MSI** rejected the nonnumeric `rc.1` prerelease segment in the Tauri application version.
- **macOS** successfully built its bundle in that same CI attempt.

Fixes committed:

1. Set `1.0.0` consistently in the npm package, Cargo crate, Tauri application configuration, and UI version display.
2. Add release notes with explicit unsupported-display-feature, unsigned-build, and user-acceptance caveats.
3. Change CI to produce explicit **Linux DEB/RPM**, **Windows MSI**, and **macOS DMG** bundle targets; avoid platform-incompatible prerelease versions.
4. Add a gated release workflow on merge to main. It runs frontend tests and all three platform build/test/bundle jobs, uploads unsigned artifacts, and creates `v1.0.0` with assets **only if every required job succeeds**. If an asset is missing, the release does not publish.
5. Generate and commit `package-lock.json` and `src-tauri/Cargo.lock` for deterministic dependency resolution; CI uses `npm ci` and Cargo `--locked`.
6. Fix the lock-generation workflow's concurrent-push issue via fetch + rebase.
7. Version exported profile JSON with `schemaVersion: 1`, validate on import, retain compatibility with prior simple profiles, and add Vitest coverage.
8. Avoid duplicate push and pull-request CI jobs for each release-branch commit.

### Manual acceptance still distinct from CI

Running a GitHub Actions application compilation or creating an installer does **not** verify that the graphical app launches successfully on real Windows/macOS/Linux machines, that notifications behave identically across desktop environments, or that external hardware controls work. These scenarios remain unverified until a device test report is recorded. EyeZen deliberately reports native color temperature, brightness, and display enumeration as unsupported in this version. No medical eye-protection or guaranteed reduction of symptoms is claimed.

### Release publishing requirements

- Source branch: `release-1.0.0` and draft PR #1: https://github.com/sanskarIN/EyeZen/pull/1
- After verifying the latest PR checks, merge into `main`. Main triggers the gated release workflow.
- The release workflow tests, builds, and uploads unsigned installers; it refuses to publish unless the expected DEB/RPM/MSI/DMG artifacts exist.
- Treat `docs/release-checklist.md` as the remaining manual QA and long-term release gate checklist.

