# EyeZen v1.1.1 — Multi-monitor screen comfort

EyeZen v1.1.1 addresses the gap in v1.1.0: warmth and intensity preferences were stored but did **not** change the desktop.

## New functionality

- On supported desktop sessions, enabling **Screen Comfort** creates one transparent, click-through tint window per operating-system-enumerated monitor.
- Warmth adjusts a bounded amber tint and intensity controls the strength of the tint and modest screen-darkening layer.
- Comfort changes, profile switches and settings restored after app restart update the overlay.
- Every 20 seconds while comfort is enabled, EyeZen rechecks monitor count, geometry and DPI-related placement to adapt to display changes.
- Turning comfort off, choosing **Color-accurate work**, closing the main EyeZen window or quitting the app removes the overlays.
- The system tray adds **Disable screen comfort** as an emergency action, blocking automatic re-application until the preference is switched off and on.
- The Displays screen now lists monitors actually reported by the OS and shows a separate overlay capability.

## What this feature does — and does not — change

The effect is **an on-screen visual tint**, not a physical monitor change. No gamma ramps, ICC profiles, display firmware, physical brightness/backlights, HDR mode, Night Light or Night Shift are changed. Applications in exclusive fullscreen or protected desktop contexts may appear above the overlay. Software screen tinting may alter perceived image colors: disable it for color-accurate photo/video work.

## OS support boundaries

| Session | Overlay implementation |
| --- | --- |
| Windows 10/11 desktop | Implemented with native transparent windows; requires user-device testing |
| macOS desktop | Implemented using Tauri's `macOSPrivateApi` transparent-window support; requires user-device testing; not suitable for Mac App Store distribution |
| Linux X11 | Experimental; depends on desktop compositor, transparency and click-through window support |
| Linux Wayland | **Unavailable**: general global window placement and always-on-top are not reliably permitted by compositors |
| Browser preview | **Unavailable**: cannot tint other desktop windows |

When window creation, cursor transparency or positioning fails, the command returns a failure and removes already-created EyeZen overlays rather than claiming success.

## Testing and release qualification

Automated Windows, macOS and Linux checks validate source, unit tests, Rust lint, and OS-specific installer creation. They **cannot certify** that overlays appear above every app/monitor, are click-through on all window managers, survive all multi-monitor setups or work during exclusive fullscreen. Test at least dual displays (including negative desktop coordinates and mixed DPI), hot-plug, suspend/resume, session switching, tray emergency stop, software crash, permissions and uninstall before claiming universal compatibility.

## Downloads

Unsigned packages are produced for Windows x64 (MSI), macOS Apple Silicon (DMG), Linux amd64 (DEB) and Linux x86_64 (RPM); SHA-256 verification hashes are attached with the release. Other OS/architecture combinations are not part of these builds.

EyeZen remains local-first and open source under MPL-2.0. Screen comfort software is not a medical device.
