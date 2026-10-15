# v1.1.1 screen-overlay verification checklist

**Code status is not hardware acceptance.** The following scenarios should be tested on representative Windows, macOS and Linux X11 desktops before claiming broad multi-monitor compatibility.

## Automated release gate
- [ ] npm lint, TypeScript typecheck, Vitest and production build pass
- [ ] Windows/macOS/Linux Rustfmt, Clippy and Cargo tests pass
- [ ] Windows MSI, macOS DMG, Linux DEB and RPM build in CI
- [ ] The release workflow creates the correct `v1.1.1` tag, four installers and SHA256SUMS
- [ ] No tests report a simulated physical monitor success

## Manual display and safety gate
- [ ] Two physically attached displays (primary and secondary), including left-of-primary negative coordinates
- [ ] Mixed DPI, rotated display and external 4K monitor placement
- [ ] Tint appears over ordinary desktop windows on each screen but **does not prevent clicking, typing or moving windows**
- [ ] Changes to warmth and intensity visibly change the desktop
- [ ] Profile switching updates tint; reboot/relaunch restores enabled preference
- [ ] Disabling Screen Comfort, choosing Color-accurate work and closing EyeZen remove tint immediately
- [ ] Tray "Disable screen comfort" instantly removes tint even if UI stops responding
- [ ] No automatic refresh overrides an emergency tray stop
- [ ] Hot-plug/unplug, changing scaling/resolution, sleep/wake and virtual desktops
- [ ] Unsupported Linux Wayland reports unavailable and never creates blocking windows
- [ ] Exclusive fullscreen/secure prompt behavior is described without unsupported guarantees
- [ ] No hardware backlight, ICC profile, HDR, gamma ramp, Night Light, Night Shift, or GPU driver setting is changed
- [ ] Mac standalone build: check private API compatibility and distribution restrictions
- [ ] Test uninstall, process crash and subsequent relaunch cleanup

## Known limitations
- Transparent window blending depends on the compositor and may fail on specific systems.
- This is a *visual tint*, not true blue-light/color temperature control, physical brightness control or a medical treatment.
- GitHub Pages remains off: no complete standalone browser edition.
