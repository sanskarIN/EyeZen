# EyeZen v1.2.2 — Safety and security maintenance

EyeZen v1.2.2 is a patch maintenance release for the local-first desktop application and browser edition. It focuses on preventing accidental screen-tint reactivation, safer tray behavior, predictable scheduled profiles, improved build infrastructure, and a targeted dependency advisory fix. It does **not** add hardware brightness/color-temperature controls or expand Linux Wayland support.

**Important disclosures:** Installer builds are unsigned. Passing automated builds, tests and SHA-256 verification does not independently demonstrate physical monitor click-through, installation success, OS accessibility or publisher signing. Real-device acceptance and any explicitly accepted residual risks are tracked in [v1.2.2 release gate #50](https://github.com/sanskarIN/EyeZen/issues/50). The [previous stable v1.2.1](https://github.com/sanskarIN/EyeZen/releases/tag/v1.2.1) hardware report cannot establish new v1.2.2 behavior.

## Changes since v1.2.1

### Desktop comfort and tray safety

- Reassert overlay click-through on **reused as well as newly created** monitor windows so a refresh cannot knowingly retain an input-intercepting overlay. Any failure closes the overlay rather than exposing potentially blocking tint ([PR #33](https://github.com/sanskarIN/EyeZen/pull/33)).
- Keep the main window available through **Close to tray** when a working tray icon is present, while removing overlays on hide. A missing tray icon permits ordinary window close instead of trapping an invisible process ([PR #41](https://github.com/sanskarIN/EyeZen/pull/41)).
- Keep **Disable screen comfort** latched until a new explicit user enable. Scheduled profiles, display-refresh timers, disabled-state sync and reopening EyeZen cannot clear the native emergency stop; guard against overlay refresh races ([PR #42](https://github.com/sanskarIN/EyeZen/pull/42), [PR #43](https://github.com/sanskarIN/EyeZen/pull/43)).
- Stop native overlays immediately from the UI's OFF control. Prevent stale asynchronous schedule results from overriding manual choices; switching profiles or importing a saved backup cannot implicitly reactivate a stopped tint. New regression tests cover these state transitions ([PR #47](https://github.com/sanskarIN/EyeZen/pull/47)).

### Dependency security and CI reliability

- Upgrade TypeScript-ESLint development tooling to **8.73.0**, resolving the affected nested `minimatch 10.2.6` copy to **11.0.9**. Add a known-advisory lockfile regression test. The [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) fix does not prove unrelated dependencies or native system libraries are free of risk ([PR #48](https://github.com/sanskarIN/EyeZen/pull/48)).
- Separate npm production-only and all-dependency advisory evidence, including affected package/version diagnostics; weekly RustSec auditing remains enabled ([PR #39](https://github.com/sanskarIN/EyeZen/pull/39), [PR #40](https://github.com/sanskarIN/EyeZen/pull/40)).
- Make Ubuntu CI fail closed on incomplete signed APT index refresh and retry transient mirror fetches rather than compiling against stale metadata ([PR #49](https://github.com/sanskarIN/EyeZen/pull/49)).
- Keep future candidate branch/version checks strict; support verified preview installer inventories with exact-version SHA-256 sums ([PR #32](https://github.com/sanskarIN/EyeZen/pull/32), [PR #36](https://github.com/sanskarIN/EyeZen/pull/36)).
- Opt-in main-branch **development** preview packages include source SHA and workflow provenance; they are never represented as stable-release assets ([PR #44](https://github.com/sanskarIN/EyeZen/pull/44)).
- Update project documentation and voluntary sponsorship links without changing application functionality.

## Compatibility and retained limitations

- User settings retain **schema version 1**, so no account, network sync or data migration is introduced. The browser edition remains local-only and cannot tint other application windows.
- The optional desktop effect is a transparent click-through **visual overlay**, not real hardware brightness, ICC calibration, operating-system Night Light/Night Shift, or guaranteed behavior in exclusive fullscreen.
- Linux X11 overlays are experimental and Wayland desktop-wide overlays are unsupported.
- Windows MSI, macOS DMG, Linux DEB and RPM packages are **unsigned** unless a later release explicitly proves otherwise. Actual installation, multi-monitor/mixed-DPI click-through, tray lifecycle, hotplug, sleep/wake and assistive-technology behavior require independent evidence.
- Current RustSec informational warnings (including transitive GTK/glib unsoundness and unmaintained packages) remain tracked in [issue #29](https://github.com/sanskarIN/EyeZen/issues/29); the maintainer must assess their relevance and document a risk decision. No claim of a vulnerability-free operating-system runtime is made.

## Verification and supporting evidence

The manually gated v1.2.2 publishing workflow checks source-version parity, frontend and native tests, four expected unsigned installer types (MSI, DMG, DEB and RPM) and a portable SHA-256 manifest before publishing. It requires explicit release and acceptance confirmations tied to the reviewed **full source commit SHA**. Inspect the actual release workflow run, installer hashes and the separate [release acceptance tracker #50](https://github.com/sanskarIN/EyeZen/issues/50) for the recorded outcomes, exceptions and unresolved physical-device tests. SHA-256 checksums establish consistency with published files, not code signing or guaranteed safe operation.

This document is used as **GitHub Release notes only after the maintainer explicitly authorizes publication**. Release candidate progress and pre-publication checklists remain in [the v1.2.2 candidate PR](https://github.com/sanskarIN/EyeZen/pull/51) and [release checklist](https://github.com/sanskarIN/EyeZen/blob/main/docs/release-checklist-v1.2.2.md).
