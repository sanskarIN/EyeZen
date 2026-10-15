# EyeZen v1.2.0 — Complete features and support matrix

| Feature / scope | Browser web edition | Windows desktop | macOS desktop | Linux X11 | Linux Wayland |
|---|---|---|---|---|---|
| Dashboard and quick profile switching | Yes | Yes | Yes | Yes | Yes |
| 10 interface themes and system preference | Yes | Yes | Yes | Yes | Yes |
| Accent color, adjustable text, reduced motion | Yes | Yes | Yes | Yes | Yes |
| 9 starter profiles and custom profiles | Yes | Yes | Yes | Yes | Yes |
| Profile create, edit, apply and delete | Yes | Yes | Yes | Yes | Yes |
| JSON profile import/export | Yes | Yes | Yes | Yes | Yes |
| Full settings JSON import/export | Yes | Yes | Yes | Yes | Yes |
| Persistent local settings | Same-origin browser storage | OS JSON | OS JSON | OS JSON | OS JSON |
| Schedule rules by weekday and local clock | Running tab | Running app | Running app | Running app | Running app |
| Overnight schedule & priority tie break | Yes | Yes | Yes | Yes | Yes |
| Manual schedule override | Yes | Yes | Yes | Yes | Yes |
| Break reminders / quiet hours / pause timer | Running tab | Running app | Running app | Running app | Running app |
| OS/browser notifications | Permission-dependent | Permission-dependent | Permission-dependent | Environment-dependent | Environment-dependent |
| In-app comfort preference sliders | Preference only | Preference + visual overlay | Preference + visual overlay | Preference + experimental overlay | Preference only |
| Desktop-wide reversible visual screen tint | No | Implemented, real-device acceptance needed | Implemented, real-device acceptance needed | Experimental / compositor-dependent | Unsupported |
| OS monitor enumeration | No | Via Tauri OS API | Via Tauri OS API | Tauri OS API | Environment-dependent |
| Tray emergency comfort disable | No | Yes | Yes | Environment-dependent | Environment-dependent |
| Global keyboard shortcut | No | Optional / OS-dependent | Optional / OS-dependent | Environment-dependent | Environment-dependent |
| Physical hardware brightness or OS night mode | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported |
| ICC / HDR / calibrated color temperature | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported |
| Cloud sync, accounts, analytics | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented |

## Main app sections
- **Dashboard:** Quick overview and profile selection.
- **Eye Comfort:** Warmth/intensity preferences and, on supported desktop sessions, actual overlay status.
- **Theme Studio:** Ten preset palettes and accent.
- **Profiles:** Nine starter work modes and editable user profiles.
- **Automation:** Priority rules and overnight schedules.
- **Break Assistant:** Optional reminders, notifications, pause countdown.
- **Displays:** Actual desktop monitor list and capability registry; browser cannot enumerate physical monitors.
- **Accessibility:** Reduced motion, text scaling and contrast options.
- **Settings:** Restore defaults, onboarding, imports/exports, desktop shortcut.
- **About:** Local-first, source, license and limitations.

## Desktop distribution

CI targets unsigned Windows x64 MSI, macOS Apple Silicon DMG, Linux amd64 DEB and Linux x86_64 RPM. Building a package does not prove feature compatibility with every physical monitor, OS version or window manager. macOS screen overlays use Tauri's private transparency APIs; ordinary Mac App Store distribution is not supported by that feature. Linux X11 overlays are experimental; Wayland global overlay is not supported.

## See also
[Web guide](web-edition.md) · [Platform details](platform-support.md) · [Test guidance](testing.md) · [Release notes](release-notes-v1.2.0.md)
