import { BUILTIN_WALLPAPERS } from "../shared/constants.js";
import { listAssets } from "../shared/media-db.js";
import { getSettings, patchSettings } from "../shared/storage.js";

const els = {
  enabled: document.querySelector("#enabled"),
  mode: document.querySelector("#mode"),
  manualWallpaper: document.querySelector("#manualWallpaper"),
  overlayOpacity: document.querySelector("#overlayOpacity"),
  chatSurfaceOpacity: document.querySelector("#chatSurfaceOpacity"),
  dynamicPaused: document.querySelector("#dynamicPaused"),
  currentSlot: document.querySelector("#currentSlot"),
  preview: document.querySelector("#preview"),
  previewName: document.querySelector("#previewName"),
  openOptions: document.querySelector("#openOptions")
};

let settings;
let assets = [];
const objectUrls = new Map();

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isInRange(now, start, end) {
  if (start === end) return true;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

function activeSlot() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return settings.schedule.find((slot) => isInRange(minutes, timeToMinutes(slot.start), timeToMinutes(slot.end)));
}

function allWallpapers() {
  return [...BUILTIN_WALLPAPERS, ...assets];
}

function wallpaperName(id) {
  return allWallpapers().find((item) => item.id === id)?.name || "未知壁纸";
}

function currentWallpaperId() {
  if (settings.mode === "manual") return settings.manualWallpaperId;
  return activeSlot()?.wallpaperId || settings.manualWallpaperId;
}

function fillWallpaperSelect() {
  els.manualWallpaper.replaceChildren(
    ...allWallpapers().map((wallpaper) => {
      const option = document.createElement("option");
      option.value = wallpaper.id;
      option.textContent = wallpaper.name;
      return option;
    })
  );
}

function presetPreview(preset) {
  if (preset === "daylight") {
    return "radial-gradient(circle at 22% 18%, rgba(255,232,186,.88), transparent 28%), radial-gradient(circle at 86% 30%, rgba(113,211,255,.7), transparent 32%), linear-gradient(135deg,#f1f8ff,#cfe8ff,#e7d4ff)";
  }
  if (preset === "midnight") {
    return "radial-gradient(circle at 20% 20%, rgba(84,116,255,.58), transparent 30%), radial-gradient(circle at 82% 22%, rgba(138,82,255,.48), transparent 28%), linear-gradient(135deg,#040713,#101429,#190c26)";
  }
  return "radial-gradient(circle at 18% 22%, rgba(113,229,255,.72), transparent 30%), radial-gradient(circle at 74% 24%, rgba(255,135,183,.52), transparent 28%), linear-gradient(135deg,#08111f,#0d1f2d,#231532)";
}

function updatePreview() {
  els.preview.querySelector("video")?.remove();
  els.preview.style.backgroundImage = "";
  const id = currentWallpaperId();
  const wallpaper = allWallpapers().find((item) => item.id === id);
  els.previewName.textContent = wallpaper?.name || "未知壁纸";
  if (!wallpaper) return;

  if (wallpaper.type === "preset") {
    els.preview.style.backgroundImage = presetPreview(wallpaper.preset);
    return;
  }

  if (wallpaper.type === "packaged-video") {
    const video = document.createElement("video");
    video.src = chrome.runtime.getURL(wallpaper.path);
    video.poster = chrome.runtime.getURL(wallpaper.previewPath);
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    els.preview.prepend(video);
    return;
  }

  if (!objectUrls.has(wallpaper.id)) objectUrls.set(wallpaper.id, URL.createObjectURL(wallpaper.blob));
  const url = objectUrls.get(wallpaper.id);

  if (wallpaper.type === "video") {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    els.preview.prepend(video);
    return;
  }

  els.preview.style.backgroundImage = `url("${url}")`;
}

async function render() {
  settings = await getSettings();
  assets = await listAssets();

  fillWallpaperSelect();
  els.enabled.checked = settings.enabled;
  els.mode.value = settings.mode;
  els.manualWallpaper.value = settings.manualWallpaperId;
  els.overlayOpacity.value = settings.appearance.overlayOpacity;
  els.chatSurfaceOpacity.value = settings.appearance.chatSurfaceOpacity;
  els.dynamicPaused.checked = settings.dynamicPaused;

  const slot = activeSlot();
  els.currentSlot.textContent = settings.mode === "schedule" && slot ? `${slot.label} · ${wallpaperName(slot.wallpaperId)}` : "手动模式";
  updatePreview();
}

els.enabled.addEventListener("change", () => patchSettings({ enabled: els.enabled.checked }));
els.mode.addEventListener("change", () => patchSettings({ mode: els.mode.value }).then(render));
els.manualWallpaper.addEventListener("change", () => patchSettings({ manualWallpaperId: els.manualWallpaper.value }).then(render));
els.dynamicPaused.addEventListener("change", () => patchSettings({ dynamicPaused: els.dynamicPaused.checked }));
els.overlayOpacity.addEventListener("input", () => patchSettings({ appearance: { overlayOpacity: Number(els.overlayOpacity.value) } }));
els.chatSurfaceOpacity.addEventListener("input", () => patchSettings({ appearance: { chatSurfaceOpacity: Number(els.chatSurfaceOpacity.value) } }));
els.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

render();
