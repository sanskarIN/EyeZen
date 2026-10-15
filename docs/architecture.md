# Architecture

EyeZen uses a **Tauri 2 desktop shell** with a React/TypeScript view and Rust backend. The frontend may represent user preferences but cannot claim privileged display operations succeeded without native confirmation.

## Data flow

1. On startup the React app calls Tauri command load_state and get_platform_report.
2. The backend reads versioned JSON from the Tauri app configuration directory, validates it, and returns a typed EyeZenState.
3. React owns temporary UI form state and invokes save_state whenever a user setting changes.
4. Rust validates the full settings object, serializes JSON and persists through a temporary file plus rename. A save mutex serializes application writes.
5. UI status is derived from the actual PlatformReport, not made-up hardware measurements.
6. matching_schedule computes the highest-priority active schedule according to the local system time. In this candidate, the frontend polls it while the webview is running.
7. Screen-break timers run in the UI process. Optional native notifications require OS permission and use the Tauri notification plugin.

## Modules

| Path | Responsibility |
| --- | --- |
| src/App.tsx | Navigation and application feature views |
| src/types.ts | Typed UI/backend wire models |
| src/defaults.ts | Default UI state and theme tokens |
| src/services/native.ts | Tauri command boundaries and clearly labeled browser preview |
| src/services/schedule.ts | Frontend schedule semantics and quiet-hour checks |
| src/services/imports.ts | Bounded JSON file import/export validation |
| src/components/ui.tsx | Accessible UI controls |
| src/styles.css | Responsive layout and theme tokens |
| src-tauri/src/models.rs | Serde configuration models and validation |
| src-tauri/src/storage.rs | Configuration persistence, recovery and basic backup |
| src-tauri/src/scheduler.rs | Pure schedule decision logic |
| src-tauri/src/platform.rs | Platform capability registry and unsupported operation response |
| src-tauri/src/lib.rs | Tauri setup, commands, basic tray integration |

## Trust boundaries

Do not trust imported profiles or backups; validate file size, model shape, identifiers, range constraints, clock formats and cross-references. The Rust backend validates before writing. Do not allow HTML scripts, remote data, shell code or opaque command definitions into theme/profile values.

The Tauri capability manifest enables only core permissions, notifications and explicit shortcut commands. No privileged filesystem plugin, shell execution plugin or remote content loader is enabled.

## Schemas / versioning

EyeZenState.schemaVersion currently equals 1. The app rejects newer unsupported schema versions, rather than silently applying incompatible configuration. Before adding new fields or versions, implement an explicit migration with tests. Invalid local settings are moved into a timestamped backup before defaults are restored.

## Scheduler rules

- Weekdays use Monday=0 to Sunday=6.
- Start is inclusive; end is exclusive.
- Rules with start after end cross midnight and respect the starting day's selection.
- Highest integer priority wins; stable tie break picks the lexicographically smaller rule ID.
- Manual override disables rule application until explicitly turned off.
- Schedule evaluation currently depends on the running UI; reliable sleep/wake/missed transition support needs native background scheduling.

## Integration evolution

OS display APIs must live behind explicit capability guards. Add Windows, macOS and Linux adapters only after verifying their supported public APIs, real hardware behavior, precise errors and reversal behavior. Distinguish GUI-only overlays from panel/native backends. No current platform adapter applies display adjustments.
