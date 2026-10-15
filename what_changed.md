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
9. **Schedule tie-breaking**: Aligned TypeScript deterministic ID ordering with the Rust scheduler.
10. **Release build preparation**: Version identifiers updated to 1.1.0 for the Rust crate, Tauri config, frontend/UI and npm package. Lockfile generation workflow produces matching npm/Cargo dependency locks.
11. **Actions pipelines**: Scoped format/lock workflows to `release-1.1.0`. The release workflow is **manual only**, requires explicit `PUBLISH` input on `main`, and verifies frontend and all platform bundles before creating a tag and attaching Windows MSI, macOS DMG, Linux DEB/RPM plus SHA-256 checksums.
12. **Documentation**: Expanded README, changelog, draft v1.1.0 notes and manual/automated QA requirements.

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
