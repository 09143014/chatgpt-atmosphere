import { BUILTIN_WALLPAPERS, DEFAULT_SETTINGS, MAX_MEDIA_BYTES, SUPPORTED_MEDIA_TYPES } from "../shared/constants.js";
import { blobToDataUrl, createAssetId, dataUrlToBlob, deleteAsset, listAssets, saveAsset } from "../shared/media-db.js";
import { clone, getSettings, saveSettings } from "../shared/storage.js";

const els = {
  enabled: document.querySelector("#enabled"),
  fileInput: document.querySelector("#fileInput"),
  library: document.querySelector("#library"),
  mode: document.querySelector("#mode"),
  manualWallpaper: document.querySelector("#manualWallpaper"),
  schedule: document.querySelector("#schedule"),
  pauseWhenHidden: document.querySelector("#pauseWhenHidden"),
  reduceAnimations: document.querySelector("#reduceAnimations"),
  dynamicPaused: document.querySelector("#dynamicPaused"),
  exportConfig: document.querySelector("#exportConfig"),
  importConfig: document.querySelector("#importConfig"),
  resetConfig: document.querySelector("#resetConfig"),
  status: document.querySelector("#status")
};

let settings;
let assets = [];
const objectUrls = new Map();

function setStatus(text) {
  els.status.textContent = text;
  if (text) setTimeout(() => (els.status.textContent = ""), 3500);
}

function allWallpapers() {
  return [...BUILTIN_WALLPAPERS, ...assets];
}

function wallpaperOptions(selectedId) {
  return allWallpapers().map((wallpaper) => {
    const option = document.createElement("option");
    option.value = wallpaper.id;
    option.textContent = wallpaper.name;
    option.selected = wallpaper.id === selectedId;
    return option;
  });
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

function createThumb(wallpaper) {
  const thumb = document.createElement("div");
  thumb.className = "thumb";

  if (wallpaper.type === "preset") {
    thumb.style.backgroundImage = presetPreview(wallpaper.preset);
    return thumb;
  }

  if (wallpaper.type === "packaged-video") {
    const video = document.createElement("video");
    video.src = chrome.runtime.getURL(wallpaper.path);
    video.poster = chrome.runtime.getURL(wallpaper.previewPath);
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    thumb.append(video);
    return thumb;
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
    thumb.append(video);
  } else {
    thumb.style.backgroundImage = `url("${url}")`;
  }

  return thumb;
}

function renderLibrary() {
  els.library.replaceChildren();
  for (const wallpaper of allWallpapers()) {
    const item = document.createElement("article");
    item.className = "wallpaper";
    item.append(createThumb(wallpaper));

    const name = document.createElement("strong");
    name.textContent = wallpaper.name;
    item.append(name);

    const meta = document.createElement("span");
    meta.textContent =
      wallpaper.type === "preset" ? "内置动态预设" : wallpaper.type === "packaged-video" ? "内置视频" : wallpaper.type === "video" ? "本地视频" : "本地图片";
    item.append(meta);

    if (!wallpaper.id.startsWith("preset:") && !wallpaper.id.startsWith("packaged:")) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "删除";
      remove.addEventListener("click", async () => {
        await deleteAsset(wallpaper.id);
        settings.schedule = settings.schedule.map((slot) =>
          slot.wallpaperId === wallpaper.id ? { ...slot, wallpaperId: "packaged:whale-cloud" } : slot
        );
        if (settings.manualWallpaperId === wallpaper.id) settings.manualWallpaperId = "packaged:whale-cloud";
        await saveSettings(settings);
        await render();
      });
      item.append(remove);
    }

    els.library.append(item);
  }
}

function renderSchedule() {
  els.manualWallpaper.replaceChildren(...wallpaperOptions(settings.manualWallpaperId));
  els.schedule.replaceChildren();
  for (const slot of settings.schedule) {
    const row = document.createElement("div");
    row.className = "slot";

    const label = document.createElement("strong");
    label.textContent = slot.label;

    const start = document.createElement("input");
    start.type = "time";
    start.value = slot.start;

    const end = document.createElement("input");
    end.type = "time";
    end.value = slot.end;

    const select = document.createElement("select");
    select.replaceChildren(...wallpaperOptions(slot.wallpaperId));

    const update = async () => {
      slot.start = start.value;
      slot.end = end.value;
      slot.wallpaperId = select.value;
      await saveSettings(settings);
      setStatus("时间规则已保存");
    };

    start.addEventListener("change", update);
    end.addEventListener("change", update);
    select.addEventListener("change", update);

    row.append(label, start, end, select);
    els.schedule.append(row);
  }
}

function bindAppearanceControls() {
  document.querySelectorAll("[data-appearance]").forEach((input) => {
    const key = input.dataset.appearance;
    input.value = settings.appearance[key];
    input.oninput = async () => {
      const value = input.type === "color" ? input.value : Number(input.value);
      settings.appearance[key] = value;
      await saveSettings(settings);
    };
  });
}

async function handleFiles(files) {
  for (const file of files) {
    if (!SUPPORTED_MEDIA_TYPES.includes(file.type)) {
      setStatus(`不支持的格式：${file.name}`);
      continue;
    }

    if (file.size > MAX_MEDIA_BYTES) {
      setStatus(`文件太大：${file.name}，当前限制 80MB`);
      continue;
    }

    await saveAsset({
      id: createAssetId(),
      type: file.type.startsWith("video/") ? "video" : "image",
      name: file.name.replace(/\.[^.]+$/, ""),
      mime: file.type,
      size: file.size,
      blob: file,
      createdAt: Date.now()
    });
  }

  setStatus("上传完成");
  await render();
}

async function exportConfig() {
  const exportAssets = [];
  for (const asset of assets) {
    exportAssets.push({
      ...asset,
      blob: await blobToDataUrl(asset.blob)
    });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    settings,
    assets: exportAssets
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "chatgpt-atmosphere-config.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importConfig(file) {
  const payload = JSON.parse(await file.text());
  if (!payload?.settings || !Array.isArray(payload.assets)) throw new Error("配置文件格式不正确");

  for (const asset of payload.assets) {
    await saveAsset({
      ...asset,
      blob: dataUrlToBlob(asset.blob)
    });
  }

  await saveSettings({
    ...clone(DEFAULT_SETTINGS),
    ...payload.settings
  });
  setStatus("导入完成");
  await render();
}

async function render() {
  settings = await getSettings();
  assets = await listAssets();

  els.enabled.checked = settings.enabled;
  els.mode.value = settings.mode;
  els.pauseWhenHidden.checked = settings.performance.pauseWhenHidden;
  els.reduceAnimations.checked = settings.performance.reduceAnimations;
  els.dynamicPaused.checked = settings.dynamicPaused;

  renderLibrary();
  renderSchedule();
  bindAppearanceControls();
}

els.enabled.addEventListener("change", async () => {
  settings.enabled = els.enabled.checked;
  await saveSettings(settings);
});

els.mode.addEventListener("change", async () => {
  settings.mode = els.mode.value;
  await saveSettings(settings);
});

els.manualWallpaper.addEventListener("change", async () => {
  settings.manualWallpaperId = els.manualWallpaper.value;
  await saveSettings(settings);
});

els.pauseWhenHidden.addEventListener("change", async () => {
  settings.performance.pauseWhenHidden = els.pauseWhenHidden.checked;
  await saveSettings(settings);
});

els.reduceAnimations.addEventListener("change", async () => {
  settings.performance.reduceAnimations = els.reduceAnimations.checked;
  await saveSettings(settings);
});

els.dynamicPaused.addEventListener("change", async () => {
  settings.dynamicPaused = els.dynamicPaused.checked;
  await saveSettings(settings);
});

els.fileInput.addEventListener("change", () => handleFiles(els.fileInput.files));
els.exportConfig.addEventListener("click", exportConfig);
els.importConfig.addEventListener("change", () => importConfig(els.importConfig.files[0]).catch((error) => setStatus(error.message)));
els.resetConfig.addEventListener("click", async () => {
  await saveSettings(clone(DEFAULT_SETTINGS));
  setStatus("已恢复默认");
  await render();
});

render();
