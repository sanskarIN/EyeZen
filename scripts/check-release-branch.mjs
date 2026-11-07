import console from "node:console";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * Only a release branch for the exact candidate version may contribute
 * installer artifacts. A descriptive suffix must be nonempty and cannot
 * introduce another path component.
 */
export function matchesReleaseBranch(branch, version) {
  if (typeof branch !== "string" || typeof version !== "string" ||
      !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)) return false;

  const match = /^release\/v?([0-9]+\.[0-9]+\.[0-9]+)(?:-([A-Za-z0-9][A-Za-z0-9._-]*))?$/.exec(branch);
  return match?.[1] === version;
}

const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const [branch, version] = process.argv.slice(2);
  if (!matchesReleaseBranch(branch, version)) {
    console.error(`::error::Release branch ${branch ?? "(missing)"} does not match candidate version ${version ?? "(missing)"}`);
    process.exitCode = 1;
  }
}
