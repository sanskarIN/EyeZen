# EyeZen v1.2.2 — RustSec warning disposition and targeted rustix patch

**Review date:** 2026-11-19  
**Evidence:** [Candidate audit run 44550117397](https://github.com/sanskarIN/EyeZen/actions/runs/44550117397) on `3b80100cc562f0e14e95c3e29a96cc29e1e66e3a`; independently downloaded `eyezen-cargo-audit` archive and parsed the actual `cargo-audit.json`. This is a **source/lockfile security review**, not a claim of hardware or runtime certification.

## Findings from the actual locked candidate

The audit reported **zero vulnerability entries** but **eight warning entries**, including findings that were not present in the earlier October v1.2.1 review:

| Kind | Crate | Locked version | Advisory / interpretation |
| --- | --- | --- | --- |
| Unsound | `rustix` | 1.1.5 | [RUSTSEC-2026-0486](https://rustsec.org/advisories/RUSTSEC-2026-0486.html); zero-length extended-attribute buffer initialization bug, **patched in 1.1.6** |
| Unsound | `glib` | 0.18.5 | [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html); `VariantStrIter`, patched in >=0.20; requires GTK/Tauri compatibility evaluation |
| Unmaintained | `chrono` | 0.4.45 | [RUSTSEC-2026-0543](https://rustsec.org/advisories/RUSTSEC-2026-0543.html); direct EyeZen dependency, no patched chrono version; evaluate migration to actively maintained time library |
| Unmaintained | `proc-macro-error` | 1.0.4 | [RUSTSEC-2024-0370](https://rustsec.org/advisories/RUSTSEC-2024-0370.html); GTK build/macro chain |
| Unmaintained | `zbus_names` | 4.3.4 | [RUSTSEC-2026-0371](https://rustsec.org/advisories/RUSTSEC-2026-0371.html); transitive notification/zbus chain |
| Unmaintained | `zvariant` | 5.15.0 | [RUSTSEC-2026-0370](https://rustsec.org/advisories/RUSTSEC-2026-0370.html); transitive notification/zbus chain |
| Unmaintained | `zvariant_derive` | 5.15.0 | [RUSTSEC-2026-0372](https://rustsec.org/advisories/RUSTSEC-2026-0372.html); transitive notification/zbus chain |
| Yanked | `async-executor` | 1.14.0 | Crates.io yanked entry; inspect parent dependencies and compatible maintained resolutions, do not automatically infer a confirmed runtime exploit |

## Remediation in the targeted security PR

- Run official `cargo update --manifest-path src-tauri/Cargo.toml -p rustix --precise 1.1.6` in a **read-only GitHub Actions** review job: [run 44554339038](https://github.com/sanskarIN/EyeZen/actions/runs/44554339038).
- Commit the exact generated Cargo.lock. Independently downloaded the generator's output and compared its **Git blob SHA-1** to the committed GitHub blob; both matched `b89c5b18c30f9e69151c76b2e0b322668a8d4b5c` (byte-for-byte identical).
- Cargo's resolution also selects `syn 2.0.119` in `cssparser-macros` and `windows-sys 0.59.0` for six compatible dependent edges. These are **not hidden**; all affected platform builds must be rerun.
- Add a CLI/Vitest regression gate rejecting any locked `rustix >=1.0.0 <1.1.6`, and execute it in standard CI, RustSec workflow, and manually gated publisher.

This patch resolves the **known locked rustix warning** only after the updated source passes all platform checks and a fresh advisory scan. Presence of `rustix` or a warning alone does not prove exploitability in EyeZen. The separate GTK, time, yanked and zbus issues are not silently closed.

## New URL advisory and 23 November re-audit

- [RustSec RUSTSEC-2026-0592](https://rustsec.org/advisories/RUSTSEC-2026-0592.html) was issued on 2026-11-22. The locked candidate `url 2.5.8` is in the affected range (fixed in 2.5.9). Nested `blob:` origins can trigger an excessive recursion/stack-overflow condition if affected APIs are invoked.
- The fresh [candidate RustSec run 45126621378](https://github.com/sanskarIN/EyeZen/actions/runs/45126621378) returned a failed Cargo audit step on 2026-11-23. It did **not** pass the full release gate; download the retained JSON to confirm the exact full finding inventory rather than inferring it from a step's exit code alone.
- The targeted URL security patch regenerates `src-tauri/Cargo.lock` with the **official Cargo CLI**: `url 2.5.9` and compatible `form_urlencoded 1.2.3`. A temporary generator workflow was removed after producing the lockfile.
- A tested `check:url` guard rejects locked versions before 2.5.9 in CI, RustSec audit, and the manual publisher. Repeat the independent Cargo audit on the final exact candidate SHA; **do not mark this finding closed just because the lockfile was edited**.

## Remaining release/security decision

- [ ] Final patched source passes npm lint/types/Vitest/build and Rust fmt/Clippy/tests/unsigned packages on Windows, macOS and Linux; archive SHA-256 inventory independently reviewed
- [ ] Fresh `cargo-audit.json` confirms no `RUSTSEC-2026-0486` for locked rustix and enumerates remaining warnings
- [ ] Use target-filtered Cargo dependency trees and inspect any GTK/WebKit `VariantStrIter` calls; do not force incompatible `glib 0.20` through GTK 0.18
- [ ] Evaluate replacement of EyeZen's direct `chrono` use with `jiff` or `time` in a separately tested change; note transitive chrono dependencies if any
- [ ] Evaluate the yanked `async-executor 1.14.0` with upstream resolution and assess supported notification/zbus migration
- [ ] Review native licenses, permissions/CSP and signed package plans
- [ ] Record maintainer risk acceptance for deferred informational warnings in [issue #29](https://github.com/sanskarIN/EyeZen/issues/29) and [v1.2.2 acceptance issue #50](https://github.com/sanskarIN/EyeZen/issues/50), **before approving stable publication**

**Never equate a green `cargo audit` run with zero warnings.** Its current configured policy distinguishes reported vulnerabilities from warnings; inspect the retained JSON.
