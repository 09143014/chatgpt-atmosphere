import { mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const zipName = "chatgpt-atmosphere-extension.zip";
const zipPath = path.join(dist, zipName);

await mkdir(dist, { recursive: true });
await rm(zipPath, { force: true });

const validate = spawnSync(process.execPath, ["scripts/validate.mjs"], {
  cwd: root,
  encoding: "utf8"
});
if (validate.status !== 0) {
  console.error(validate.stderr || validate.stdout);
  process.exit(validate.status || 1);
}

const files = [
  "manifest.json",
  "README.md",
  "package.json",
  "assets",
  "src",
  "scripts/validate.mjs"
];

const result = spawnSync("/usr/bin/zip", ["-qr", zipPath, ...files], {
  cwd: root,
  encoding: "utf8"
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

console.log(`Created ${zipPath}`);
