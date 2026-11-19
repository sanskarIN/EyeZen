import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// GHSA-g3hv-75wg-m249: minimatch >=7.0.0 and <11.0.1.
// This is a targeted, reproducible lockfile regression gate, not a replacement
// for current npm audits or a claim that the affected code is reachable.
export const MINIMATCH_ADVISORY = "GHSA-g3hv-75wg-m249";

function parseReleaseVersion(value) {
  if (typeof value !== "string") return null;
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value);
  if (!match) return null;
  const release = match.slice(1, 4).map(Number);
  if (release.some(part => !Number.isSafeInteger(part))) return null;
  return { release, prerelease: Boolean(match[4]) };
}

export function affectedMinimatchVersion(version) {
  const v = parseReleaseVersion(version);
  if (!v) throw new Error("Cannot assess malformed minimatch version: " + String(version));
  const [major, minor, patch] = v.release;
  return (major >= 7 && major < 11) ||
    (major === 11 && minor === 0 && (patch < 1 || (patch === 1 && v.prerelease)));
}

export function checkMinimatchLock(lock) {
  if (!lock || typeof lock !== "object" || lock.lockfileVersion !== 3 ||
      !lock.packages || typeof lock.packages !== "object" ||
      Array.isArray(lock.packages)) {
    throw new Error("Expected an npm lockfile v3 with a packages object");
  }

  const found = [];
  const affected = [];
  for (const [location, metadata] of Object.entries(lock.packages)) {
    if (!/(^|\/)node_modules\/minimatch$/.test(location)) continue;
    const version = metadata?.version;
    const item = { location, version };
    found.push(item);
    if (affectedMinimatchVersion(version)) affected.push(item);
  }
  if (affected.length > 0) {
    throw new Error(
      MINIMATCH_ADVISORY + ": affected locked minimatch package(s): " +
      affected.map(item => item.location + "@" + item.version).join(", ")
    );
  }
  return found;
}

const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    const lockPath = process.argv[2] ?? "package-lock.json";
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    const found = checkMinimatchLock(lock);
    console.log(
      "Checked " + found.length + " locked minimatch package(s) against " +
      MINIMATCH_ADVISORY + "; no versions in the affected range."
    );
  } catch (error) {
    console.error("::error::" + String(error));
    process.exitCode = 1;
  }
}
