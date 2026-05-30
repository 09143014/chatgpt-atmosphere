export const STORAGE_KEY = "atmo.settings.v1";
export const DB_NAME = "chatgpt-atmosphere";
export const DB_VERSION = 1;
export const ASSET_STORE = "assets";

export const BUILTIN_WALLPAPERS = [
  {
    id: "packaged:whale-cloud",
    type: "packaged-video",
    name: "Whale Cloud",
    path: "assets/wallpapers/whale-cloud.mp4",
    previewPath: "assets/wallpapers/whale-cloud-preview.gif",
    description: "A bundled silent dynamic wallpaper extracted from whale_cloud.mpkg."
  },
  {
    id: "packaged:xiu-cong-qian-mo",
    type: "packaged-video",
    name: "绣丛阡陌4K",
    path: "assets/wallpapers/xiu-cong-qian-mo.mp4",
    previewPath: "assets/wallpapers/xiu-cong-qian-mo-preview.gif",
    description: "A bundled silent dynamic wallpaper extracted from 绣丛阡陌.mpkg."
  },
  {
    id: "packaged:xing-kong-zhi-cheng",
    type: "packaged-video",
    name: "星空之城 4K",
    path: "assets/wallpapers/xing-kong-zhi-cheng.mp4",
    previewPath: "assets/wallpapers/xing-kong-zhi-cheng-preview.jpg",
    description: "A bundled silent dynamic wallpaper extracted from 星空之城.mpkg."
  },
  {
    id: "packaged:cai-xia-man-tian",
    type: "packaged-video",
    name: "彩霞满天 4K",
    path: "assets/wallpapers/cai-xia-man-tian.mp4",
    previewPath: "assets/wallpapers/cai-xia-man-tian-preview.jpg",
    description: "A bundled silent dynamic wallpaper extracted from 彩霞满天.mpkg."
  },
  {
    id: "packaged:yu-xia-cheng-qi",
    type: "packaged-video",
    name: "余霞成绮4K",
    path: "assets/wallpapers/yu-xia-cheng-qi.mp4",
    previewPath: "assets/wallpapers/yu-xia-cheng-qi-preview.gif",
    description: "A bundled silent dynamic wallpaper extracted from 余霞成绮.mpkg."
  },
  {
    id: "packaged:ring-of-light",
    type: "packaged-video",
    name: "FGO Ring Of Light",
    path: "assets/wallpapers/ring-of-light.mp4",
    previewPath: "assets/wallpapers/ring-of-light-preview.jpg",
    description: "A bundled silent dynamic wallpaper extracted from ring_of_light.mpkg."
  },
  {
    id: "packaged:xing-hai",
    type: "packaged-video",
    name: "星海",
    path: "assets/wallpapers/xing-hai.mp4",
    previewPath: "assets/wallpapers/xing-hai-preview.jpg",
    description: "A bundled silent dynamic wallpaper extracted from 星海.mpkg."
  },
  {
    id: "packaged:xiong-guan-man-dao-zhen-ru-tie",
    type: "packaged-video",
    name: "雄关漫道真如铁",
    path: "assets/wallpapers/xiong-guan-man-dao-zhen-ru-tie.mp4",
    previewPath: "assets/wallpapers/xiong-guan-man-dao-zhen-ru-tie-preview.jpg",
    description: "A bundled silent dynamic wallpaper extracted from 雄关漫道真如铁.mpkg."
  },
  {
    id: "preset:aurora",
    type: "preset",
    name: "Aurora Flow",
    preset: "aurora",
    description: "A calm animated aurora gradient."
  },
  {
    id: "preset:daylight",
    type: "preset",
    name: "Soft Daylight",
    preset: "daylight",
    description: "A bright animated glassy gradient."
  },
  {
    id: "preset:midnight",
    type: "preset",
    name: "Midnight Drift",
    preset: "midnight",
    description: "A low-light animated gradient for night work."
  }
];

export const DEFAULT_SETTINGS = {
  version: 1,
  whaleCloudInstalled: true,
  whaleCloudUiPatchVersion: 4,
  enabled: true,
  dynamicPaused: false,
  mode: "manual",
  manualWallpaperId: "packaged:whale-cloud",
  appearance: {
    backgroundOpacity: 1,
    blur: 0,
    brightness: 1.08,
    overlayColor: "#eaf8ff",
    overlayOpacity: 0.04,
    chatSurfaceOpacity: 0,
    sidebarOpacity: 0.18,
    inputOpacity: 0.22
  },
  performance: {
    pauseWhenHidden: true,
    reduceAnimations: false
  },
  schedule: [
    {
      id: "morning",
      label: "早晨",
      start: "06:00",
      end: "11:00",
      wallpaperId: "packaged:whale-cloud"
    },
    {
      id: "noon",
      label: "中午",
      start: "11:00",
      end: "17:00",
      wallpaperId: "packaged:whale-cloud"
    },
    {
      id: "evening",
      label: "晚上",
      start: "17:00",
      end: "22:00",
      wallpaperId: "packaged:whale-cloud"
    },
    {
      id: "night",
      label: "深夜",
      start: "22:00",
      end: "06:00",
      wallpaperId: "packaged:whale-cloud"
    }
  ]
};

export const SUPPORTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
export const MAX_MEDIA_BYTES = 80 * 1024 * 1024;
