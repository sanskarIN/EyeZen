import hashlib
from pathlib import Path
import stat
import tempfile
import unittest
from zipfile import ZipFile, ZipInfo
from verify_preview import expected_names, verify


class VerificationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.groups = expected_names('1.2.2')
        self.archives = {p: self.root / (p + '.zip') for p in self.groups}
        self.manifest = self.root / 'checksums.zip'
        self.files = {p: {n: n.encode() for n in names} for p, names in self.groups.items()}
        self.lines = [hashlib.sha256(b).hexdigest() + '  ' + n
                      for files in self.files.values() for n, b in files.items()]
        for p in self.groups:
            self.write_group(p, self.files[p])
        self.write_manifest(self.lines)

    def write_group(self, platform, files):
        with ZipFile(self.archives[platform], 'w') as z:
            for name, data in files.items():
                z.writestr(name, data)

    def write_manifest(self, lines):
        with ZipFile(self.manifest, 'w') as z:
            z.writestr('SHA256SUMS.txt', '\n'.join(lines) + '\n')

    def check(self):
        return verify('1.2.2', self.manifest, self.archives)

    def test_valid(self):
        self.assertEqual(len(self.check()), 4)

    def test_modified_payload(self):
        name = next(iter(self.groups['windows']))
        self.write_group('windows', {name: b'changed'})
        with self.assertRaisesRegex(ValueError, 'mismatch'):
            self.check()

    def test_duplicate_manifest(self):
        self.write_manifest(self.lines + [self.lines[0]])
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            self.check()

    def test_missing_manifest_entry(self):
        self.write_manifest(self.lines[:-1])
        with self.assertRaisesRegex(ValueError, 'incomplete'):
            self.check()

    def test_wrong_architecture(self):
        self.write_group('windows', {'EyeZen_1.2.2_arm64_en-US.msi': b'x'})
        with self.assertRaisesRegex(ValueError, 'Unexpected'):
            self.check()

    def test_missing_package(self):
        self.write_group('linux', {})
        with self.assertRaisesRegex(ValueError, 'Incomplete'):
            self.check()

    def test_traversal(self):
        name = next(iter(self.groups['windows']))
        self.write_group('windows', {'../' + name: name.encode()})
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            self.check()

    def test_symlink(self):
        name = next(iter(self.groups['windows']))
        info = ZipInfo(name)
        info.create_system = 3
        info.external_attr = (stat.S_IFLNK | 0o777) << 16
        with ZipFile(self.archives['windows'], 'w') as z:
            z.writestr(info, name.encode())
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            self.check()

    def test_duplicate_nested_installer(self):
        name = next(iter(self.groups['windows']))
        self.write_group('windows', {name: name.encode(), 'nested/' + name: name.encode()})
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            self.check()

    def test_extra_installer(self):
        self.write_group('windows', {**self.files['windows'], 'other.msi': b'x'})
        with self.assertRaisesRegex(ValueError, 'Unexpected'):
            self.check()

    def test_bad_manifest_line(self):
        self.write_manifest(['broken'] + self.lines)
        with self.assertRaisesRegex(ValueError, 'Malformed'):
            self.check()

    def test_unsafe_version(self):
        with self.assertRaises(ValueError):
            expected_names('../1.2.2')


if __name__ == '__main__':
    unittest.main()
