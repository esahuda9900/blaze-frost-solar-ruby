import { drawFrame } from "@/lib/draw-frame";
import { frameSize, type AspectId, type FitMode, type Resolution } from "@/lib/format";
import type { SceneSpan } from "@/lib/timing";
import { sceneIndexAt } from "@/lib/timing";

export type ExportImage = {
  blob: Blob;
  width: number;
  height: number;
};

export type ExportRequest = {
  scenes: SceneSpan[];
  images: ExportImage[];
  audioBuffer: AudioBuffer;
  aspect: AspectId;
  resolution: Resolution;
  motion: boolean;
  fit: FitMode;
  signal: AbortSignal;
  onProgress: (ratio: number, label: string) => void;
};

function sliceAudioBuffer(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const rate = buffer.sampleRate;
  const start = Math.max(0, Math.floor(startSec * rate));
  const end = Math.min(buffer.length, Math.max(start + 1, Math.ceil(endSec * rate)));
  const length = Math.max(1, end - start);
  const out = new AudioBuffer({
    length,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: rate,
  });
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const copy = new Float32Array(length);
    copy.set(buffer.getChannelData(ch).subarray(start, start + length));
    out.copyToChannel(copy, ch);
  }
  return out;
}

async function resample(buffer: AudioBuffer, sampleRate: number): Promise<AudioBuffer> {
  const channels = Math.min(2, Math.max(1, buffer.numberOfChannels));
  if (buffer.sampleRate === sampleRate && buffer.numberOfChannels === channels) return buffer;
  const length = Math.max(1, Math.ceil(buffer.duration * sampleRate));
  const offline = new OfflineAudioContext(channels, length, sampleRate);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0);
  return offline.startRendering();
}

export async function exportMp4(request: ExportRequest): Promise<Blob> {
  if (typeof VideoEncoder === "undefined" || typeof AudioEncoder === "undefined") {
    throw new Error("Browser ini belum bisa membuat MP4. Buka Adegan di Chrome atau Edge.");
  }
  const { scenes, images, aspect, resolution, motion, fit, signal, onProgress } = request;
  if (images.length === 0 || scenes.length !== images.length) {
    throw new Error("Audio dan gambar belum sejajar. Hitung ulang potongannya dulu.");
  }

  const duration = request.audioBuffer.duration;
  const { width, height } = frameSize(aspect, resolution);
  const fps = motion ? 12 : 4;
  const frameDur = 1 / fps;
  const frames: { time: number; dur: number }[] = [];
  for (let time = 0; time < duration - 0.001; time += frameDur) {
    frames.push({ time, dur: Math.min(frameDur, duration - time) });
  }
  if (frames.length === 0) frames.push({ time: 0, dur: Math.max(frameDur, duration) });
  frames[frames.length - 1].dur = Math.max(0.001, duration - frames[frames.length - 1].time);

  onProgress(0.02, "Menyiapkan suara…");
  const audio = await resample(request.audioBuffer, 48_000);
  if (signal.aborted) throw new DOMException("Dibatalkan", "AbortError");

  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, Quality } =
    await import("mediabunny");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Kanvas ekspor tidak tersedia.");

  const videoBitrate = Math.round(
    Math.min(8_000_000, Math.max(1_200_000, width * height * (motion ? 3.2 : 2.4))),
  );
  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  });
  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    quality: new Quality({ bitrate: videoBitrate, bitrateMode: "variable" }),
    keyFrameInterval: 2,
  });
  const audioSource = new AudioBufferSource({
    codec: "aac",
    quality: new Quality({ bitrate: 128_000 }),
  });
  output.addVideoTrack(videoSource);
  output.addAudioTrack(audioSource);

  let bitmap: ImageBitmap | null = null;
  let bitmapIndex = -1;
  let audioUntil = 0;

  const releaseBitmap = () => {
    bitmap?.close();
    bitmap = null;
    bitmapIndex = -1;
  };

  try {
    await output.start();
    const pumpAudio = async (upTo: number) => {
      while (audioUntil < upTo - 0.0001) {
        const end = Math.min(audio.duration, audioUntil + 1);
        await audioSource.add(sliceAudioBuffer(audio, audioUntil, end));
        audioUntil = end;
      }
    };

    for (let i = 0; i < frames.length; i++) {
      if (signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
      const frame = frames[i];
      const index = sceneIndexAt(scenes, Math.min(frame.time, duration - 0.0001));
      const scene = scenes[index];
      const image = images[index];
      if (!scene || !image) continue;
      if (bitmapIndex !== index) {
        releaseBitmap();
        bitmap = await createImageBitmap(image.blob);
        bitmapIndex = index;
      }
      const frameBitmap = bitmap;
      if (!frameBitmap) continue;
      const span = Math.max(0.001, scene.end - scene.start);
      const progress = (frame.time - scene.start) / span;
      drawFrame(ctx, frameBitmap, frameBitmap.width, frameBitmap.height, index, progress, motion, fit);
      await pumpAudio(frame.time + frame.dur);
      await videoSource.add(frame.time, frame.dur, { keyFrame: i % (fps * 2) === 0 });
      if (i % 3 === 0 || i === frames.length - 1) {
        const ratio = 0.04 + (0.92 * (i + 1)) / frames.length;
        onProgress(ratio, `Scene ${index + 1} dari ${images.length}`);
      }
    }
    await pumpAudio(audio.duration);
    onProgress(0.98, "Menutup file…");
    await output.finalize();
    const buffer = target.buffer;
    if (!buffer) throw new Error("File video kosong.");
    onProgress(1, "Selesai");
    return new Blob([buffer], { type: "video/mp4" });
  } catch (error) {
    if (output.state !== "finalized" && output.state !== "canceled") {
      await output.cancel().catch(() => undefined);
    }
    throw error;
  } finally {
    releaseBitmap();
  }
}
