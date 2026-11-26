import console from "node:console";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const COMMIT_SHA = /^[0-9a-f]{40}$/;

/**
 * Manual publication must be tied to the exact reviewed main commit.
 * A PR/branch dispatch or a stale SHA must never publish an installer.
 */
export function validateReleaseAuthorization({
  ref,
  sha,
  reviewedSha,
  publish,
  acceptance,
  version,
}) {
  if (ref !== "refs/heads/main") {
    throw new Error("Stable publication is allowed only from main.");
  }
  if (version !== "1.2.2") {
    throw new Error("This publisher is restricted to EyeZen v1.2.2.");
  }
  if (publish !== "PUBLISH" || acceptance !== "REVIEWED") {
    throw new Error("Explicit PUBLISH and REVIEWED confirmations are required.");
  }
  if (typeof sha !== "string" || !COMMIT_SHA.test(sha) ||
      typeof reviewedSha !== "string" || !COMMIT_SHA.test(reviewedSha) ||
      sha !== reviewedSha) {
    throw new Error("The exact reviewed 40-character commit SHA must match this workflow run.");
  }
  return true;
}

const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    validateReleaseAuthorization({
      ref: process.env.GITHUB_REF,
      sha: process.env.GITHUB_SHA,
      reviewedSha: process.env.CONFIRM_SHA,
      publish: process.env.CONFIRM_RELEASE,
      acceptance: process.env.CONFIRM_ACCEPTANCE,
      version: process.env.RELEASE_VERSION,
    });
    console.log("EyeZen v1.2.2: explicit publication guard passed for " + process.env.GITHUB_SHA);
  } catch (error) {
    console.error("::error::" + String(error));
    process.exitCode = 1;
  }
}
