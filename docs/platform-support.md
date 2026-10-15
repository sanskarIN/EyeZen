# Platform support and honest capabilities

**Status:** OS targets are intended; no OS/hardware environment is declared verified for v1.0.0 stable. Automated CI is not real-hardware acceptance testing.

| Capability | Windows 10/11 | macOS | Linux X11 / Wayland |
| --- | --- | --- | --- |
| EyeZen interface themes | Implemented in application | Implemented in application | Implemented in application |
| Local config and profiles | Implemented; needs validation | Implemented; needs validation | Implemented; needs validation |
| Schedule rules | Implemented while runtime active | Implemented while runtime active | Implemented while runtime active |
| OS notifications | Through permissioned Tauri plugin; unverified | Through permissioned Tauri plugin; unverified | Through permissioned Tauri plugin; unverified |
| Basic tray Open/Quit | Tauri tray integration; unverified | Tauri tray integration; unverified | Varies by desktop environment; unverified |
| Global dashboard shortcut | Tauri plugin; conflicts may prevent registration | Tauri plugin; conflicts may prevent registration | Varies by compositor/desktop; unverified |
| Physical brightness | **Unsupported** | **Unsupported** | **Unsupported** |
| Native color temperature | **Unsupported** | **Unsupported** | **Unsupported** |
| Physical display enumeration | **Unsupported** | **Unsupported** | **Unsupported** |
| Hardware-specific multi-monitor control | **Unsupported** | **Unsupported** | **Unsupported** |
| Custom overlay | Not implemented | Not implemented | Not implemented |

## Notes

Windows Night light is not controlled by undocumented registry access. macOS Night Shift is not controlled through private frameworks. Wayland compositors may reject integrations that work under X11. Many external displays cannot be controlled through generic brightness APIs.

If no supported backend exists, the application states so and does not fake success. Profile warmth/intensity values are preferences and have no immediate hardware effect.

Before promising support in a release, test the exact OS version, built-in/external monitor arrangement, display permissions, HDR/color management path, startup and shutdown recovery, sleep/wake, tray and notification availability.

## Packaging

Tauri can generate bundles for each configured target, subject to appropriate runners and toolchains. Unsigned CI bundle artifacts are not signed distributable releases. Verify built artifacts, installation/uninstallation, code signing and malware-scanner behavior before a stable tag.
