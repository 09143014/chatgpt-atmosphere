import { getSettings, saveSettings } from "../shared/storage.js";

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  if (!settings.whaleCloudInstalled) {
    settings.enabled = true;
    settings.mode = "manual";
    settings.manualWallpaperId = "packaged:whale-cloud";
    settings.schedule = settings.schedule.map((slot) => ({
      ...slot,
      wallpaperId: "packaged:whale-cloud"
    }));
    settings.whaleCloudInstalled = true;
  }
  await saveSettings(settings);
});
