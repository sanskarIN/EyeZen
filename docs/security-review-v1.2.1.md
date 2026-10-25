# EyeZen v1.2.1 — targeted dependency security review

**Date:** 2026-10-25  
**Scope:** Snapshot of the v1.2.1 npm/Cargo lockfiles, known Tauri/Vite advisories, and release controls. **This is not a comprehensive vulnerability scan**; no complete `npm audit` or `cargo audit` report has been obtained in this review.

## Verified versions and specific advisory comparisons

| Dependency | Locked version after this change | Source/review | Conclusion |
| --- | --- | --- | --- |
| `vite` (npm development/build dependency) | **6.4.5** | [GHSA-8g5g-mxqh-grgj](https://github.com/vitejs/vite/security/advisories/GHSA-8g5g-mxqh-grgj), published 2026-10-21; fixed in 6.4.5 | The previously locked 6.4.4 was in the affected line. Update the lockfile and npm minimum version to 6.4.5. The described vulnerability concerns development server file-access controls, not an established exploit against EyeZen's packaged application. |
| `tauri` (Rust) | 2.12.4 | [GHSA-w28w-mhc8-qvjv](https://github.com/tauri-apps/tauri/security/advisories/GHSA-w28w-mhc8-qvjv) (patched at 2.11.6) and [GHSA-7gmj-67g7-phm9](https://github.com/tauri-apps/tauri/security/advisories/GHSA-7gmj-67g7-phm9) (patched at 2.11.1) | Locked Tauri 2.12.4 is outside the listed affected ranges for these two advisories. This does not establish absence of other advisories. |
| `@tauri-apps/api` / CLI (npm) | 2.12.4 / 2.12.3 | npm package lockfile | Versions checked for project consistency; no complete npm advisory scan has been executed. |
| WebKitGTK (system library on Linux) | OS-managed | [WebKitGTK security advisories](https://www.webkitgtk.org/security.html) | Packaged Linux applications rely on sufficiently patched system libraries. Actual distribution/version acceptance is required. |

The Vite 6.4.5 `dist.integrity` value in `package-lock.json` was compared to the official [npm version metadata](https://registry.npmjs.org/vite/6.4.5): `sha512-4enwjFfi4IwtEh0w+jPzpLVOFQiPHmmzPxcHXQOyEur47o6u0jE573DmGpjA+7irXoMLYRZD5ZaFUEneS3abPg==`. `npm ci` must confirm the lockfile and exact registry artifact on GitHub CI.

## Repeatable advisory scanning

The new [dependency audit workflow](../.github/workflows/security-audit.yml) runs on dependency-changing pull requests, dependency changes on `main`, manual dispatch, and weekly. It checks **the locked npm tree including development packages** against the live npm advisory endpoint (high/critical fail), and `src-tauri/Cargo.lock` against the live RustSec database. JSON evidence is retained as short-lived GitHub Actions artifacts; scanner failures do **not** constitute a successful security review.

A scan's result applies only to the lockfiles and advisory databases used in that particular run. It does not prove that the native installers are malware-free, signed or safe on real desktop environments. Do not mark a scan as complete until a linked workflow run confirms it actually executed.

## Outstanding security acceptance (must not be falsely marked complete)

- [ ] Run `npm audit --audit-level=high` from the locked candidate tree and review each finding, including dev-only scope.
- [ ] Install `cargo-audit` in an appropriate Rust build environment and run `cargo audit --file src-tauri/Cargo.lock`. Review vulnerabilities and separately document unmaintained dependencies.
- [ ] Review dependency licenses and redistribution obligations, especially for native bundles and system libraries.
- [ ] Confirm the release's permission scopes, CSP and locally opened overlay WebViews; avoid adding remote origins or wildcard privileges.
- [ ] Confirm binary installation and clean uninstall on representative Windows, macOS and Linux systems.
- [ ] Verify checksum manifest against the exact **final** downloaded release-candidate files. Checksums are integrity checks, not code signing, malware clearance or trusted provenance.

## Release decision

**Not approved solely by this document.** The secure tooling patch is one verifiable improvement. Real-device click-through, browser/assistive-technology acceptance, and explicit maintainer release approval remain required in [issue #18](https://github.com/sanskarIN/EyeZen/issues/18). Keep stable `v1.2.0` until applicable criteria pass.
