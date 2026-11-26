"""Verify unsigned EyeZen preview archives without extracting or executing installers."""
import argparse
import hashlib
from pathlib import PurePosixPath
import re
import stat
import sys
from zipfile import ZipFile, BadZipFile

MAX_MANIFEST = 4096
MAX_INSTALLER = 2 * 1024**3
EXTENSIONS = {'.msi', '.dmg', '.deb', '.rpm'}


def expected_names(version):
    if not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+', version):
        raise ValueError('Expected numeric major.minor.patch version')
    return {
        'windows': {f'EyeZen_{version}_x64_en-US.msi'},
        'macos': {f'EyeZen_{version}_aarch64.dmg'},
        'linux': {f'EyeZen_{version}_amd64.deb', f'EyeZen-{version}-1.x86_64.rpm'},
    }


def regular_member(info):
    mode = stat.S_IFMT(info.external_attr >> 16)
    parts = info.filename.split('/')
    if (info.is_dir() or mode not in (0, stat.S_IFREG) or info.flag_bits & 1
            or '\\' in info.filename or any(p in ('', '.', '..') for p in parts)
            or ':' in info.filename):
        raise ValueError(f'Unsafe ZIP member: {info.filename!r}')


def read_manifest(archive, names):
    with ZipFile(archive) as z:
        entries = [i for i in z.infolist() if not i.is_dir()]
        if len(entries) != 1 or entries[0].filename != 'SHA256SUMS.txt':
            raise ValueError('Expected exactly one root SHA256SUMS.txt')
        info = entries[0]
        regular_member(info)
        if not 0 < info.file_size <= MAX_MANIFEST:
            raise ValueError('Invalid manifest size')
        with z.open(info) as f:
            content = f.read(MAX_MANIFEST + 1)
        if len(content) > MAX_MANIFEST:
            raise ValueError('Manifest too large')
        found = {}
        for line in content.decode('ascii').splitlines():
            match = re.fullmatch(r'([0-9a-fA-F]{64})  ([A-Za-z0-9._+-]+)', line)
            if not match:
                raise ValueError('Malformed checksum line')
            digest, name = match.groups()
            if name not in names or name in found:
                raise ValueError(f'Unexpected or duplicate manifest entry: {name}')
            found[name] = digest.lower()
        if found.keys() != names:
            raise ValueError('Manifest inventory incomplete')
        return found


def verify(version, manifest, archives):
    groups = expected_names(version)
    if archives.keys() != groups.keys():
        raise ValueError('Expected Windows, macOS and Linux archives')
    expected = read_manifest(manifest, set().union(*groups.values()))
    verified = {}
    for platform, archive in archives.items():
        found = set()
        with ZipFile(archive) as z:
            for info in z.infolist():
                name = PurePosixPath(info.filename).name
                if PurePosixPath(name).suffix.lower() not in EXTENSIONS:
                    continue
                regular_member(info)
                if name not in groups[platform] or name in found:
                    raise ValueError(f'Unexpected or duplicate {platform} installer: {name}')
                if not 0 < info.file_size <= MAX_INSTALLER:
                    raise ValueError(f'Invalid installer size: {name}')
                h = hashlib.sha256()
                size = 0
                with z.open(info) as f:
                    while chunk := f.read(1024 * 1024):
                        size += len(chunk)
                        if size > MAX_INSTALLER:
                            raise ValueError(f'Installer too large: {name}')
                        h.update(chunk)
                if size != info.file_size or h.hexdigest() != expected[name]:
                    raise ValueError(f'Checksum or size mismatch: {name}')
                found.add(name)
                verified[name] = (size, h.hexdigest())
        if found != groups[platform]:
            raise ValueError(f'Incomplete {platform} installer inventory')
    return verified


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ('version', 'manifest', 'windows', 'macos', 'linux'):
        parser.add_argument('--' + arg, required=True)
    args = parser.parse_args()
    try:
        results = verify(args.version, args.manifest, {
            p: getattr(args, p) for p in ('windows', 'macos', 'linux')})
    except (OSError, ValueError, BadZipFile, RuntimeError, NotImplementedError) as e:
        print(f'Verification failed: {e}', file=sys.stderr)
        return 1
    for name, (size, digest) in sorted(results.items()):
        print(f'{digest}  {name} ({size} bytes)')
    print('4/4 matched. Integrity only; not signature or hardware acceptance.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
