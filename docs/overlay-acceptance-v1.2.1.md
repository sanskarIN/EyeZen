# EyeZen — Native overlay acceptance checklist

**Tested commit:** _fill in before signing off_  
**Tester / date:** _fill in_  
**Platform / session:** _Windows, macOS, Linux X11, Linux Wayland_  
**Monitor setup:** _count, resolution, scale, relative positions, primary monitor_

EyeZen overlays are click-through windows, not hardware brightness, calibrated color temperature or medical treatment. Passing Rust/CI tests does **not** complete this physical-device checklist.

## Real-monitor scenarios

| Scenario | Expected result | Result / evidence |
| --- | --- | --- |
| Enable screen comfort | Tint appears on each supported enumerated monitor | Pending |
| Move mouse and interact with other programs | Overlay does not intercept clicks, typing, scroll or drag | Pending |
| Change warmth and intensity | Visual tint changes predictably; no flashing/occlusion | Pending |
| Unplug the secondary monitor | Stale overlay windows are retired on next refresh | Pending |
| Reconnect or move monitor left/up | Overlay aligns with negative coordinates and mixed DPI | Pending |
| Change display resolution/scaling | Overlay realigns correctly after periodic refresh | Pending |
| Suspend, resume and lock/unlock | No stuck opaque window or unusable desktop | Pending |
| Disable setting | All EyeZen tint windows disappear | Pending |
| Emergency tray disable | All overlays disappear and remain off until deliberate re-enable | Pending |
| Close main EyeZen window / quit | Tint is removed without leaving desktop overlays behind | Pending |
| Permission/windowing failure | Status explains failure; all prior EyeZen overlays are removed | Pending |
| Color-accurate work mode | Visible tint is turned off without changing OS color calibration | Pending |
| Fullscreen app and HDR | Document if overlays are behind fullscreen surfaces | Pending |
| Linux Wayland | Report unsupported; never claim desktop-wide tint | Pending |

## Report a failure

Include OS build, window manager/compositor, monitor models and connection type (if known), refresh rate/scaling, app version and commit, reproduction steps, observed versus expected effect, and whether the tray emergency action worked. Do not include sensitive desktop screenshots without redacting private content.

## Before v1.2.1 stable

- Verify the overlay code's fail-closed path on error (automated tests only cover pure logic).
- Preserve the emergency-off behavior.
- Review this matrix on real devices; record actual results rather than marking CI-only checks as completed.
