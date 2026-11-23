# EyeZen v1.2.2 — release candidate checklist

**Status:** Release candidate in preparation. **No v1.2.2 stable tag, published binary or release authorization yet.**  
**Candidate PR:** [#51 — v1.2.2 release preparation](https://github.com/sanskarIN/EyeZen/pull/51). **Acceptance tracker:** [issue #50](https://github.com/sanskarIN/EyeZen/issues/50).  
**Previous stable:** [v1.2.1](https://github.com/sanskarIN/EyeZen/releases/tag/v1.2.1) — previously recorded Windows 11 1920×1080 verification applies only to v1.2.1, not this candidate.

## Gate A — frozen source and version identity (automated)

- [ ] Check final candidate's full 40-character Git SHA and ensure no changes after verification.
- [ ] Exact v1.2.2 in `package.json`, `package-lock.json` (root and package root), `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`; run `npm run check:versions`.
- [ ] `npm ci --no-audit --no-fund`, `npm run check:minimatch`, `npm run check:rustix`, `npm run check:url`, ESLint, TypeScript, Vitest and Vite production build succeed for this SHA.
- [ ] `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets -- -D warnings` and `cargo test --locked` succeed on Windows, macOS and Ubuntu 24.04.
- [ ] Confirm release PR branch/version verifier matches `release/v1.2.2-rc.1`, and candidate release inventory runs only when all three platform builds succeeded.

## Gate B — reproducible unsigned preview installer inventory (automated + independently inspected)

- [ ] Candidate CI retains one unsigned Windows MSI, macOS DMG and Linux DEB + RPM bundle archive for the **exact PR SHA**.
- [ ] Download all candidate archives and compare the package filenames to expected product/version; require exactly one of each type (MSI, DMG, DEB, RPM).
- [ ] Verify the portable `SHA256SUMS.txt` against **independently extracted installers** (not just job summary). Record exact installer hashes, CI run ID and full SHA in issue #50.
- [ ] Confirm packages are unsigned and are not represented as signed, notarized, hardware-certified or published stable assets.

## Gate C — physical device, tray and scheduling acceptance (human)

- [ ] Install candidate on Windows 11, record build SHA, OS, monitor count, scaling and actual observed result.
- [ ] If a second Windows display is available: test click-through, negative monitor coordinates, different DPI, hotplug, sleep/wake and no stranded tint.
- [ ] Explicit **Disable screen comfort** from tray remains OFF through scheduled-profile refresh, close/hide, reopening, timer interval (45+ seconds) and import of an enabled-comfort backup.
- [ ] Immediate UI OFF and rapid OFF→ON remain predictable; only the user-triggered ON action rearms the emergency stop, no queued refresh reactivates tint.
- [ ] Confirm profile persistence, local backup/recovery, notifications, shortcut registration/unregistration, installer and uninstaller behavior.
- [ ] macOS DMG install, focus and click-through; Linux X11 DEB/RPM install and safe overlay failure; on Wayland ensure the UI reports unsupported global overlays.
- [ ] Check browser responsive widths, 200% zoom, keyboard onboarding focus, settings persistence, reduced motion and screen-reader navigation.
- [ ] Record PASS/FAIL/NOT TESTED per actual item in issue #50; do **not** inherit v1.2.1 test results for new behavior.

## Gate D — dependency/license/security and residual risk (review)

- [ ] Independently audit the final candidate's npm all-dependency and production-only reports; record all severities, not only the configured high/critical failure threshold.
- [ ] Review the final Cargo.lock RustSec JSON and issue [#29](https://github.com/sanskarIN/EyeZen/issues/29) for GTK/glib unsoundness and unmaintained crates; retain known limitations or compatible mitigations.
- [ ] Review native dependency redistribution/licenses, Tauri capability permissions, CSP, WebKitGTK operating-system patch state, and signing implications.
- [ ] Explicitly record a maintainer decision and disclosure for remaining risks in issue #50.

## Gate E — approval, publish and post-publication validation

- [ ] Merge the accepted candidate with no changes requiring re-verification (if it changes, repeat applicable checks).
- [ ] Verify **main's final full SHA** and its CI/audit status; ensure notes/changelog match the exact code and any accepted risk disclosure.
- [ ] Obtain **separate explicit owner publication authorization** for v1.2.2; preparing this PR and branch is not authorization.
- [ ] Manually dispatch [Publish EyeZen v1.2.2](../.github/workflows/release.yml) on `main`, supplying `confirm_release=PUBLISH`, `confirm_source_sha=<exact reviewed full main SHA>`, `confirm_acceptance=REVIEWED`. The workflow rejects wrong SHA/ref, prevents re-publication and requires the three native packages plus SHA-256 manifest.
- [ ] Independently download and verify the **published** MSI, DMG, DEB, RPM and `SHA256SUMS.txt` after publication; check the release's target commit and note that unsigned binaries are not authenticated publishers.
- [ ] Update public website and acceptance tracking after evidence is collected; do not claim unperformed checks passed.

**Owner evidence record:** `Date | final candidate SHA | CI run | package hash | OS version | monitor/scaling | performed action | observed result | PASS/FAIL/NOT TESTED | tester`.

No checklist item can be completed merely because a workflow step was scheduled, skipped or a different commit passed. No stable-release date is promised until the gates and owner approval are complete.
