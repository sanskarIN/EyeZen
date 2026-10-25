import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const PLATFORMS = {
  windows: ["msi"],
  macos: ["dmg"],
  linux: ["deb", "rpm"],
};
const EXTENSIONS = new Set(Object.values(PLATFORMS).flat());

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      // Never follow links in downloaded artifacts (which could escape the root).
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...await filesUnder(location));
    } else if (entry.isFile()) {
      files.push(location);
    }
  }
  return files;
}

async function sha256(filename) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest("hex");
}

/**
 * Fail closed unless the release contains precisely one expected package
 * per platform/type. Checksum lines refer to download filenames, not
 * ephemeral CI directories, so they work with "sha256sum -c" after download.
 */
export async function verifyReleaseAssets(artifactDirectory, version, writeManifests = false) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("Expected an exact numeric release version, e.g. 1.2.1.");
  }
  const root = path.resolve(artifactDirectory);
  const versionPattern = new RegExp("(^|[_-])" + version.replaceAll(".", "\\.") + "(?=[_-]|\\.(?:msi|dmg|deb|rpm)$)");
  const installers = [];
  const names = new Set();

  for (const [platform, expectedExtensions] of Object.entries(PLATFORMS)) {
    const group = path.join(root, "eyezen-" + version + "-" + platform + "-unsigned");
    const groupInfo = await lstat(group).catch(() => {
      throw new Error("Missing required " + platform + " artifact group.");
    });
    if (!groupInfo.isDirectory() || groupInfo.isSymbolicLink()) {
      throw new Error("Expected a real directory for " + platform + " artifacts.");
    }
    const found = new Map();
    for (const filename of await filesUnder(group)) {
      const basename = path.basename(filename);
      const extension = path.extname(basename).slice(1).toLowerCase();
      if (!EXTENSIONS.has(extension)) continue;
      if (!expectedExtensions.includes(extension)) {
        throw new Error("Unexpected " + extension + " package in " + platform + " artifacts.");
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(basename) || !versionPattern.test(basename)) {
        throw new Error("Unsafe filename or mismatched version: " + basename);
      }
      if (found.has(extension) || names.has(basename.toLowerCase())) {
        throw new Error("Duplicate installer type or filename: " + basename);
      }
      const info = await lstat(filename);
      if (!info.isFile() || info.size === 0) {
        throw new Error("Installer must be a nonempty regular file: " + basename);
      }
      found.set(extension, filename);
      names.add(basename.toLowerCase());
    }
    for (const extension of expectedExtensions) {
      if (!found.has(extension)) {
        throw new Error("Missing " + extension.toUpperCase() + " installer for " + platform + ".");
      }
      installers.push(found.get(extension));
    }
  }

  if (installers.length !== 4) throw new Error("Expected exactly four platform installers.");
  installers.sort((a, b) => path.basename(a).localeCompare(path.basename(b), "en"));
  const lines = [];
  for (const installer of installers) {
    lines.push((await sha256(installer)) + "  " + path.basename(installer));
  }
  const checksums = lines.join("\n") + "\n";
  if (writeManifests) {
    await writeFile(path.join(root, "SHA256SUMS.txt"), checksums, { flag: "w" });
    await writeFile(path.join(root, "release-assets.nul"), installers.join("\0") + "\0", { flag: "w" });
  }
  return { installers, checksums };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  verifyReleaseAssets(process.argv[2] ?? "artifacts", process.argv[3] ?? "", true)
    .then(({ installers }) => {
      process.stdout.write("Validated MSI, DMG, DEB, RPM and generated SHA256SUMS.txt for " +
        installers.length + " release assets.\n");
    })
    .catch(error => {
      process.stderr.write("Release asset verification failed: " + String(error) + "\n");
      process.exitCode = 1;
    });
}
