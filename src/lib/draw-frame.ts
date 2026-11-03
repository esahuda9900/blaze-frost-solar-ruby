import type { FitMode } from "@/lib/format";

export const CANVAS_BG = "#12110e";

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource | null,
  imageWidth: number,
  imageHeight: number,
  sceneIndex: number,
  progress: number,
  motion: boolean,
  fit: FitMode,
): void {
  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;
  if (canvasW <= 0 || canvasH <= 0) return;
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, canvasW, canvasH);
  if (!image || imageWidth <= 0 || imageHeight <= 0) return;

  const p = Math.min(1, Math.max(0, progress));
  const dir = sceneIndex % 2 === 0 ? 1 : -1;
  const zoom = motion ? 1.06 + 0.06 * p : 1;
  const scaleBase =
    fit === "cover"
      ? Math.max(canvasW / imageWidth, canvasH / imageHeight)
      : Math.min(canvasW / imageWidth, canvasH / imageHeight);
  const dw = imageWidth * scaleBase * zoom;
  const dh = imageHeight * scaleBase * zoom;
  const travelX = Math.max(0, dw - canvasW) * 0.45;
  const travelY = Math.max(0, dh - canvasH) * 0.25;
  const ox = (canvasW - dw) / 2 + (motion ? dir * travelX * (p - 0.5) * 2 : 0);
  const oy = (canvasH - dh) / 2 + (motion ? -travelY * (p - 0.5) * 2 : 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, ox, oy, dw, dh);
}
