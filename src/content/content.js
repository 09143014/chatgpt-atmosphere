(() => {
  const STORAGE_KEY = "atmo.settings.v1";
  const DB_NAME = "chatgpt-atmosphere";
  const DB_VERSION = 1;
  const ASSET_STORE = "assets";

  const BUILTIN_WALLPAPERS = [
    {
      id: "packaged:whale-cloud",
      type: "packaged-video",
      name: "Whale Cloud",
      path: "assets/wallpapers/whale-cloud.mp4",
      previewPath: "assets/wallpapers/whale-cloud-preview.gif"
    },
    {
      id: "packaged:xiu-cong-qian-mo",
      type: "packaged-video",
      name: "绣丛阡陌4K",
      path: "assets/wallpapers/xiu-cong-qian-mo.mp4",
      previewPath: "assets/wallpapers/xiu-cong-qian-mo-preview.gif"
    },
    {
      id: "packaged:xing-kong-zhi-cheng",
      type: "packaged-video",
      name: "星空之城 4K",
      path: "assets/wallpapers/xing-kong-zhi-cheng.mp4",
      previewPath: "assets/wallpapers/xing-kong-zhi-cheng-preview.jpg"
    },
    {
      id: "packaged:cai-xia-man-tian",
      type: "packaged-video",
      name: "彩霞满天 4K",
      path: "assets/wallpapers/cai-xia-man-tian.mp4",
      previewPath: "assets/wallpapers/cai-xia-man-tian-preview.jpg"
    },
    {
      id: "packaged:yu-xia-cheng-qi",
      type: "packaged-video",
      name: "余霞成绮4K",
      path: "assets/wallpapers/yu-xia-cheng-qi.mp4",
      previewPath: "assets/wallpapers/yu-xia-cheng-qi-preview.gif"
    },
    {
      id: "packaged:ring-of-light",
      type: "packaged-video",
      name: "FGO Ring Of Light",
      path: "assets/wallpapers/ring-of-light.mp4",
      previewPath: "assets/wallpapers/ring-of-light-preview.jpg"
    },
    {
      id: "packaged:xing-hai",
      type: "packaged-video",
      name: "星海",
      path: "assets/wallpapers/xing-hai.mp4",
      previewPath: "assets/wallpapers/xing-hai-preview.jpg"
    },
    {
      id: "packaged:xiong-guan-man-dao-zhen-ru-tie",
      type: "packaged-video",
      name: "雄关漫道真如铁",
      path: "assets/wallpapers/xiong-guan-man-dao-zhen-ru-tie.mp4",
      previewPath: "assets/wallpapers/xiong-guan-man-dao-zhen-ru-tie-preview.jpg"
    },
    { id: "preset:aurora", type: "preset", name: "Aurora Flow", preset: "aurora" },
    { id: "preset:daylight", type: "preset", name: "Soft Daylight", preset: "daylight" },
    { id: "preset:midnight", type: "preset", name: "Midnight Drift", preset: "midnight" }
  ];

  const DEFAULT_SETTINGS = {
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
      { id: "morning", label: "早晨", start: "06:00", end: "11:00", wallpaperId: "packaged:whale-cloud" },
      { id: "noon", label: "中午", start: "11:00", end: "17:00", wallpaperId: "packaged:whale-cloud" },
      { id: "evening", label: "晚上", start: "17:00", end: "22:00", wallpaperId: "packaged:whale-cloud" },
      { id: "night", label: "深夜", start: "22:00", end: "06:00", wallpaperId: "packaged:whale-cloud" }
    ]
  };

  let root;
  let visual;
  let overlay;
  let style;
  let currentUrl;
  let currentWallpaperId;
  let currentSettings = DEFAULT_SETTINGS;
  let renderToken = 0;
  let surfaceCleanupQueued = false;
  let surfaceObserver;

  function applyWhaleCloudMigration(settings) {
    settings.enabled = true;
    settings.mode = "manual";
    settings.manualWallpaperId = "packaged:whale-cloud";
    settings.schedule = settings.schedule.map((slot) => ({ ...slot, wallpaperId: "packaged:whale-cloud" }));
    settings.whaleCloudInstalled = true;
    return settings;
  }

  function applyWhaleCloudUiPatch(settings) {
    settings.appearance = {
      ...settings.appearance,
      backgroundOpacity: 1,
      blur: 0,
      brightness: 1.08,
      overlayColor: "#eaf8ff",
      overlayOpacity: 0.04,
      chatSurfaceOpacity: 0,
      sidebarOpacity: 0.18,
      inputOpacity: 0.22
    };
    settings.whaleCloudUiPatchVersion = 4;
    return settings;
  }

  function deepMergeSettings(saved) {
    if (!saved) return structuredClone(DEFAULT_SETTINGS);
    const merged = {
      ...structuredClone(DEFAULT_SETTINGS),
      ...saved,
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        ...(saved.appearance || {})
      },
      performance: {
        ...DEFAULT_SETTINGS.performance,
        ...(saved.performance || {})
      },
      schedule: Array.isArray(saved.schedule) && saved.schedule.length ? saved.schedule : structuredClone(DEFAULT_SETTINGS.schedule)
    };
    const migrated = saved.whaleCloudInstalled ? merged : applyWhaleCloudMigration(merged);
    return saved.whaleCloudUiPatchVersion === 4 ? migrated : applyWhaleCloudUiPatch(migrated);
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const saved = result[STORAGE_KEY];
        const settings = deepMergeSettings(saved);
        if (saved && (!saved.whaleCloudInstalled || saved.whaleCloudUiPatchVersion !== 4)) {
          chrome.storage.local.set({ [STORAGE_KEY]: settings });
        }
        resolve(settings);
      });
    });
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(ASSET_STORE)) {
          const store = db.createObjectStore(ASSET_STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("type", "type");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAsset(id) {
    if (!id || id.startsWith("preset:") || id.startsWith("packaged:")) return null;
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ASSET_STORE, "readonly");
      const request = tx.objectStore(ASSET_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  function injectStyle() {
    if (style) return;
    style = document.createElement("style");
    style.id = "atmo-chatgpt-style";
    style.textContent = `
      #atmo-wallpaper-root {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
        background: #05070d;
      }

      #atmo-wallpaper-root[hidden] {
        display: none !important;
      }

      #atmo-wallpaper-visual,
      #atmo-wallpaper-overlay {
        position: absolute;
        inset: 0;
      }

      #atmo-wallpaper-visual {
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        opacity: var(--atmo-bg-opacity, 1);
        filter: blur(var(--atmo-bg-blur, 0px)) brightness(var(--atmo-bg-brightness, 0.82));
        transform: scale(var(--atmo-bg-scale, 1));
      }

      #atmo-wallpaper-visual video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      #atmo-wallpaper-overlay {
        background: var(--atmo-overlay-color, #05070d);
        opacity: var(--atmo-overlay-opacity, 0.34);
      }

      #atmo-wallpaper-visual[data-preset="aurora"] {
        background:
          radial-gradient(circle at 18% 22%, rgba(113, 229, 255, 0.72), transparent 30%),
          radial-gradient(circle at 74% 24%, rgba(255, 135, 183, 0.52), transparent 28%),
          radial-gradient(circle at 52% 84%, rgba(111, 255, 181, 0.34), transparent 34%),
          linear-gradient(135deg, #08111f 0%, #0d1f2d 42%, #231532 100%);
        animation: atmo-pan 22s ease-in-out infinite alternate;
      }

      #atmo-wallpaper-visual[data-preset="daylight"] {
        background:
          radial-gradient(circle at 22% 18%, rgba(255, 232, 186, 0.88), transparent 28%),
          radial-gradient(circle at 86% 30%, rgba(113, 211, 255, 0.7), transparent 32%),
          radial-gradient(circle at 42% 92%, rgba(136, 255, 199, 0.38), transparent 36%),
          linear-gradient(135deg, #f1f8ff 0%, #cfe8ff 48%, #e7d4ff 100%);
        animation: atmo-pan 20s ease-in-out infinite alternate;
      }

      #atmo-wallpaper-visual[data-preset="midnight"] {
        background:
          radial-gradient(circle at 20% 20%, rgba(84, 116, 255, 0.58), transparent 30%),
          radial-gradient(circle at 82% 22%, rgba(138, 82, 255, 0.48), transparent 28%),
          radial-gradient(circle at 50% 80%, rgba(57, 221, 185, 0.22), transparent 34%),
          linear-gradient(135deg, #040713 0%, #101429 48%, #190c26 100%);
        animation: atmo-pan 28s ease-in-out infinite alternate;
      }

      body.atmo-enabled {
        background: transparent !important;
      }

      html.atmo-enabled,
      html.atmo-enabled body,
      html.atmo-enabled #__next {
        background: transparent !important;
        background-color: transparent !important;
      }

      html.atmo-enabled body > *:not(#atmo-wallpaper-root):not(script):not(style) {
        position: relative;
        z-index: 1;
      }

      html.atmo-enabled body > div,
      html.atmo-enabled #__next > div,
      html.atmo-enabled [class*="bg-token-main-surface"],
      html.atmo-enabled [class*="dark:bg-token-main-surface"],
      html.atmo-enabled [class*="bg-token-sidebar-surface"],
      html.atmo-enabled [class*="dark:bg-token-sidebar-surface"],
      html.atmo-enabled [class*="bg-gray-950"],
      html.atmo-enabled [class*="dark:bg-gray-950"],
      html.atmo-enabled [class*="bg-gray-900"],
      html.atmo-enabled [class*="dark:bg-gray-900"],
      html.atmo-enabled [class*="bg-black"],
      html.atmo-enabled [class*="dark:bg-black"] {
        background: transparent !important;
        background-color: transparent !important;
      }

      html.atmo-enabled main,
      html.atmo-enabled [role="main"],
      html.atmo-enabled [class*="thread"],
      html.atmo-enabled [class*="conversation"],
      html.atmo-enabled [class*="composer-parent"],
      html.atmo-enabled .bg-token-main-surface-primary,
      html.atmo-enabled .bg-token-main-surface-secondary,
      html.atmo-enabled .bg-token-main-surface-tertiary {
        background: transparent !important;
        background-color: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html.atmo-enabled header,
      html.atmo-enabled [role="banner"],
      html.atmo-enabled div[class*="sticky"][class*="top-0"] {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        box-shadow: none !important;
      }

      html.atmo-enabled aside,
      html.atmo-enabled nav,
      html.atmo-enabled .bg-token-sidebar-surface-primary,
      html.atmo-enabled .bg-token-sidebar-surface-secondary {
        background: rgba(234, 248, 255, var(--atmo-sidebar-opacity, 0.18)) !important;
        background-color: rgba(234, 248, 255, var(--atmo-sidebar-opacity, 0.18)) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html.atmo-enabled [data-testid="composer"],
      html.atmo-enabled .bg-token-main-surface-primary.rounded-3xl {
        background: rgba(234, 248, 255, var(--atmo-input-opacity, 0.22)) !important;
        background-color: rgba(234, 248, 255, var(--atmo-input-opacity, 0.22)) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border-color: rgba(255, 255, 255, 0.42) !important;
        border-radius: 999px !important;
        overflow: hidden !important;
        box-shadow: 0 14px 36px rgba(44, 96, 122, 0.14);
      }

      html.atmo-enabled form,
      html.atmo-enabled [class*="composer-parent"] {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        box-shadow: none !important;
      }

      html.atmo-enabled [data-testid="composer"] *,
      html.atmo-enabled [data-testid="composer"] [class*="bg-"],
      html.atmo-enabled .bg-token-main-surface-primary.rounded-3xl *,
      html.atmo-enabled div[class*="composer"] *,
      html.atmo-enabled form:has([data-testid="composer"]) * {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html.atmo-enabled [data-testid="composer"] textarea,
      html.atmo-enabled [data-testid="composer"] [contenteditable="true"],
      html.atmo-enabled [data-testid="composer"] [role="textbox"] {
        background: transparent !important;
        background-color: transparent !important;
      }

      html.atmo-enabled article,
      html.atmo-enabled [data-testid^="conversation-turn"] {
        background: transparent !important;
        background-color: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html.atmo-enabled div:has(> pre) {
        background: rgba(255, 255, 255, 0.78) !important;
        background-color: rgba(255, 255, 255, 0.78) !important;
        border-radius: 22px !important;
        overflow: hidden !important;
        box-shadow: 0 10px 26px rgba(44, 96, 122, 0.12);
      }

      html.atmo-enabled pre {
        background: transparent !important;
        background-color: transparent !important;
        border-radius: 22px !important;
        overflow: hidden !important;
      }

      html.atmo-enabled pre code,
      html.atmo-enabled div:has(> pre) code {
        background: transparent !important;
        background-color: transparent !important;
        border-radius: inherit !important;
      }

      html.atmo-enabled div:has(> pre) button {
        background: transparent !important;
        background-color: transparent !important;
        box-shadow: none !important;
      }

      html.atmo-enabled :not(pre) > code {
        background: rgba(255, 255, 255, 0.52) !important;
        background-color: rgba(255, 255, 255, 0.52) !important;
        border-radius: 6px !important;
      }

      html.atmo-enabled [data-message-author-role],
      html.atmo-enabled article,
      html.atmo-enabled p,
      html.atmo-enabled li {
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
      }

      html.atmo-reduce-motion #atmo-wallpaper-visual {
        animation: none !important;
      }

      @keyframes atmo-pan {
        0% {
          transform: scale(1.04) translate3d(-1.8%, -1.2%, 0);
          background-position: 0% 50%;
        }
        50% {
          transform: scale(1.08) translate3d(1.2%, 1.4%, 0);
          background-position: 100% 50%;
        }
        100% {
          transform: scale(1.05) translate3d(1.8%, -1%, 0);
          background-position: 45% 50%;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureRoot() {
    if (root) return;
    injectStyle();
    root = document.createElement("div");
    root.id = "atmo-wallpaper-root";
    visual = document.createElement("div");
    visual.id = "atmo-wallpaper-visual";
    overlay = document.createElement("div");
    overlay.id = "atmo-wallpaper-overlay";
    root.append(visual, overlay);

    const attach = () => {
      if (!document.body) return requestAnimationFrame(attach);
      document.body.prepend(root);
    };
    attach();
  }

  function timeToMinutes(value) {
    const [hours, minutes] = String(value || "00:00").split(":").map(Number);
    return hours * 60 + minutes;
  }

  function isInRange(now, start, end) {
    if (start === end) return true;
    if (start < end) return now >= start && now < end;
    return now >= start || now < end;
  }

  function resolveWallpaperId(settings) {
    if (settings.mode === "manual") return settings.manualWallpaperId || "packaged:whale-cloud";

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const slot = settings.schedule.find((item) => isInRange(minutes, timeToMinutes(item.start), timeToMinutes(item.end)));
    return slot?.wallpaperId || settings.manualWallpaperId || "packaged:whale-cloud";
  }

  function applyAppearance(settings) {
    const appearance = settings.appearance || DEFAULT_SETTINGS.appearance;
    const scale = appearance.blur > 0 ? 1.04 : 1;
    root.style.setProperty("--atmo-bg-opacity", String(appearance.backgroundOpacity));
    root.style.setProperty("--atmo-bg-blur", `${appearance.blur}px`);
    root.style.setProperty("--atmo-bg-brightness", String(appearance.brightness));
    root.style.setProperty("--atmo-bg-scale", String(scale));
    root.style.setProperty("--atmo-overlay-color", appearance.overlayColor);
    root.style.setProperty("--atmo-overlay-opacity", String(appearance.overlayOpacity));
    document.documentElement.style.setProperty("--atmo-chat-surface-opacity", String(appearance.chatSurfaceOpacity));
    document.documentElement.style.setProperty("--atmo-sidebar-opacity", String(appearance.sidebarOpacity));
    document.documentElement.style.setProperty("--atmo-input-opacity", String(appearance.inputOpacity));
  }

  function setEnabled(enabled, reduceMotion) {
    document.documentElement.classList.toggle("atmo-enabled", enabled);
    document.body?.classList.toggle("atmo-enabled", enabled);
    document.documentElement.classList.toggle("atmo-reduce-motion", reduceMotion);
    if (root) root.hidden = !enabled;
    if (enabled) scheduleSurfaceCleanup();
  }

  function parseRgbAlpha(value) {
    if (!value || value === "transparent") return 0;
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return 1;
    const parts = match[1].split(",").map((part) => part.trim());
    if (parts.length < 4) return 1;
    const alpha = Number(parts[3].replace("/", "").trim());
    return Number.isFinite(alpha) ? alpha : 1;
  }

  function isProtectedSurface(element) {
    if (!(element instanceof HTMLElement)) return true;
    if (element === root || root?.contains(element)) return true;
    if (element.closest("#atmo-wallpaper-root")) return true;
    if (element.closest("[data-testid='composer']")) return true;
    if (element.closest("textarea, input, select, button")) return true;
    if (element.matches("textarea, input, select, button, video, img, svg, canvas")) return true;
    if (element.matches("aside, nav, header")) return true;
    if (element.closest("aside, nav")) return true;
    return false;
  }

  function clearLargeSurface(element, viewportArea) {
    if (isProtectedSurface(element)) return;

    const rect = element.getBoundingClientRect();
    if (rect.width < 420 || rect.height < 220 || rect.width * rect.height < viewportArea * 0.16) return;

    const styles = getComputedStyle(element);
    const hasBackgroundColor = parseRgbAlpha(styles.backgroundColor) > 0.01;
    const hasBackgroundImage = styles.backgroundImage && styles.backgroundImage !== "none";
    if (!hasBackgroundColor && !hasBackgroundImage) return;

    element.dataset.atmoSurfaceCleared = "true";
    element.style.setProperty("background", "transparent", "important");
    element.style.setProperty("background-color", "transparent", "important");
    element.style.setProperty("background-image", "none", "important");
    element.style.setProperty("box-shadow", "none", "important");
    element.style.setProperty("backdrop-filter", "none", "important");
    element.style.setProperty("-webkit-backdrop-filter", "none", "important");
  }

  function cleanupLargeSurfaces() {
    if (!currentSettings.enabled) return;

    const viewportArea = window.innerWidth * window.innerHeight;
    if (!viewportArea) return;

    const candidates = document.querySelectorAll("body div, body main, body section, body article");
    for (const element of candidates) clearLargeSurface(element, viewportArea);
  }

  function scheduleSurfaceCleanup() {
    if (surfaceCleanupQueued) return;
    surfaceCleanupQueued = true;
    requestAnimationFrame(() => {
      surfaceCleanupQueued = false;
      cleanupLargeSurfaces();
    });
  }

  function watchSurfaces() {
    if (surfaceObserver || !document.body) return;
    surfaceObserver = new MutationObserver(() => scheduleSurfaceCleanup());
    surfaceObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"]
    });
    window.addEventListener("resize", scheduleSurfaceCleanup);
    setInterval(scheduleSurfaceCleanup, 1200);
  }

  function clearVisual() {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = null;
    visual.replaceChildren();
    visual.style.backgroundImage = "";
    visual.dataset.preset = "";
  }

  async function renderWallpaper(settings) {
    ensureRoot();
    currentSettings = settings;
    applyAppearance(settings);
    const reduceMotion = settings.dynamicPaused || settings.performance?.reduceAnimations;
    setEnabled(Boolean(settings.enabled), Boolean(reduceMotion));
    watchSurfaces();
    scheduleSurfaceCleanup();

    if (!settings.enabled) {
      pauseVideo();
      return;
    }

    const token = ++renderToken;
    const wallpaperId = resolveWallpaperId(settings);
    if (wallpaperId === currentWallpaperId) {
      syncVideoPlayback(settings);
      return;
    }

    currentWallpaperId = wallpaperId;
    clearVisual();

    const builtIn = BUILTIN_WALLPAPERS.find((item) => item.id === wallpaperId);
    if (builtIn?.type === "preset") {
      visual.dataset.preset = builtIn.preset;
      return;
    }

    if (builtIn?.type === "packaged-video") {
      const video = document.createElement("video");
      video.src = chrome.runtime.getURL(builtIn.path);
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute("aria-hidden", "true");
      visual.append(video);
      syncVideoPlayback(settings);
      return;
    }

    const asset = await getAsset(wallpaperId);
    if (token !== renderToken) return;

    if (!asset) {
      visual.dataset.preset = "aurora";
      currentWallpaperId = "preset:aurora";
      return;
    }

    currentUrl = URL.createObjectURL(asset.blob);

    if (asset.type === "video") {
      const video = document.createElement("video");
      video.src = currentUrl;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute("aria-hidden", "true");
      visual.append(video);
      syncVideoPlayback(settings);
      return;
    }

    visual.style.backgroundImage = `url("${currentUrl}")`;
  }

  function pauseVideo() {
    const video = visual?.querySelector("video");
    if (video) video.pause();
  }

  function syncVideoPlayback(settings = currentSettings) {
    const video = visual?.querySelector("video");
    if (!video) return;
    const shouldPause =
      settings.dynamicPaused ||
      settings.performance?.reduceAnimations ||
      (settings.performance?.pauseWhenHidden && document.visibilityState === "hidden");
    if (shouldPause) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }

  async function refresh() {
    const settings = await getSettings();
    await renderWallpaper(settings);
  }

  function watchRoute() {
    let lastHref = location.href;
    setInterval(() => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      refresh();
    }, 700);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORAGE_KEY]) {
      renderWallpaper(deepMergeSettings(changes[STORAGE_KEY].newValue));
    }
  });

  document.addEventListener("visibilitychange", () => syncVideoPlayback());
  setInterval(() => refresh(), 60_000);

  ensureRoot();
  refresh();
  watchRoute();
})();
