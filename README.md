# EyeZen

**Your screen. Your comfort. Your environment.**

EyeZen is a privacy-focused, open-source desktop application for personalizing an on-screen workspace. It combines an expressive theme system, comfort preferences, workspace profiles, schedules, configurable break reminders, and accessibility settings.

> **Stable:** [v1.0.0](https://github.com/sanskarIN/EyeZen/releases/tag/v1.0.0). **In development:** [v1.1.0 on release-1.1.0](https://github.com/sanskarIN/EyeZen/tree/release-1.1.0). The 1.1.0 tag/installers are not published until review and a manually approved release workflow succeed.

## Overview

EyeZen is written in Rust, Tauri 2, TypeScript, React, and Vite. It runs locally and does not require an account, telemetry, location access, or a cloud backend.

The UI includes Dashboard, Eye Comfort, Themes, Profiles, Automation, Break Assistant, Displays, Accessibility, Settings, and About. It also has a first-run introduction, a local configuration file, native tray actions (Open/Quit, where supported), and optional session-only global dashboard shortcut registration.

## Implemented features

- Ten interface palettes: Light, Dark, System, Warm Dark, Warm Light, Sepia Reading, Midnight, AMOLED-Inspired, High Contrast, and Grayscale
- Application-wide theme tokens, accent colors, adjustable text size and motion reduction
- Nine initial profiles with editable names, themes, break preferences and desired comfort values
- Create, edit, apply, delete, import and export profiles as JSON
- Complete local configuration export/import, schema checks, atomic-ish persistence with recovery backup
- Priority-based day-of-week scheduling, overnight rules, manual override and runtime profile selection
- Configurable in-app break reminders, quiet hours, pause/resume and opt-in OS notifications (permissions permitting)
- Tauri capability report that accurately marks unsupported hardware/display integrations as unsupported
- Keyboard navigable controls, visible focus indicators, semantic forms and supported contrast themes
- Browser-preview support for exploring UI (preview configuration is intentionally not persisted)
- Rust core unit tests, TypeScript scheduling tests, GitHub Actions test/build workflows

## Important limitations

**EyeZen does not currently change physical monitor brightness, Windows Night light, macOS Night Shift, hardware color temperature, HDR, or ICC calibration.** The warmth/intensity sliders save *preferences* only. They do not pretend to be hardware controls. The Color-accurate work button disables EyeZen's own stored preferences, not any third-party or OS effects. It is not a guarantee that your display is calibrated.

The scheduler and reminder timer are driven by the running desktop window's JavaScript runtime in this version. Behavior while suspended, fully closed, or under restricted background execution is not guaranteed. Desktop hardware, wake/sleep, dual-display and notification integrations need real-world validation before being claimed as verified on particular systems.

This is customization software, **not a medical device**. No feature can guarantee prevention of eye disease or eliminate eye strain.

## Build from source

### Prerequisites

- Rust toolchain **1.90 or newer** and Cargo
- Node.js 22 or newer, npm
- Platform requirements for Tauri 2: the native webview, compiler/linker toolchain, and OS-specific SDKs
- Linux: WebKit2GTK 4.1 development package, GTK/AppIndicator/SSL development dependencies, and build tools
- macOS: Xcode Command Line Tools
- Windows: Microsoft C++ build tools and WebView2

See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for current OS requirements.

### Setup

~~~sh
git clone https://github.com/sanskarIN/EyeZen.git
cd EyeZen
git checkout release-1.1.0
npm install
npm run icons
npm run tauri dev
~~~

Native icons are generated locally from the tracked SVG source using the Tauri icon generator.

### Checks

~~~sh
npm run lint
npm run typecheck
npm run test
npm run build
cd src-tauri
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test
~~~

Build desktop bundles with **npm run tauri build**. GitHub Actions runs equivalent checks across OS targets; CI success alone is not the same as real hardware verification or a signed/approved release.

## Local data & privacy

Default data location is the OS's Tauri app configuration directory, under the identifier **in.sanskar.eyezen**, in a file named **settings.json**. A damaged file is moved to a timestamped corrupt backup before a fresh default is generated. Backups and profiles can be exported and imported manually. No network accounts or remote content are needed for core features.

Read [docs/privacy.md](docs/privacy.md) and [SECURITY.md](SECURITY.md).

## Architecture & platform support

- Frontend: React/TypeScript with modular services and CSS variables
- Backend: Tauri commands, Rust state models, strict local validation, persistence, pure scheduling helper and platform capability registry
- Native display adjustments: deliberately unsupported until vetted adapters are available

Read [docs/architecture.md](docs/architecture.md), [docs/platform-support.md](docs/platform-support.md), and [docs/testing.md](docs/testing.md).

## Roadmap

1. **v1.0.0:** initial tested core, explicit platform limitations, unsigned packaging through automated checks.
2. **v1.1.0:** profile/settings reliability, improved wake checks for reminders, optional timed pause; native background scheduling remains future work.
3. **v1.2.x+:** vetted per-platform display adapters, multi-monitor enumeration, hardware brightness where supported; zero fabricated successes.
4. **Future:** better theme composition, focus routines, color-accurate workflow safeguards, signed installers and community translations.

See [what_changed.md](what_changed.md) for current implementation status and blockers.

## Contributing, license & support

Contributions, accessibility testing and device-specific reports are welcome; read [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: [SECURITY.md](SECURITY.md).

**License:** [Mozilla Public License 2.0](LICENSE). Third-party packages retain their own licenses. Review dependency license obligations before distributing installer artifacts.

Developed openly at [sanskarIN/EyeZen](https://github.com/sanskarIN/EyeZen).
