# Security Policy

## Supported releases

EyeZen v1.0.0 is a development release candidate. No stable version has been published or security-supported yet.

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
