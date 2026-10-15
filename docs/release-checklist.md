# v1.0.0 release gates

- [x] Initial Tauri/React/Rust source structure committed
- [x] UI sections exist and are connected to state
- [x] Local state validation and persistence implemented
- [x] Platform registry does not fabricate hardware support
- [x] Test suites and CI workflows added
- [x] MPL-2.0 license in repository
- [ ] Frontend lint, typecheck, tests and production build pass on final SHA
- [ ] Rust fmt, clippy, tests pass on final SHA
- [ ] Windows package installs and launches
- [ ] macOS bundle installs and launches
- [ ] Linux application installs and launches on representative supported distro
- [ ] Keyboard and assistive technology QA
- [ ] Schedule/break behavior validated across suspend/resume
- [ ] Third-party licenses and OS bundle assets reviewed
- [ ] Permissions and privacy review signed off
- [ ] Release packages signed/published or explicitly labeled as unsigned
- [ ] Final stable v1.0.0 tag created after all required checks

The automated release pipeline may publish unsigned bundles only after successful build, lint, and unit-test jobs. Manual OS installation, accessibility, hardware, suspend/resume, and signing gates are separately tracked and must not be described as complete without evidence.
