import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "manifest.json",
  "src/background/service-worker.js",
  "src/content/content.js",
  "src/popup/popup.html",
  "src/popup/popup.css",
  "src/popup/popup.js",
  "src/options/options.html",
  "src/options/options.css",
  "src/options/options.js",
  "src/shared/constants.js",
  "src/shared/media-db.js",
  "src/shared/storage.js",
  "assets/wallpapers/whale-cloud.mp4",
  "assets/wallpapers/whale-cloud-preview.gif",
  "assets/wallpapers/xiu-cong-qian-mo.mp4",
  "assets/wallpapers/xiu-cong-qian-mo-preview.gif",
  "assets/wallpapers/xing-kong-zhi-cheng.mp4",
  "assets/wallpapers/xing-kong-zhi-cheng-preview.jpg",
  "assets/wallpapers/cai-xia-man-tian.mp4",
  "assets/wallpapers/cai-xia-man-tian-preview.jpg",
  "assets/wallpapers/yu-xia-cheng-qi.mp4",
  "assets/wallpapers/yu-xia-cheng-qi-preview.gif",
  "assets/wallpapers/ring-of-light.mp4",
  "assets/wallpapers/ring-of-light-preview.jpg",
  "assets/wallpapers/xing-hai.mp4",
  "assets/wallpapers/xing-hai-preview.jpg",
  "assets/wallpapers/xiong-guan-man-dao-zhen-ru-tie.mp4",
  "assets/wallpapers/xiong-guan-man-dao-zhen-ru-tie-preview.jpg",
  "README.md"
];

for (const file of requiredFiles) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute)) throw new Error(`Missing required file: ${file}`);
}

const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
if (manifest.manifest_version !== 3) throw new Error("manifest_version must be 3");
if (!manifest.host_permissions?.includes("https://chatgpt.com/*")) throw new Error("chatgpt.com host permission is required");
if (manifest.host_permissions.some((permission) => permission !== "https://chatgpt.com/*")) {
  throw new Error("Host permissions must stay limited to https://chatgpt.com/*");
}
const webResources = manifest.web_accessible_resources?.flatMap((entry) => entry.resources || []) || [];
if (!webResources.includes("assets/wallpapers/*")) {
  throw new Error("Packaged wallpaper assets must be web accessible to chatgpt.com content scripts");
}
if (manifest.permissions.some((permission) => permission !== "storage")) {
  throw new Error("Permissions must stay limited to storage");
}

const jsFiles = requiredFiles.filter((file) => file.endsWith(".js"));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${file} failed syntax check:\n${result.stderr || result.stdout}`);
  }
}

console.log("Validation passed.");
