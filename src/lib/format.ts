export type AspectId = "9:16" | "4:5" | "1:1" | "16:9";
export type Resolution = 720 | 1080;
export type FitMode = "cover" | "contain";
export type SyncMode = "breath" | "even" | "custom";

export const ASPECTS: Record<AspectId, { w: number; h: number; label: string; hint: string }> = {
  "9:16": { w: 9, h: 16, label: "9:16", hint: "Vertikal" },
  "4:5": { w: 4, h: 5, label: "4:5", hint: "Potret" },
  "1:1": { w: 1, h: 1, label: "1:1", hint: "Kotak" },
  "16:9": { w: 16, h: 9, label: "16:9", hint: "Lebar" },
};

export function frameSize(
  aspect: AspectId,
  resolution: Resolution,
): { width: number; height: number } {
  const { w, h } = ASPECTS[aspect];
  const shortSide = resolution === 1080 ? 1080 : 720;
  let width: number;
  let height: number;
  if (w === h) {
    width = shortSide;
    height = shortSide;
  } else if (h > w) {
    width = shortSide;
    height = Math.round((shortSide * h) / w);
  } else {
    height = shortSide;
    width = Math.round((shortSide * w) / h);
  }
  if (width % 2) width -= 1;
  if (height % 2) height -= 1;
  return { width, height };
}

export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, "id", { numeric: true, sensitivity: "base" });
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const whole = Math.floor(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  const tenth = Math.floor((seconds - whole) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${tenth}`;
}

export function formatSeconds(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0s";
  if (value >= 10) return `${Math.round(value)}s`;
  return `${value.toFixed(1)}s`;
}

export function estimateMegabytes(
  width: number,
  height: number,
  duration: number,
  motion: boolean,
): number {
  const video = width * height * (motion ? 3.2 : 2.4);
  return ((video + 128_000) * duration) / 8 / 1_000_000;
}
