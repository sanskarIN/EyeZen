# Testing unsigned EyeZen release candidates

Stable releases are published only after passing automated CI and applicable manual device acceptance. The **Verify EyeZen** workflow now retains unsigned installer artifacts for pull requests whose head branch begins with `release/`, allowing testers to evaluate a candidate before publishing a stable tag.

## Retrieve preview installers

1. Open the release-candidate pull request and select its **Checks** tab.
2. Follow the **Verify EyeZen** workflow link to the successful GitHub Actions run.
3. Open the workflow run summary and locate its **Artifacts** section.
4. Download the appropriate `eyezen-preview-pr-<number>-<runner>` archive; extract it.
5. Review the archive contents before installing. Typical platform packages are Windows `.msi`, macOS `.dmg`, Linux `.deb` or `.rpm`.

Artifacts are retained for **7 days** and appear only after their respective platform CI job has completed successfully. On internal release-candidate pull requests, a separate **Verify release-candidate installer inventory** job also checks the downloaded MSI, DMG, DEB and RPM files and retains a companion `eyezen-preview-pr-<number>-checksums` artifact. The aggregate check must pass before treating the candidate packaging matrix as complete. GitHub may require a signed-in account to download workflow artifacts. CI does not currently code-sign or notarize these preview installers; treat them as test builds and do not redistribute them as stable software.

## Required manual checks

- Verify the installed app launches and reports the intended version, then quit and restart.
- Verify local profile settings survive restart; export a backup before testing upgrades or resets.
- For supported desktops, try screen tint on single/multiple monitors and confirm click-through, emergency tray stop and clean disable/exit behavior.
- Record OS version, session type, display configuration, scaling, and whether the behavior matched expectations.
- Check notification permission denied/allowed, focus-restored schedules, and real suspend/resume.
- On macOS, unsigned bundles may require additional system approval; signing/notarization remains future work.
- On Linux, global overlays on Wayland remain unsupported and X11 is experimental.

Do not mark **hardware compatibility verified** simply because GitHub Actions built the executable.

## Release artifact and checksum validation

When a candidate passes device acceptance, the separate manual release workflow must require one MSI, one DMG, one DEB and one RPM. Its release artifact verifier detects missing/duplicate or unexpected platform bundles and generates SHA-256 checksums against **asset basenames** (not temporary CI directory paths). It also requires package filenames to begin with the official `EyeZen_` or `EyeZen-` name and the exact requested version; renaming an unrelated installer to a valid-looking artifact is not a substitute for signing, provenance or binary identity verification. After downloading all four eventual release installers and `SHA256SUMS.txt` into one directory, run `sha256sum -c SHA256SUMS.txt` on Linux or a compatible checksum tool. Passing hashes verifies file integrity against the published manifest, not signing, provenance, or hardware safety.

The check can be exercised without publishing a release using `node scripts/verify-release-assets.mjs <artifacts-directory> 1.2.1` against a directory with the three artifact groups. The existing Vitest suite contains synthetic missing/duplicate/version/checksum regression tests.

## Scope and security

Uploads are restricted to PRs from `release/` branches to avoid multiplying installer artifacts for every feature PR. Artifacts come from the same CI job that runs Rustfmt, Clippy, native unit tests and frontend compilation before bundling; no publishing token is required. The dedicated release workflow remains manual-only.
