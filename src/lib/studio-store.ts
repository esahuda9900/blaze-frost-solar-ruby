import { create } from "zustand";
import type { AspectId, FitMode, Resolution, SyncMode } from "@/lib/format";
import { compareNames } from "@/lib/format";
import { clearProject, loadProject, saveProject, type SavedProject } from "@/lib/project-db";
import { evenSplit, monoChannel, speechAwareSplit, type SceneSpan } from "@/lib/timing";

export type ImageItem = {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
};

type StudioState = {
  booted: boolean;
  audioBlob: Blob | null;
  audioName: string | null;
  audioUrl: string | null;
  audioBuffer: AudioBuffer | null;
  duration: number;
  images: ImageItem[];
  scenes: SceneSpan[];
  mode: SyncMode;
  aspect: AspectId;
  fit: FitMode;
  motion: boolean;
  resolution: Resolution;
  note: string;
  storageWarning: string | null;
  boot: () => Promise<void>;
  addAudio: (file: File) => Promise<void>;
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  moveImage: (id: string, dir: -1 | 1) => void;
  reorder: (fromId: string, toId: string) => void;
  sortByName: () => void;
  setMode: (mode: SyncMode) => void;
  updateBoundary: (sceneIndex: number, time: number) => void;
  setAspect: (aspect: AspectId) => void;
  setFit: (fit: FitMode) => void;
  setMotion: (motion: boolean) => void;
  setResolution: (resolution: Resolution) => void;
  reset: () => void;
};

let allowPersist = false;
let pendingPersist = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function snapshot(state: StudioState): SavedProject {
  return {
    audioBlob: state.audioBlob,
    audioName: state.audioName,
    images: state.images.map((img) => ({ id: img.id, name: img.name, blob: img.blob })),
    scenes: state.scenes,
    mode: state.mode,
    aspect: state.aspect,
    fit: state.fit,
    motion: state.motion,
    resolution: state.resolution,
  };
}

function schedulePersist() {
  pendingPersist = true;
  if (!allowPersist) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    pendingPersist = false;
    const state = useStudio.getState();
    void saveProject(snapshot(state)).catch(() => {
      useStudio.setState({
        storageWarning:
          "Penyimpanan browser penuh. Proyek tetap hidup di tab ini, tapi hilang kalau halaman ditutup.",
      });
    });
  }, 350);
}

function finishBoot() {
  allowPersist = true;
  if (pendingPersist) schedulePersist();
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);
}

function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || /\.(wav|mp3|m4a|ogg|flac|aac|mpeg)$/i.test(file.name);
}

export function takeAudioAndImages(files: File[]): { audio: File | null; images: File[] } {
  let audio: File | null = null;
  const images: File[] = [];
  for (const file of files) {
    if (!audio && isAudioFile(file)) audio = file;
    else if (isImageFile(file)) images.push(file);
  }
  return { audio, images };
}

function planNote(mode: SyncMode, count: number, pauseCuts: number, hasAudio: boolean): string {
  if (!hasAudio) return count > 0 ? "Gambar siap. Masukkan audio supaya durasinya kebagi." : "";
  if (count === 0) return "Audio siap. Masukkan gambar scene sesuai urutan cerita.";
  if (mode === "even") return "Tiap scene dapat durasi yang sama, dari awal audio sampai habis.";
  if (mode === "custom") return "Batas digeser manual. Napas atau Rata akan menghitung ulang.";
  const gaps = Math.max(0, count - 1);
  if (pauseCuts >= gaps && gaps > 0) return "Semua pergantian scene nempel di jeda napas.";
  if (pauseCuts > 0) {
    return `${pauseCuts} dari ${gaps} pergantian nempel di jeda napas. Sisanya di titik paling sunyi di sekitar bagi rata.`;
  }
  return "Jeda ucapan kurang jelas, jadi durasi dibagi rata lalu digeser ke titik paling sunyi.";
}

export const useStudio = create<StudioState>((set, get) => {
  function applyPlan(mode: Exclude<SyncMode, "custom">) {
    const { audioBuffer, images } = get();
    const count = images.length;
    if (!audioBuffer || count === 0) {
      set({
        scenes: [],
        mode,
        note: planNote(mode, count, 0, Boolean(audioBuffer)),
      });
      return;
    }
    const duration = audioBuffer.duration;
    if (mode === "even") {
      set({
        scenes: evenSplit(duration, count),
        mode,
        note: planNote("even", count, 0, true),
      });
      return;
    }
    const plan = speechAwareSplit(monoChannel(audioBuffer), audioBuffer.sampleRate, duration, count);
    set({
      scenes: plan.scenes,
      mode: "breath",
      note: planNote("breath", count, plan.pauseCuts, true),
    });
  }

  return {
    booted: false,
    audioBlob: null,
    audioName: null,
    audioUrl: null,
    audioBuffer: null,
    duration: 0,
    images: [],
    scenes: [],
    mode: "breath",
    aspect: "9:16",
    fit: "cover",
    motion: true,
    resolution: 720,
    note: "",
    storageWarning: null,

    boot: async () => {
      if (get().booted) return;
      set({ booted: true });
      try {
        const saved = await loadProject();
        if (!saved) return;
        if (get().audioBlob || get().images.length > 0) return;

        const images: ImageItem[] = [];
        for (const img of saved.images) {
          try {
            const bmp = await createImageBitmap(img.blob);
            images.push({
              id: img.id,
              name: img.name,
              blob: img.blob,
              url: URL.createObjectURL(img.blob),
              width: bmp.width,
              height: bmp.height,
            });
            bmp.close();
          } catch {
            /* skip a corrupt frame from an older save */
          }
        }

        let audioBuffer: AudioBuffer | null = null;
        let audioUrl: string | null = null;
        if (saved.audioBlob) {
          const ctx = new AudioContext();
          audioBuffer = await ctx.decodeAudioData(await saved.audioBlob.arrayBuffer());
          await ctx.close();
          audioUrl = URL.createObjectURL(saved.audioBlob);
        }

        const duration = audioBuffer?.duration ?? 0;
        const scenesOk = saved.scenes.length === images.length && images.length > 0;
        set({
          audioBlob: saved.audioBlob,
          audioName: saved.audioName,
          audioUrl,
          audioBuffer,
          duration,
          images,
          scenes: scenesOk ? saved.scenes : [],
          mode: saved.mode,
          aspect: saved.aspect,
          fit: saved.fit,
          motion: saved.motion,
          resolution: saved.resolution,
        });
        if (!scenesOk && (audioBuffer || images.length)) {
          applyPlan(saved.mode === "even" ? "even" : "breath");
          schedulePersist();
        } else if (audioBuffer && images.length) {
          const restored =
            saved.mode === "custom"
              ? planNote("custom", images.length, 0, true)
              : saved.mode === "even"
                ? planNote("even", images.length, 0, true)
                : "Potongan terakhir dimuat. Tekan Napas kalau mau dihitung ulang dari jeda ucapan.";
          set({ note: restored });
        }
      } catch {
        set({ storageWarning: "Proyek sebelumnya tidak bisa dibuka. Mulai dari audio dan gambar lagi." });
      } finally {
        finishBoot();
      }
    },

    addAudio: async (file) => {
      try {
        const ctx = new AudioContext();
        const audioBuffer = await ctx.decodeAudioData(await file.arrayBuffer());
        await ctx.close();
        const prev = get().audioUrl;
        if (prev) URL.revokeObjectURL(prev);
        set({
          audioBlob: file,
          audioName: file.name,
          audioUrl: URL.createObjectURL(file),
          audioBuffer,
          duration: audioBuffer.duration,
          storageWarning: null,
        });
        applyPlan(get().mode === "even" ? "even" : "breath");
        schedulePersist();
      } catch {
        set({ storageWarning: "Audio tidak bisa diputar. Pakai WAV, MP3, atau M4A." });
      }
    },

    addImages: async (files) => {
      const sorted = files
      .filter(isImageFile)
      .sort((a, b) => compareNames(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name));
      if (sorted.length === 0) {
        set({ storageWarning: "Tidak ada file gambar. Pakai PNG, JPG, atau WebP." });
        return;
      }
      const loaded: ImageItem[] = [];
      const failed: string[] = [];
      for (const file of sorted) {
        try {
          const bmp = await createImageBitmap(file);
          loaded.push({
            id: crypto.randomUUID(),
            name: file.name,
            blob: file,
            url: URL.createObjectURL(file),
            width: bmp.width,
            height: bmp.height,
          });
          bmp.close();
        } catch {
          failed.push(file.name);
        }
      }
      if (loaded.length === 0) {
        set({ storageWarning: "Gambar tidak bisa dibaca. Pakai PNG, JPG, atau WebP." });
        return;
      }
      set({
        images: [...get().images, ...loaded],
        storageWarning: failed.length ? `Lewati ${failed.length} file yang rusak.` : null,
      });
      applyPlan(get().mode === "even" ? "even" : "breath");
      schedulePersist();
    },

    removeImage: (id) => {
      const found = get().images.find((img) => img.id === id);
      if (!found) return;
      URL.revokeObjectURL(found.url);
      set({ images: get().images.filter((img) => img.id !== id) });
      applyPlan(get().mode === "even" ? "even" : "breath");
      schedulePersist();
    },

    moveImage: (id, dir) => {
      const images = [...get().images];
      const index = images.findIndex((img) => img.id === id);
      const next = index + dir;
      if (index < 0 || next < 0 || next >= images.length) return;
      const swap = images[index];
      images[index] = images[next];
      images[next] = swap;
      set({ images });
      schedulePersist();
    },

    reorder: (fromId, toId) => {
      if (fromId === toId) return;
      const images = [...get().images];
      const from = images.findIndex((img) => img.id === fromId);
      const to = images.findIndex((img) => img.id === toId);
      if (from < 0 || to < 0) return;
      const [item] = images.splice(from, 1);
      images.splice(to, 0, item);
      set({ images });
      schedulePersist();
    },

    sortByName: () => {
      set({
        images: [...get().images].sort((a, b) => compareNames(a.name, b.name)),
      });
      schedulePersist();
    },

    setMode: (mode) => {
      if (mode === "custom") {
        set({ mode, note: planNote("custom", get().images.length, 0, Boolean(get().audioBuffer)) });
        schedulePersist();
        return;
      }
      applyPlan(mode);
      schedulePersist();
    },

    updateBoundary: (sceneIndex, time) => {
      const scenes = get().scenes;
      const current = scenes[sceneIndex];
      const nextScene = scenes[sceneIndex + 1];
      if (!current || !nextScene) return;
      const minSlice = Math.min(0.2, get().duration / Math.max(scenes.length * 4, 1));
      const end = Math.min(nextScene.end - minSlice, Math.max(current.start + minSlice, time));
      set({
        mode: "custom",
        note: planNote("custom", get().images.length, 0, true),
        scenes: scenes.map((scene, index) => {
          if (index === sceneIndex) return { ...scene, end };
          if (index === sceneIndex + 1) return { ...scene, start: end };
          return scene;
        }),
      });
      schedulePersist();
    },

    setAspect: (aspect) => {
      set({ aspect });
      schedulePersist();
    },
    setFit: (fit) => {
      set({ fit });
      schedulePersist();
    },
    setMotion: (motion) => {
      set({ motion });
      schedulePersist();
    },
    setResolution: (resolution) => {
      set({ resolution });
      schedulePersist();
    },

    reset: () => {
      const { audioUrl, images } = get();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      for (const img of images) URL.revokeObjectURL(img.url);
      set({
        audioBlob: null,
        audioName: null,
        audioUrl: null,
        audioBuffer: null,
        duration: 0,
        images: [],
        scenes: [],
        mode: "breath",
        aspect: "9:16",
        fit: "cover",
        motion: true,
        resolution: 720,
        note: "",
        storageWarning: null,
      });
      void clearProject().catch(() => {
        schedulePersist();
      });
    },
  };
});
