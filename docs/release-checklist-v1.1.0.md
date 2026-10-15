# EyeZen v1.1.0 — Release acceptance checklist

**Status: Under development.** The release branch and draft PR are not a finished or certified build.

## Automated gates

- [ ] Frontend lint, TypeScript typecheck, full Vitest suite and Vite production build pass at the final commit.
- [ ] Rustfmt, Clippy with warnings denied, and all Rust unit tests pass on Windows, Linux and macOS.
- [ ] All three desktop packaging jobs pass for Windows MSI, macOS DMG and Linux DEB/RPM.
- [ ] Dependency lockfiles match package versions and no unreviewed network dependency is required at app runtime.
- [ ] Release publishing workflow is manually gated and checksum generation succeeds.

## User-facing manual checks (record OS, version, hardware and evidence)

- [ ] Start with a clean configuration directory, complete onboarding and relaunch.
- [ ] Upgrade in place from 1.0.0; preserve existing schema-version-1 settings.
- [ ] Change theme and profile; relaunch and confirm persistence.
- [ ] Create, rename, edit, export, import and delete a profile; check replacement profile preferences after deleting the active profile.
- [ ] Verify invalid JSON, unknown themes, duplicate weekday rules and overlong names never replace valid settings.
- [ ] Simulate interrupted Windows settings replacement and confirm prior settings recovery.
- [ ] Test schedules across midnight and overlapping rules, and manual override.
- [ ] Test reminders enabled, disabled, quiet hours, permission granted/denied, pause countdown, dismissal, app hidden, focus regained, computer wake.
- [ ] Check global shortcut conflict/unregister behavior.
- [ ] Verify high contrast, keyboard navigation, focus rings, and basic screen-reader operation.
- [ ] Install, open, close, and uninstall each platform package.
- [ ] Confirm no unsupported native brightness/color-temperature change is claimed or attempted.
- [ ] Verify no account sign-in, analytics or unintended network traffic.

## Version control and release

- Keep `main` on the latest stable source until reviewed.
- Do not merge the draft PR until CI and review are complete.
- `v1.1.0` should be created only using the manually gated release workflow on `main`, after its build prerequisites pass and real-device acceptance has been evaluated.
- Signing/notarization is not yet provided; if unsigned installers are distributed, label them clearly and provide checksums.

## GitHub Pages decision

**Do not deploy.** The browser runtime is a preview and lacks persistent settings, native screen controls and platform testing; publishing it as EyeZen Web would be misleading. A separate web-optimized product with explicit browser capabilities and storage is a future project, not a v1.1.0 deliverable.
