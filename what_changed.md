# EyeZen v1.2.0 — Web and public documentation release

**Branch:** `release-1.2.0` · **PR:** https://github.com/sanskarIN/EyeZen/pull/7  
**Official v1.2.0 released:** https://github.com/sanskarIN/EyeZen/releases/tag/v1.2.0  
**Release workflow:** https://github.com/sanskarIN/EyeZen/actions/runs/38707631189 — all jobs passed, attached MSI, DMG, DEB, RPM and SHA256SUMS.txt.  
**GitHub Pages build:** https://github.com/sanskarIN/EyeZen/actions/runs/38707631171 — build passed, deploy failed as repository Pages source is not enabled.  
**Remaining publishing dependency:** GitHub Pages must be enabled under repository Settings → Pages → Source → GitHub Actions by an authenticated maintainer. A committed workflow alone does not make Pages live.

## Functionality and implementation
1. `src/services/web-storage.ts`: validated JSON persistence in browser `localStorage`, using the namespaced `eyezen.web.settings.v1` key to avoid accidental cross-project collisions. Version/schema and size limits are enforced; invalid data is not automatically overwritten.
2. `src/services/web-storage.test.ts`: regression coverage for first visit, settings round-trip, corrupt records, storage exceptions, invalid schema, upload safety and separate storage contexts.
3. `src/services/native.ts`: browser state persistence; opt-in standard browser notification API; explicit native-feature limitations.
4. `src/App.tsx`: browser edition messaging, correct settings location, documentation links, desktop-only features distinguished from browser support, v1.2.0 About panel.
5. `src/vite-env.d.ts`: typed Vite BASE_URL access to avoid link errors when building for `/EyeZen/`.
6. `public/docs/index.html`: responsive, accessible HTML documentation with feature cards, complete platform comparison matrix, install guide, privacy, architecture and FAQ.
7. `docs/web-edition.md`, `docs/feature-matrix.md`, `docs/release-notes-v1.2.0.md`, `docs/release-checklist-v1.2.0.md`: living feature support and release acceptance docs.
8. `.github/workflows/pages.yml`: verifies frontend and builds `dist/` with `--base=/EyeZen/`, asserts docs output and publishes via GitHub Pages environment.
9. `.github/workflows/release.yml`: v1.2.0 gated Windows/macOS/Linux package release with hashes; `.github/workflows/lockfiles.yml` and `format.yml` updated for new release branch.
10. Updated npm, Cargo and Tauri application version metadata/lockfiles to 1.2.0.

## Privacy and accurate limitations
- The web edition is a client-side app; no cloud account or application-level telemetry. GitHub Pages infrastructure may log site requests.
- `localStorage` is **origin-scoped**, not path-isolated; other apps hosted on `sanskarin.github.io` share the origin. A namespaced key prevents ordinary collisions, not malicious same-origin scripts. Do not save secrets.
- Web app themes only color EyeZen itself; desktop-wide tint is available only in supported installed desktop sessions. Physical backlight/HDR/ICC/Night Light are not controlled by either edition.
- Background reminders are limited by whether the app/tab is active and by browser/OS notification permission and scheduling.
- On real devices, cross-monitor overlay positioning, cursor pass-through and compositor compatibility remain to be manually accepted.
- No unsupported medical or eye-disease claims.

## Publication steps
1. Run all checks and merge PR #7 only if successful.
2. Publish v1.2.0 desktop installer assets and SHA256SUMS via gated GitHub Actions.
3. Enable GitHub Pages Source → GitHub Actions as repository owner and confirm app and docs sites have a successful Pages workflow run.
4. Keep documentation truthful if Pages is not enabled yet.

---

# EyeZen v1.1.1 — Desktop-wide comfort implementation

**Goal:** Address the concrete v1.1.0 bug: saved `warmth` and `intensity` values did not change what the user saw on other desktop applications or secondary monitors.

**Branch:** `release-1.1.1`  
**PR:** https://github.com/sanskarIN/EyeZen/pull/6  
**Status:** v1.1.1 OFFICIALLY PUBLISHED 2026-10-15. Full frontend and Windows/macOS/Linux native+installer CI passed. Real physical multi-monitor testing remains unverified; automated tests do not prove every compositor or device works.

**Stable release:** https://github.com/sanskarIN/EyeZen/releases/tag/v1.1.1  
**Successful release workflow:** https://github.com/sanskarIN/EyeZen/actions/runs/38683918824  
**Release assets:** Windows x64 MSI, macOS aarch64 DMG, Linux amd64 DEB, Linux x86_64 RPM, SHA256SUMS.txt  
**Source merge:** PR #6 → main, merge `1ab99aeafef57f2cacd3872ce29a1416aeaf92c2`

## Root cause and fix

v1.1.0 stored a `ComfortSettings` object, but `platform::apply_display_settings()` returned `unsupported` and there was no native renderer. The v1.1.1 implementation adds explicit, permissionless desktop window tinting rather than changing physical monitor settings.

## Implementation commits and changes

1. Added `public/comfort-overlay.html` with two non-interactive transparent paint layers: amber warmth and modest black tint.
2. Added `src-tauri/src/overlay.rs` and `OverlayState` to create a window for every `AppHandle::available_monitors()` result. Each window is transparent, undecorated, always on top, hidden from the taskbar, sized and positioned from OS physical monitor coordinates.
3. Set `set_ignore_cursor_events(true)` *before showing* any overlay; if click-through, window construction or placement fails, EyeZen closes the overlays and reports failure. The session does not incorrectly claim the effect was applied.
4. Added an async `apply_comfort_overlay` Tauri command to avoid the known Windows synchronous webview-creation deadlock.
5. Mapped existing warmth/intensity sliders to conservative alpha limits (maximum 0.35 amber, maximum 0.22 dimming) and unit tests for bounded values and disabled state.
6. Updated real platform capability reporting and OS monitor enumeration. Direct physical monitor brightness, ICC/gamma, native OS Night Light/Night Shift, and color temperature remain explicitly unsupported.
7. React now applies comfort on app startup, during manual slider changes, after profile selection and every 20 seconds while enabled for monitor layout changes.
8. Added error/status text to the Screen Comfort and Displays views, and differentiated desktop-overlay availability from hardware integration.
9. Added an emergency **Disable screen comfort** tray item. The emergency kill state prevents periodic refresh from immediately re-enabling the overlay. Closing the main window also removes overlays.
10. On macOS enabled Tauri private transparency support. This is not Mac App Store compatible; standalone macOS distribution requires additional device acceptance.
11. On Linux support is limited to X11 as experimental; Wayland is deliberately marked unavailable.
12. Updated npm, Cargo and Tauri application versions to v1.1.1; synchronized locked dependency files.
13. Updated Rust formatting/lockfile CI, full multi-OS CI, release packaging pipeline, checklist, README, changelog and platform documentation.

All commits use requested author email `sanskarin@outlook.in`.

## Product behavior / important limitations

The visible effect is a tint *above the desktop*, not a hardware backlight adjustment or calibrated color temperature. An overlay can affect perceived color, so disable it for color-accurate work. Some exclusive fullscreen/secure windows may draw above the overlay. Nonstandard window managers and Wayland do not provide a reliable global overlay API. EyeZen does not claim medical benefit or eye-disease prevention.

The browser preview remains intentionally unable to tint other desktop windows, so GitHub Pages has not been enabled.

## What is still required

- Automated Rustfmt, Clippy, Cargo tests, TypeScript/Vitest tests and unsigned installers across OS runners.
- Physical-device tests for real multi-monitor placement, negative coordinates, mixed DPI, cursor click-through, hotplug, suspend/resume and emergency tray stop.
- Confirm Mac standalone DMG behavior and signed distribution policy.

See `docs/release-checklist-v1.1.1.md` and `docs/release-notes-v1.1.1.md` for acceptance and release limitations.

---

# EyeZen — v1.1.0 development report

**Updated:** 2026-10-15  
**Repository:** https://github.com/sanskarIN/EyeZen  
**Development branch:** `release-1.1.0`  
**Draft pull request:** https://github.com/sanskarIN/EyeZen/pull/5  
**Previously published stable version:** v1.0.0  
**Target under preparation:** v1.1.0 (not published and not tagged)

## Source audit and decisions

I reviewed the repository structure, Tauri capabilities/build configuration, React view and state transitions, JSON import/persistence boundaries, Rust models/storage/scheduling, unit tests, Actions CI workflows, release notes, and privacy/OS limitations. The source was inspected for concrete state, validation, and packaging risks rather than declaring any untested feature defect-free.

The project is a **desktop application**, not a complete web edition. The browser path returns temporary default data, has no persistent browser configuration, and has no access to Tauri native commands or monitor controls. **Do not deploy to GitHub Pages** in v1.1.0. A later web edition needs independently tested local persistence, feature/permission disclosures and explicit browser-only capability definitions.

## Commits and changes

1. **Rust model validation**: Reject themes outside the ten recognized presets and reject scheduling rules with duplicate weekdays, matching the frontend import requirements. Added regression unit tests.
2. **Windows write recovery**: If `settings.json` disappears during an interrupted replacement but `settings.json.previous` exists, restore validated previous settings. Enforce a bounded 128 KB config-file read. Keep corrupt-file renaming with a high-resolution timestamp. Added Rust tests.
3. **Frontend JSON validation**: Verify valid theme names, finite scale, Rust-aligned UTF-8 byte limits, valid/unique schedule IDs, and unique weekdays. Improved browser-compatible exported-file click cleanup.
4. **Import regression tests**: Added unknown-theme, invalid schedule, nonfinite input, and Unicode overlength cases.
5. **Profile lifecycle**: Introduced pure profile activation/removal helpers, with regression tests. Removing an active profile now applies the replacement profile's appearance and break preferences and removes dangling schedule rules.
6. **Name editing**: Introduced a dedicated draft field that can be cleared temporarily during typing but commits only valid, nonblank, bounded names when focus leaves the field. This prevents transient invalid configuration writes.
7. **Break assistant logic**: Added a pure reminder decision module and tests, respecting user preferences, quiet hours, paused state, backwards clock changes and no mass catch-up reminders.
8. **In-app optional pause**: A reminder banner permits starting a configurable-duration countdown, early completion or dismissal. Focus/visibility listeners re-evaluate while the app is running. Switching off or pausing reminders clears pending banners/countdowns.
9. **Schedule editor safety**: The UI now blocks equal start/end time edits rather than allowing an invalid schedule to be saved. The profile editor exposes intensity and full per-profile reminder intervals/durations, and the Break Assistant sliders match the complete backend-supported ranges (5–240 minutes, 10–600 seconds).
10. **Schedule tie-breaking**: Aligned TypeScript deterministic ID ordering with the Rust scheduler.
11. **Release build preparation**: Version identifiers updated to 1.1.0 for the Rust crate, Tauri config, frontend/UI and npm package. Lockfile generation workflow produces matching npm/Cargo dependency locks.
12. **Actions pipelines**: Scoped format/lock workflows to `release-1.1.0`. The release workflow is **manual only**, requires explicit `PUBLISH` input on `main`, and verifies frontend and all platform bundles before creating a tag and attaching Windows MSI, macOS DMG, Linux DEB/RPM plus SHA-256 checksums.
13. **Documentation**: Expanded README, changelog, draft v1.1.0 notes and manual/automated QA requirements.

Separate, meaningful commits use the requested author email **sanskarin@outlook.in**.

## Working architecture and honest limitations

**Existing, implemented:** 10 interface themes, 9 default profiles, local JSON preferences, schedule rules, manual override, optional reminders, onboarding, export/import, accessibility options, optional shortcut, and Tauri tray actions. v1.1.0 addresses specific errors in these paths.

**Still unavailable:** Direct hardware brightness control, OS Night light/Night Shift adjustment, real color temperature or calibrated color profiles, hardware display enumeration, and guaranteed background reminders after quitting the app. EyeZen does not claim a medical or preventive eye-health outcome.

**Still needs human/device QA:** Real Windows/macOS/Linux installation, high DPI, keyboard/screen-reader behavior, notification permissions, shortcut conflicts, suspend/wake, monitors/HDR, and long-running processes. Automated CI can validate compilation, unit tests and package creation; it does not replace real-device acceptance testing.

## Release gate and follow-up

- Keep v1.1.0 as a draft PR while full Windows, macOS and Linux checks are examined.
- Apply any CI test, Clippy, build or packaging fixes in further focused commits.
- Verify the app on representative devices and review [docs/release-checklist-v1.1.0.md](docs/release-checklist-v1.1.0.md).
- **Do not merge or publish v1.1.0** until the project is release-ready. When approved, use the explicit manual publish workflow on `main`.
- Do not enable GitHub Pages unless a real persistent web edition is developed and tested.

## v1.0.0 historical record

The previous v1.0.0 source and progress remain available through the stable tag: https://github.com/sanskarIN/EyeZen/tree/v1.0.0. The v1.0.0 release CI built unsigned MSI, DMG, DEB and RPM packages. v1.1.0 intentionally avoids changing or replacing that published release.
