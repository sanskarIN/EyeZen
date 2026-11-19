import console from "node:console";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";

export const RUSTIX_ADVISORY = "RUSTSEC-2026-0486";

function parseVersion(value) {
  if (typeof value !== "string") {
    throw new Error("Cargo.lock rustix version is missing");
  }
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value);
  if (!match) throw new Error("Cannot assess malformed rustix version: " + value);
  const release = match.slice(1, 4).map(Number);
  if (release.some(v => !Number.isSafeInteger(v))) {
    throw new Error("Cannot assess oversized rustix version: " + value);
  }
  return { release, prerelease: Boolean(match[4]) };
}

export function isAffectedRustixVersion(version) {
  const { release: [major, minor, patch], prerelease } = parseVersion(version);
  // RUSTSEC-2026-0486 affects versions >= 1.0.0 and < 1.1.6.
  // A prerelease of the first patched version is not a verified fix.
  return major === 1 && (minor === 0 || (minor === 1 && (patch < 6 || (patch === 6 && prerelease))));
}

export function checkRustixLock(source) {
  if (typeof source !== "string" || !/^version = 4\r?$/m.test(source) ||
      !source.includes("[[package]]")) {
    throw new Error("Expected a Cargo.lock v4 with package sections");
  }
  const sections = source.split(/\r?\n\[\[package\]\]\r?\n/).slice(1);
  if (!sections.length) throw new Error("No Cargo.lock packages found");
  const found = [];
  for (const block of sections) {
    const name = /^name = "([^"]+)"$/m.exec(block)?.[1];
    if (name !== "rustix") continue;
    const version = /^version = "([^"]+)"$/m.exec(block)?.[1];
    if (version === undefined) throw new Error("Locked rustix entry has no version");
    if (isAffectedRustixVersion(version)) {
      throw new Error(RUSTIX_ADVISORY + ": locked rustix@" + version + " is affected; require 1.1.6 or newer");
    }
    found.push(version);
  }
  return found;
}

const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    const file = process.argv[2] ?? fileURLToPath(new URL("../src-tauri/Cargo.lock", import.meta.url));
    const found = checkRustixLock(readFileSync(file, "utf8"));
    console.log("Checked " + found.length + " locked rustix package(s) against " +
      RUSTIX_ADVISORY + "; no versions in the affected range.");
  } catch (error) {
    console.error("::error::" + String(error));
    process.exitCode = 1;
  }
}
