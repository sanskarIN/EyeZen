# EyeZen v1.2.0 release & GitHub Pages acceptance

## Automated checks
- [x] Frontend lint, TypeScript checks and Vitest on v1.2.0 PR (run 38695620120)
- [x] Rust formatting, Clippy, tests, and Windows/macOS/Linux unsigned bundles on the v1.2.0 PR (run 38695620120)
- [x] Browser persistence tests cover schema validation, wrong version, corrupt settings, quota errors, normal round-trip and origin separation
- [x] Official release workflow published MSI, DMG, DEB, RPM and SHA256SUMS on merged `main` (run 38707631189)
- [x] Pages workflow built and deployed the app and documentation with `/EyeZen/` Vite base (successful run 38707631171, attempt 2)

## GitHub Pages deployment record
The original Pages attempt failed while repository Pages settings were not yet configured. On **October 15, 2026**, the same workflow was rerun (attempt 2) and both the build and deploy jobs succeeded. The public app and docs URLs below are the expected deployment targets. This checklist records the CI deployment result; it does not replace runtime browser acceptance testing.

Post-deployment manual browser acceptance (not certified by Actions):
- https://sanskarin.github.io/EyeZen/ loads the EyeZen web app and bundled assets.
- https://sanskarin.github.io/EyeZen/docs/ loads the responsive complete documentation site.
- Navigation from the app to docs, and docs back to app, both work.
- Browser reload persists profile/theme/settings changes without a network backend.
- Invalid storage does not silently overwrite existing user data.
- Browser notification permission is requested only on a click.
- The website clearly marks desktop-wide overlays and global shortcuts unavailable in web mode.
- Import/export JSON works and imported data is validated.
- Test keyboard navigation and a real mobile-browser viewport.

## Manual desktop acceptance not established by CI
Windows/macOS overlay click-through, physical multi-monitor placement, mixed DPI, Linux X11/Wayland boundaries, system tray emergency-off behavior and assistive technology compatibility still need real user-machine testing. The web edition is not a medical device.

## Distribution
Commit email: `sanskarin@outlook.in`. The stable v1.2.0 desktop tag should only be announced after release assets are attached and GitHub Actions are green. The public web address should be announced as live only after a successful Pages deployment, not merely after merging workflow files.
