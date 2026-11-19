# TypeScript-ESLint / minimatch advisory remediation (development main candidate)

**Date:** 2026-11-19  
**Scope:** npm development tooling and its resolved lockfile; no desktop runtime or stable-release changes.

## Problem

GitHub [issue #37](https://github.com/sanskarIN/EyeZen/issues/37) tracks moderate advisory [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), which affects `minimatch >=7.0.0 <11.0.1` in its described input/glob conditions. The prior `typescript-eslint 8.71.2` resolution brought in nested `minimatch 10.2.6`. A Dependabot run could not independently cross the dependency's then-current major-version constraint. Presence of an affected package does not establish exploitable application behavior; the affected package is in development/build tooling rather than an identified shipped browser dependency.

## Changes

- Raise `typescript-eslint`'s direct development dependency minimum from `^8.0.0` to `^8.73.0`. Upstream `@typescript-eslint/typescript-estree 8.73.0` accepts patched `minimatch ^11.0.1`.
- Regenerate the npm v3 lockfile with npm 10 / Node.js 22, using `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`. The reviewed resolution is `typescript-eslint 8.73.0` / nested `minimatch 11.0.9`.
- The separate top-level `minimatch 3.1.5` copy is below the advisory's lower bound; it is not the affected 10.x copy and does not need a major-incompatible override.
- Add `npm run check:minimatch` to reject affected locked 7.x–10.x and 11.0.0 copies (including a pre-release of 11.0.1), reporting affected paths. Keep the normal npm advisory audit for other known vulnerabilities.

The temporary, read-only GitHub Actions lockfile generator succeeded in [run 44522855626](https://github.com/sanskarIN/EyeZen/actions/runs/44522855626). It regenerated the lockfile, ran `npm ci --ignore-scripts`, and checked for remaining affected `minimatch` copies. It was used only on the isolated security branch and is removed before the permanent pull request.

## Required review before merge / issue closure

- [ ] Verify the **final PR SHA** passes CI: npm CI install, release-version parity, lint, TypeScript, Vitest, Vite bundle, and native Windows/macOS/Linux builds/tests.
- [ ] Inspect the separate `Audit EyeZen dependencies` workflow's all-dependency and production-only npm audit JSON for advisory IDs, severities and actual resolved paths. High/critical failure thresholds do not mean a successful run has zero moderate issues.
- [ ] Review whether any other unrelated development dependencies remain in the advisory graph; document rather than mask residual findings.
- [ ] If successful, close issue #37 with links to the merge commit, build run, audit run and exact version resolution.

**Limitations:** This remediation applies to a tracked npm advisory in development tooling. It does not clear RustSec issue #29, prove physical display/tray behavior (issue #18), guarantee that live advisory databases remain unchanged, or approve a new stable release.
