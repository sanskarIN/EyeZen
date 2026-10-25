# EyeZen v1.2.1 — Reliability, screen comfort and safe recovery

EyeZen v1.2.1 is a maintenance release for the existing local-first desktop and browser applications. Its release candidate passed the full frontend/native build, artifact-hash and npm/RustSec advisory workflows. The maintainer explicitly authorized publication on October 25, 2026 **with some manual acceptance and informational dependency warnings still open**. This authorization is not evidence that real-device or assistive-technology tests have passed.

**Important release limitations:** Windows, macOS and Linux installers are unsigned. Real-device installation, mixed-DPI multi-monitor click-through, hotplug/sleep recovery, mobile-browser screen-reader acceptance and independent license/platform-specific security review are not yet verified. Before enabling a whole-desktop tint, keep EyeZen's emergency disable/quit controls accessible. Please report failures in [the acceptance tracker](https://github.com/sanskarIN/EyeZen/issues/18); RustSec informational-warning follow-up is tracked in [issue #29](https://github.com/sanskarIN/EyeZen/issues/29).

## Improvements since v1.2.0

- **Keyboard-safe onboarding:** The first-run dialog now moves focus inside, keeps Tab/Shift+Tab within its controls, supports Escape dismissal and restores previous focus. Background navigation is inert; manual assistive-technology acceptance remains pending.
- **Stronger installer identity checks:** Preview and release verifiers now reject package filenames that do not use the official EyeZen prefix and exact expected version. Hash checks are not code signing or proof of provenance.
- **Interrupted-settings recovery:** If the primary native settings file is missing and the previous backup is invalid or oversized, EyeZen restores defaults while retaining the previous backup bytes for investigation.
- **Patched build tooling:** Vite 6.4.5 resolves the October 21, 2026 v6 development-server file-access advisory affecting the previously locked version 6.4.4. This is a targeted dependency update, not a guarantee that every dependency is vulnerability-free.
- **Repeatable dependency auditing:** Added scheduled/manual npm and RustSec scans with retained reports. On the candidate dependency lockfiles, npm reported no known vulnerabilities and RustSec reported none, but five informational RustSec warnings (including a transitive `glib` unsoundness warning) require maintainer risk review. Advisory scanning does not certify a signed or safe installer.
- **Safer notifications:** Desktop break timers no longer initiate unsolicited operating-system notification permission requests. The user-triggered test action is the explicit permission entry point.
- **Stronger monitor failure handling:** If monitor enumeration fails, the overlay backend removes previously created EyeZen tint windows rather than leaving stale visual effects.
- **Reliable optional pause countdown:** Countdown time is now computed from a session-only deadline, including when a hidden tab or sleeping computer delays one-second callbacks. Added pure regression coverage; real suspend/resume verification is still required.
- **More responsive schedules:** Profile scheduling is reevaluated when the running app regains foreground focus or its document becomes visible.
- **Browser data recovery:** If local settings cannot be parsed, users may export the original raw record and explicitly confirm a reset of EyeZen's storage key, preserving other same-origin data.
- **Regression tests:** Additional TypeScript and Rust cases cover permission denial, overnight weekday rules, schedule boundaries, monitor overlay retirement and browser recovery.
- **Documentation:** Reconcile successful v1.2.0 Pages deployment and clarify hardware acceptance requirements.
- **Narrow-screen navigation:** A labelled section selector restores all ten app screens on phones; desktop sidebar items retain accessible names, with real-browser accessibility checks still required.
- **Consistent version display:** The sidebar and About page now read the app version from the same npm metadata. CI verifies npm, Cargo and Tauri versions match.
- **Safer native storage:** Native saves reject serialized settings beyond 128 KB before altering the existing configuration. A regression test ensures the last valid saved settings remain intact.
- **Preview installers:** Release-candidate pull requests retain unsigned test installers as short-lived CI artifacts for manual review; a successful build is not hardware approval.
- **Verified release inventory:** The manual release workflow now requires exactly one Windows MSI, macOS DMG, Linux DEB and RPM, and generates SHA-256 checksums using downloadable asset names. This provides file integrity checks, not package signing or real-hardware verification.
- **Verified candidate archives:** Release-candidate CI downloads its own Windows, macOS and Linux installer artifacts, verifies all four package types and publishes preview SHA-256 checksums before manual hardware testing.
- **Better desktop recovery:** A valid previous configuration can be restored when current native settings are corrupt, while invalid originals remain quarantined.
- **Consistent schedule input:** Native settings and scheduling now require exact, zero-padded HH:MM times, consistent with the web edition.

## Preserved capabilities

- Windows, macOS and Linux desktop application with themes, profiles, reminders and opt-in visual tint windows on supported desktop sessions.
- Local-first web edition with static GitHub Pages documentation and validated browser storage.
- Version-1 settings schema and JSON backup import/export. No cloud account or analytics is required.

## Important platform limitations

**The visual tint is not physical monitor brightness, operating-system Night Light/Night Shift, HDR adjustment, ICC calibration or true hardware color-temperature control.** Linux X11 overlays are experimental; Wayland global overlays remain unsupported. Exclusive fullscreen, security surfaces and operating-system/compositor differences can prevent visual overlays. Native devices must still be tested in practice.

Windows MSI, macOS Apple Silicon DMG, Linux DEB and RPM bundles remain **unsigned** unless a future release explicitly adds and verifies signing. Browser reminders require an active tab; native schedules/reminders do not operate while the entire app process is closed. EyeZen is comfort/workflow software, not medical software.

## Release gates before publishing

1. Merge and verify the targeted v1.2.1 fixes and tests.
2. Pass frontend lint/types/tests/build and Rust fmt/Clippy/tests plus all unsigned installer builds.
3. Record real-device overlay acceptance where possible; do not describe untested hardware as verified.
4. Confirm the app, installer and dependency lockfiles all report `1.2.1`.
5. Manually run the protected release workflow from `main` using `PUBLISH` only after the checks above. The workflow must not auto-publish on a normal push.

## Links

- Source: https://github.com/sanskarIN/EyeZen
- Web edition: https://sanskarin.github.io/EyeZen/
- Documentation: https://sanskarin.github.io/EyeZen/docs/
- Full quality gates: https://github.com/sanskarIN/EyeZen/blob/main/docs/v1.2.1-quality-gates.md
