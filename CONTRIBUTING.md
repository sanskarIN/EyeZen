# Contributing to EyeZen

Thanks for helping build a thoughtful, local-first desktop experience.

## Before submitting a change

- Open an issue describing a feature or bug and its supported OS/hardware.
- Avoid claims that a software overlay changes native color temperature or panel brightness.
- Ensure added permissions are justified, narrow and documented.
- Do not add analytics, network requirements, undisclosed usage tracking or private OS APIs.
- For platform-specific functionality, add a feature capability status and a reliable reset/recovery path.
- Write tests for core behavior and document scenarios that cannot be tested without hardware.

## Development

Run npm install, npm run icons, npm run lint, npm run typecheck, npm run test, npm run build.
In src-tauri run cargo fmt --all -- --check, cargo clippy --all-targets -- -D warnings, and cargo test.
Make changes in focused commits and open a PR to main. Include screenshots for UI updates and mention tested OS versions.

## Commit conventions

Use practical messages such as feat(profiles): add profile import, fix(schedule): handle overnight rules, docs: clarify macOS limitations. Accuracy and reviewability matter more than commit count.

## Licensing

New files are licensed under MPL-2.0 unless otherwise noted. Never add third-party assets without checking their license.
