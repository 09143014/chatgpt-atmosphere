import { ASSET_STORE, DB_NAME, DB_VERSION } from "./constants.js";

let dbPromise;

export function openMediaDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
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

  return dbPromise;
}

function transact(mode, fn) {
  return openMediaDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(ASSET_STORE, mode);
        const store = tx.objectStore(ASSET_STORE);
        const request = fn(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      })
  );
}

export function createAssetId() {
  if (crypto.randomUUID) return `asset:${crypto.randomUUID()}`;
  return `asset:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export async function saveAsset(asset) {
  await transact("readwrite", (store) => store.put(asset));
  return asset;
}

export async function getAsset(id) {
  if (!id || id.startsWith("preset:")) return null;
  return transact("readonly", (store) => store.get(id));
}

export async function listAssets() {
  const assets = await transact("readonly", (store) => store.getAll());
  return assets.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteAsset(id) {
  await transact("readwrite", (store) => store.delete(id));
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}
