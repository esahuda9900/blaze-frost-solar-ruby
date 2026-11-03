import { create } from "zustand";
import {
  type AspectId,
  type FitMode,
  type Resolution,
  type SyncMode,
  compareNames,
  frameSize,
} from "@/lib/format";
import {
  evenSplit,
  monoChannel,
  parseTimelineScript,
  speechAwareSplit,
  type SceneSpan,
} from "@/lib/timing";
import {
  clearProject,
  loadProject,
  saveProject,
  type SavedImage,
  type SavedProject,
} from "@/lib/project-db";

export type StudioImage = {
  id: string;
  name: string;
  blob: Blob;
  url: string;
};

type Status = "idle" | "loading" | "exporting" | "error";

type StudioState = {
  audioBuffer: AudioBuffer | null;
  audioBlob: Blob | null;
  audioName: string | null;
  audioDuration: number;
  images: StudioImage[];
  scenes: SceneSpan[];
  mode: SyncMode;
  timelineText: string;
  timelineError: string | null;
  aspect: AspectId;
  fit: FitMode;
  motion: boolean;
  resolution: Resolution;
  status: Status;
  statusMsg: string;
  exportProgress: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAudio: (file: File | null) => Promise<void>;
  addImages: (files: FileList | File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setMode: (mode: SyncMode) => void;
  setTimelineText: (text: string) => void;
  applyTimeline: () => void;
  recomputeScenes: () => void;
  setAspect: (v: AspectId) => void;
  setFit: (v: FitMode) => void;
  setMotion: (v: boolean) => void;
  setResolution: (v: Resolution) => void;
  setStatus: (s: Status, msg?: string) => void;
  setExportProgress: (ratio: number, label?: string) => void;
  persist: () => Promise<void>;
  resetAll: () => Promise<void>;
};

function revokeAll(images: StudioImage[]) {
  for (const img of images) {
    try {
      URL.revokeObjectURL(img.url);
    } catch {
      /* ignore */
    }
  }
}

function sortImages(list: StudioImage[]): StudioImage[] {
  return [...list].sort((a, b) => compareNames(a.name, b.name));
}

async function decodeAudio(blob: Blob): Promise<AudioBuffer> {
  const ctx = new AudioContext();
  try {
    const ab = await blob.arrayBuffer();
    return await ctx.decodeAudioData(ab.slice(0));
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  audioBuffer: null,
  audioBlob: null,
  audioName: null,
  audioDuration: 0,
  images: [],
  scenes: [],
  mode: "custom",
  timelineText: "",
  timelineError: null,
  aspect: "9:16",
  fit: "cover",
  motion: true,
  resolution: 1080,
  status: "idle",
  statusMsg: "",
  exportProgress: 0,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const saved = await loadProject();
      if (!saved) {
        set({ hydrated: true });
        return;
      }
      let audioBuffer: AudioBuffer | null = null;
      let audioDuration = 0;
      if (saved.audioBlob) {
        try {
          audioBuffer = await decodeAudio(saved.audioBlob);
          audioDuration = audioBuffer.duration;
        } catch {
          /* skip */
        }
      }
      const images: StudioImage[] = saved.images.map((img) => ({
        id: img.id,
        name: img.name,
        blob: img.blob,
        url: URL.createObjectURL(img.blob),
      }));
      set({
        audioBuffer,
        audioBlob: saved.audioBlob,
        audioName: saved.audioName,
        audioDuration,
        images: sortImages(images),
        scenes: saved.scenes ?? [],
        mode: saved.mode ?? "custom",
        aspect: saved.aspect ?? "9:16",
        fit: saved.fit ?? "cover",
        motion: saved.motion ?? true,
        resolution: saved.resolution ?? 1080,
        hydrated: true,
      });
      if (saved.mode !== "custom" && audioBuffer && images.length > 0) {
        get().recomputeScenes();
      }
    } catch (e) {
      console.error(e);
      set({ hydrated: true });
    }
  },

  setAudio: async (file) => {
    if (!file) {
      set({
        audioBuffer: null,
        audioBlob: null,
        audioName: null,
        audioDuration: 0,
        scenes: get().mode === "custom" ? get().scenes : [],
      });
      await get().persist();
      return;
    }
    set({ status: "loading", statusMsg: "Membaca audio…" });
    try {
      const blob = file.slice(0, file.size, file.type || "audio/wav");
      const buffer = await decodeAudio(blob);
      set({
        audioBuffer: buffer,
        audioBlob: blob,
        audioName: file.name,
        audioDuration: buffer.duration,
        status: "idle",
        statusMsg: "",
      });
      if (get().mode !== "custom") {
        get().recomputeScenes();
      } else if (get().timelineText.trim()) {
        get().applyTimeline();
      }
      await get().persist();
    } catch (e) {
      set({
        status: "error",
        statusMsg: e instanceof Error ? e.message : "Gagal membaca audio",
      });
    }
  },

  addImages: async (files) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    set({ status: "loading", statusMsg: "Memuat gambar…" });
    const next: StudioImage[] = [];
    for (const file of list) {
      const blob = file.slice(0, file.size, file.type);
      next.push({
        id: uid(),
        name: file.name,
        blob,
        url: URL.createObjectURL(blob),
      });
    }
    const merged = sortImages([...get().images, ...next]);
    set({ images: merged, status: "idle", statusMsg: "" });
    if (get().mode === "custom" && get().timelineText.trim()) {
      get().applyTimeline();
    } else {
      get().recomputeScenes();
    }
    await get().persist();
  },

  removeImage: (id) => {
    const images = get().images.filter((img) => {
      if (img.id === id) {
        try {
          URL.revokeObjectURL(img.url);
        } catch {
          /* ignore */
        }
        return false;
      }
      return true;
    });
    set({ images });
    if (get().mode === "custom" && get().timelineText.trim()) {
      get().applyTimeline();
    } else {
      get().recomputeScenes();
    }
    void get().persist();
  },

  clearImages: () => {
    revokeAll(get().images);
    set({ images: [], scenes: get().mode === "custom" ? get().scenes : [] });
    void get().persist();
  },

  setMode: (mode) => {
    set({ mode, timelineError: null });
    if (mode === "custom") {
      if (get().timelineText.trim()) get().applyTimeline();
    } else {
      get().recomputeScenes();
    }
    void get().persist();
  },

  setTimelineText: (text) => set({ timelineText: text, timelineError: null }),

  applyTimeline: () => {
    const text = get().timelineText;
    const result = parseTimelineScript(text);
    if (!result.ok) {
      set({ timelineError: result.error, scenes: [] });
      return;
    }
    const { scenes, count, lastEnd } = result;
    const imgCount = get().images.length;
    let msg: string | null = null;
    if (imgCount > 0 && imgCount !== count) {
      msg = `Jumlah gambar (${imgCount}) ≠ jumlah scene di skrip (${count}). Urutan gambar harus 1→${count}.`;
    }
    const audioDur = get().audioDuration;
    if (audioDur > 0 && Math.abs(lastEnd - audioDur) > 1.5) {
      const note = `Timeline berakhir di ${lastEnd.toFixed(1)}s, audio ${audioDur.toFixed(1)}s. Visual ikut skrip.`;
      msg = msg ? `${msg} ${note}` : note;
    }
    set({
      scenes,
      mode: "custom",
      timelineError: msg,
      status: "idle",
      statusMsg: msg ? "" : `Timeline diterapkan: ${count} scene`,
    });
    void get().persist();
  },

  recomputeScenes: () => {
    const { audioBuffer, images, mode } = get();
    if (!audioBuffer || images.length === 0) {
      if (mode !== "custom") set({ scenes: [] });
      return;
    }
    const duration = audioBuffer.duration;
    const count = images.length;
    if (mode === "even") {
      set({ scenes: evenSplit(duration, count), timelineError: null });
    } else if (mode === "breath") {
      const channel = monoChannel(audioBuffer);
      const plan = speechAwareSplit(channel, audioBuffer.sampleRate, duration, count);
      set({ scenes: plan.scenes, timelineError: null });
    }
    void get().persist();
  },

  setAspect: (aspect) => {
    set({ aspect });
    void get().persist();
  },
  setFit: (fit) => {
    set({ fit });
    void get().persist();
  },
  setMotion: (motion) => {
    set({ motion });
    void get().persist();
  },
  setResolution: (resolution) => {
    set({ resolution });
    void get().persist();
  },

  setStatus: (status, msg = "") => set({ status, statusMsg: msg }),
  setExportProgress: (ratio, label) =>
    set({
      exportProgress: ratio,
      statusMsg: label ?? get().statusMsg,
      status: ratio >= 1 ? "idle" : "exporting",
    }),

  persist: async () => {
    const s = get();
    const project: SavedProject = {
      audioBlob: s.audioBlob,
      audioName: s.audioName,
      images: s.images.map(
        (img): SavedImage => ({
          id: img.id,
          name: img.name,
          blob: img.blob,
        }),
      ),
      scenes: s.scenes,
      mode: s.mode,
      aspect: s.aspect,
      fit: s.fit,
      motion: s.motion,
      resolution: s.resolution,
    };
    try {
      await saveProject(project);
    } catch (e) {
      console.warn("persist failed", e);
    }
  },

  resetAll: async () => {
    revokeAll(get().images);
    set({
      audioBuffer: null,
      audioBlob: null,
      audioName: null,
      audioDuration: 0,
      images: [],
      scenes: [],
      timelineText: "",
      timelineError: null,
      status: "idle",
      statusMsg: "",
      exportProgress: 0,
    });
    await clearProject();
  },
}));

export function getExportReady(): {
  ok: boolean;
  reason?: string;
  scenes: SceneSpan[];
  images: StudioImage[];
  audioBuffer: AudioBuffer;
} {
  const s = useStudioStore.getState();
  if (!s.audioBuffer)
    return {
      ok: false,
      reason: "Audio belum diunggah.",
      scenes: [],
      images: [],
      audioBuffer: null as never,
    };
  if (s.images.length === 0)
    return {
      ok: false,
      reason: "Gambar scene belum diunggah.",
      scenes: [],
      images: [],
      audioBuffer: s.audioBuffer,
    };
  if (s.scenes.length === 0) {
    return {
      ok: false,
      reason:
        s.mode === "custom"
          ? "Paste timeline skrip dulu, lalu klik Terapkan Timeline."
          : "Belum ada potongan scene. Coba hitung ulang.",
      scenes: [],
      images: s.images,
      audioBuffer: s.audioBuffer,
    };
  }
  if (s.scenes.length !== s.images.length) {
    return {
      ok: false,
      reason: `Jumlah scene (${s.scenes.length}) harus sama dengan jumlah gambar (${s.images.length}).`,
      scenes: s.scenes,
      images: s.images,
      audioBuffer: s.audioBuffer,
    };
  }
  return { ok: true, scenes: s.scenes, images: s.images, audioBuffer: s.audioBuffer };
}

export { frameSize };
