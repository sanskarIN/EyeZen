import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const json = path => JSON.parse(read(path));

const packageJson = json("package.json");
const lock = json("package-lock.json");
const tauri = json("src-tauri/tauri.conf.json");
const cargo = read("src-tauri/Cargo.toml");
const cargoLock = read("src-tauri/Cargo.lock");

const cargoVersion = cargo.match(/^name = "eyezen"\r?\nversion = "([^"]+)"/m)?.[1];
const lockVersion = cargoLock.match(/\[\[package\]\]\r?\nname = "eyezen"\r?\nversion = "([^"]+)"/m)?.[1];
const expected = packageJson.version;

const entries = [
  ["package.json", expected],
  ["package-lock.json", lock.version],
  ["package-lock.json packages[\"\"]", lock.packages?.[""]?.version],
  ["src-tauri/tauri.conf.json", tauri.version],
  ["src-tauri/Cargo.toml", cargoVersion],
  ["src-tauri/Cargo.lock", lockVersion],
];

let errors = 0;
for (const [file, version] of entries) {
  if (typeof version !== "string" || version !== expected) {
    console.error(`${file}: expected ${expected}, found ${version ?? "(missing)"}`);
    errors++;
  }
}
if (errors) {
  console.error(`EyeZen: ${errors} version mismatch(es). Update every package manifest and lockfile before publishing.`);
  process.exitCode = 1;
} else {
  console.log(`EyeZen versions are consistent: ${expected}`);
}
