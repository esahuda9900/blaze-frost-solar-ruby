import type { AspectId, FitMode, Resolution, SyncMode } from "@/lib/format";
import type { SceneSpan } from "@/lib/timing";

const DB_NAME = "adegan-v1";
const STORE = "kv";
const KEY = "project";

export type SavedImage = {
  id: string;
  name: string;
  blob: Blob;
};

export type SavedProject = {
  audioBlob: Blob | null;
  audioName: string | null;
  images: SavedImage[];
  scenes: SceneSpan[];
  mode: SyncMode;
  timelineText?: string;
  aspect: AspectId;
  fit: FitMode;
  motion: boolean;
  resolution: Resolution;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB gagal dibuka"));
  });
}

export async function loadProject(): Promise<SavedProject | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as SavedProject | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("Gagal membaca proyek"));
    });
  } finally {
    db.close();
  }
}

export async function saveProject(project: SavedProject): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Gagal menyimpan proyek"));
      tx.objectStore(STORE).put(project, KEY);
    });
  } finally {
    db.close();
  }
}

export async function clearProject(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Gagal menghapus proyek"));
      tx.objectStore(STORE).delete(KEY);
    });
  } finally {
    db.close();
  }
}
