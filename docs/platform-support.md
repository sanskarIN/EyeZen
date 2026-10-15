# Platform support and screen comfort capability

EyeZen v1.1.1 introduces an opt-in **screen-wide visual tint overlay**. It is **not** a hardware brightness or color-temperature control.

| Feature | Windows | macOS | Linux X11 | Linux Wayland |
| --- | --- | --- | --- | --- |
| Interface themes and local profiles | Implemented | Implemented | Implemented | Implemented |
| Profile-based screen comfort | Implemented using transparent window overlays | Implemented using transparent window overlays (private API) | Experimental; compositor-dependent | Unsupported |
| Multiple detected monitor tint windows | Implemented; real-device validation required | Implemented; real-device validation required | Experimental; physical positioning not uniform | Unsupported |
| Screen monitor enumeration | Tauri OS API | Tauri OS API | Tauri OS API | May enumerate but cannot guarantee placement |
| Click-through input safety | Required; fail closed on error | Required; fail closed on error | Required; fail closed on error | Not attempted |
| Physical monitor brightness/backlight | Unsupported | Unsupported | Unsupported | Unsupported |
| Calibrated hardware color temperature / ICC | Unsupported | Unsupported | Unsupported | Unsupported |
| HDR-specific or fullscreen-exclusive tint | Not guaranteed | Not guaranteed | Not guaranteed | Not guaranteed |
| OS notifications / tray shortcuts | Plugin-dependent | Plugin-dependent | Environment-dependent | Environment-dependent |

The overlays are local transparent windows, with conservative alpha strength. They do not change gamma ramps, OS Night Light or Night Shift, external monitor controls or calibration profiles. Enabling comfort can change the *perceived color* of other applications and should be disabled before color-sensitive work.

## Safety and recovery

- Turning Screen Comfort off, selecting **Color-accurate work**, and quitting/closing the main app remove the overlays.
- The EyeZen tray offers **Disable screen comfort** for immediate removal. It prevents an automatic timer refresh from silently restoring tint; the preference must be turned off and then on to resume.
- If an overlay cannot become click-through, be positioned, sized or rendered, EyeZen removes its overlays and reports an error.
- Overlay refresh is active while the EyeZen process is running; it is not an OS service and does not modify hardware.
- Wayland sessions are explicitly not supported because unprivileged apps generally cannot guarantee cross-app global overlays.
- macOS transparency uses Tauri `macOSPrivateApi`, disallowing Mac App Store distribution through standard rules. This does not affect the standalone unsigned DMG build.

## Acceptance testing needed

CI compilation and unit tests **are not proof of actual screen-overlay behavior** on real equipment. Tests on physical Windows/macOS/Linux desktop systems are needed for: single and mixed-DPI dual monitors, negative display coordinates, hot-plug, suspend/resume, color-critical workflows, clicks/typing through the overlay, fullscreen, cursor behavior, OS permission prompts, uninstall and crash cleanup.

Read [v1.1.1 release notes](release-notes-v1.1.1.md) for the implementation boundaries.
