# EyeZen v1.2.0 release & GitHub Pages acceptance

## Automated checks
- [x] Frontend lint, TypeScript checks and Vitest on v1.2.0 PR (run 38695620120)
- [x] Rust formatting, Clippy, tests, and Windows/macOS/Linux unsigned bundles on the v1.2.0 PR (run 38695620120)
- [x] Browser persistence tests cover schema validation, wrong version, corrupt settings, quota errors, normal round-trip and origin separation
- [ ] Official release workflow publishes MSI, DMG, DEB, RPM and SHA256SUMS on merged `main`
- [ ] Pages workflow produces app and documentation artifact with `/EyeZen/` Vite base

## Site publishing prerequisite (repository owner)
GitHub Pages for this repository must be enabled by a maintainer: **Settings → Pages → Build and deployment → Source → GitHub Actions**. Then the committed `Publish EyeZen Web and Documentation` workflow can publish `dist/`.

This repository's GitHub connection has permission to commit workflows but does not expose an authenticated Pages administration setting. The source selection cannot be honestly marked complete until the owner enables it and a deploy run succeeds.

After deploying, verify:
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
