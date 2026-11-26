# Independent preview installer verification

Use this tool to compare downloaded unsigned EyeZen preview installer ZIPs with the separately retained SHA256SUMS.txt archive from the **same candidate SHA and GitHub Actions run**. It never extracts or executes the installers, needs Python 3.8+ and uses only its standard library.

Download the Windows, macOS, Linux and checksums ZIPs separately. In the repository root run (one line on Windows, macOS or Linux):

```sh
python scripts/verify_preview.py --version 1.2.2 --manifest checksums.zip --windows windows.zip --macos macos.zip --linux linux.zip
```

Replace the example ZIP names with the actual downloaded paths. The command reports four installer names, their byte lengths and SHA-256 digests; a failure returns nonzero. It requires exactly the current x64 MSI, ARM64 DMG, AMD64 DEB and x86-64 RPM names for the specified version. It rejects missing, extra, duplicated, renamed or modified installer entries; unsafe paths, symlink and encrypted installer members; empty or greater-than-2-GiB packages; and invalid manifests. The limit and supported architecture inventory are intentional and must be reviewed if the build matrix changes.

This compares package bytes with the manifest, not the GitHub archive-level digests. Separately confirm the selected run/commit and GitHub's artifact digests. A matching manifest is not proof of signing, trusted publisher identity, reproducible builds, or actual hardware behavior. The manifest must come from a trusted run; replacing both payload and manifest could defeat a checksum-only comparison.

Run regression tests locally:

```sh
python -m unittest discover -s scripts -p test_verify_preview.py -v
```

Do not mark real-device acceptance complete based on this tool.
