import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { it as test } from "vitest";
import { verifyReleaseAssets } from "./verify-release-assets.mjs";

const GROUPS = {
  windows: ["msi"],
  macos: ["dmg"],
  linux: ["deb", "rpm"],
};
const group = (root, platform) => path.join(root, "eyezen-1.2.1-" + platform + "-unsigned");
const installer = (root, platform, type) =>
  path.join(group(root, platform), "EyeZen_1.2.1_" + platform + "." + type);

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), "eyezen-assets-"));
  try {
    for (const [platform, extensions] of Object.entries(GROUPS)) {
      await mkdir(group(root, platform), { recursive: true });
      for (const extension of extensions) {
        await writeFile(installer(root, platform, extension), platform + "-" + extension);
      }
    }
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("accepts all four package types and emits portable, correct checksums", async () => {
  await fixture(async root => {
    const result = await verifyReleaseAssets(root, "1.2.1", true);
    assert.equal(result.installers.length, 4);
    const recorded = await readFile(path.join(root, "SHA256SUMS.txt"), "utf8");
    assert.equal(recorded, result.checksums);
    const paths = (await readFile(path.join(root, "release-assets.nul"), "utf8"))
      .split("\0").filter(Boolean);
    assert.equal(paths.length, 4);
    for (const filename of paths) {
      const payload = await readFile(filename);
      const checksum = createHash("sha256").update(payload).digest("hex");
      assert.ok(recorded.includes(checksum + "  " + path.basename(filename) + "\n"));
      assert.ok(!recorded.includes(path.dirname(filename)));
    }
  });
});

test("refuses missing platform package and missing artifact group", async () => {
  await fixture(async root => {
    await rm(installer(root, "linux", "rpm"));
    await assert.rejects(verifyReleaseAssets(root, "1.2.1"), /Missing RPM/);
    await rm(group(root, "macos"), { recursive: true });
    await assert.rejects(verifyReleaseAssets(root, "1.2.1"), /Missing required macos/);
  });
});

test("refuses duplicate types rather than only counting files", async () => {
  await fixture(async root => {
    await writeFile(path.join(group(root, "windows"), "EyeZen_1.2.1_duplicate.msi"), "duplicate");
    await assert.rejects(verifyReleaseAssets(root, "1.2.1"), /Duplicate installer/);
  });
});

test("refuses wrong platform, mismatched version and empty assets", async () => {
  await fixture(async root => {
    await writeFile(path.join(group(root, "windows"), "EyeZen_1.2.1.deb"), "wrong platform");
    await assert.rejects(verifyReleaseAssets(root, "1.2.1"), /Unexpected deb/);
  });
  await fixture(async root => {
    await rename(installer(root, "macos", "dmg"),
      path.join(group(root, "macos"), "EyeZen_1.2.0_macos.dmg"));
    await assert.rejects(verifyReleaseAssets(root, "1.2.1"), /mismatched version/);
  });
  await fixture(async root => {
    await writeFile(installer(root, "windows", "msi"), "");
    await assert.rejects(verifyReleaseAssets(root, "1.2.1"), /nonempty regular file/);
  });
  await fixture(async root => {
    await rename(installer(root, "macos", "dmg"),
      path.join(group(root, "macos"), "EyeZen_1.2.1.2_macos.dmg"));
    await assert.rejects(verifyReleaseAssets(root, "1.2.1"), /mismatched version/);
  });
});

test("never follows symlinked release packages", async () => {
  await fixture(async root => {
    const filename = installer(root, "linux", "deb");
    await rm(filename);
    const target = path.join(root, "outside.txt");
    await writeFile(target, "untrusted");
    await symlink(target, filename);
    await assert.rejects(verifyReleaseAssets(root, "1.2.1"), /Missing DEB/);
  });
});

test("rejects invalid version argument without making output files", async () => {
  await fixture(async root => {
    await assert.rejects(verifyReleaseAssets(root, "v1.2.1", true), /exact numeric/);
    await assert.rejects(readFile(path.join(root, "SHA256SUMS.txt")), /ENOENT/);
  });
});
