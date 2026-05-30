import { DEFAULT_SETTINGS, STORAGE_KEY } from "./constants.js";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeAppearance(saved) {
  return {
    ...DEFAULT_SETTINGS.appearance,
    ...(saved?.appearance || {})
  };
}

function mergePerformance(saved) {
  return {
    ...DEFAULT_SETTINGS.performance,
    ...(saved?.performance || {})
  };
}

function applyWhaleCloudUiPatch(settings) {
  settings.appearance = {
    ...settings.appearance,
    backgroundOpacity: 1,
    blur: 0,
    overlayColor: "#eaf8ff",
    brightness: 1.08,
    overlayOpacity: 0.04,
    chatSurfaceOpacity: 0,
    sidebarOpacity: 0.18,
    inputOpacity: 0.22
  };
  settings.whaleCloudUiPatchVersion = 4;
  return settings;
}

export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const saved = result[STORAGE_KEY];
  if (!saved) return clone(DEFAULT_SETTINGS);

  const merged = {
    ...clone(DEFAULT_SETTINGS),
    ...saved,
    appearance: mergeAppearance(saved),
    performance: mergePerformance(saved),
    schedule: Array.isArray(saved.schedule) && saved.schedule.length ? saved.schedule : clone(DEFAULT_SETTINGS.schedule)
  };

  if (!saved.whaleCloudInstalled) {
    merged.enabled = true;
    merged.mode = "manual";
    merged.manualWallpaperId = "packaged:whale-cloud";
    merged.schedule = merged.schedule.map((slot) => ({ ...slot, wallpaperId: "packaged:whale-cloud" }));
    merged.whaleCloudInstalled = true;
    await saveSettings(merged);
  }

  if (saved.whaleCloudUiPatchVersion !== 4) {
    applyWhaleCloudUiPatch(merged);
    await saveSettings(merged);
  }

  return merged;
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  return settings;
}

export async function patchSettings(patch) {
  const current = await getSettings();
  const next = {
    ...current,
    ...patch,
    appearance: {
      ...current.appearance,
      ...(patch.appearance || {})
    },
    performance: {
      ...current.performance,
      ...(patch.performance || {})
    }
  };
  await saveSettings(next);
  return next;
}

export function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[STORAGE_KEY]) return;
    callback(changes[STORAGE_KEY].newValue);
  });
}
