# Security Policy

## Supported releases

EyeZen v1.2.0 is the latest published stable release. The v1.2.1 candidate is **not** a published stable release and remains subject to manual device, accessibility and security acceptance. There is no published long-term-support or guaranteed patch-lifetime policy.

## Reporting vulnerabilities

Report security issues privately through the repository's GitHub security advisory reporting feature if enabled. If private reporting is unavailable, open a minimal non-exploitable issue requesting a private contact method; **do not post working exploit details or private data publicly**.

## Security principles

- EyeZen must be usable offline, without an account or cloud endpoint.
- Tauri capabilities use least privilege. Do not enable arbitrary shell invocation or broad filesystem access.
- Profiles and settings imported from JSON must be bounded and structurally validated.
- No arbitrary code execution should be possible through themes or profile imports.
- Local configuration can contain user preferences: avoid collecting, logging or uploading it.
- Unsupported OS display APIs must not be driven through undocumented registry edits/private frameworks.
- Exit should not leave EyeZen-owned overlays or temporary modifications.
- Update dependencies regularly and scan for known vulnerabilities before release.
- Review weekly npm and RustSec reports from [Audit EyeZen dependencies](.github/workflows/security-audit.yml), including transitive dependencies and warnings.
- Record findings, exceptions and a maintainer decision before stable tagging; see the [v1.2.1 review](docs/security-review-v1.2.1.md).
- Never claim that a passing advisory scan is proof of binary signing, malware analysis or tested display behavior.
