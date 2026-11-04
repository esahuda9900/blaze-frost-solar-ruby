import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ImagePlus,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { ASPECTS, formatClock, formatSeconds, type AspectId, type SyncMode } from "@/lib/format";
import { sceneIndexAt } from "@/lib/timing";
import { exportMp4 } from "@/lib/export-video";
import { getExportReady, useStudioStore, type StudioImage } from "@/lib/studio-store";

function useHydrate() {
  const hydrate = useStudioStore((s) => s.hydrate);
  const hydrated = useStudioStore((s) => s.hydrated);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return hydrated;
}

function DropZone({
  onFiles,
  accept,
  label,
  hint,
  multiple,
}: {
  onFiles: (files: FileList | File[]) => void;
  accept: string;
  label: string;
  hint: string;
  multiple?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setHot(false);
      if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );
  return (
    <div
      className="drop-ring rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-fg)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-fg)_4%,transparent)] p-4 transition-shadow"
      data-hot={hot ? "true" : "false"}
      onDragOver={(e) => {
        e.preventDefault();
        setHot(true);
      }}
      onDragLeave={() => setHot(false)}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-start gap-2">
        <p className="font-medium">{label}</p>
        <p className="hint">{hint}</p>
        <button
          type="button"
          className="btn btn-ghost mt-1"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          Pilih file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function SceneStrip({
  images,
  scenes,
  currentIndex,
  onSeek,
}: {
  images: StudioImage[];
  scenes: { start: number; end: number }[];
  currentIndex: number;
  onSeek: (t: number) => void;
}) {
  if (images.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-1">
      {images.map((img, i) => {
        const scene = scenes[i];
        const active = i === currentIndex;
        const dur = scene ? scene.end - scene.start : 0;
        return (
          <button
            key={img.id}
            type="button"
            className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              active ? "border-[var(--color-accent)] scale-105" : "border-transparent opacity-80"
            }`}
            title={`${img.name} ${scene ? formatClock(scene.start) + "–" + formatClock(scene.end) : ""}`}
            onClick={() => scene && onSeek(scene.start + 0.01)}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-center py-0.5">
              {i + 1}
              {dur > 0 ? ` · ${formatSeconds(dur)}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Studio() {
  const hydrated = useHydrate();
  const {
    audioBuffer,
    audioName,
    audioDuration,
    images,
    scenes,
    mode,
    timelineText,
    timelineError,
    aspect,
    fit,
    motion,
    resolution,
    status,
    statusMsg,
    exportProgress,
    setAudio,
    addImages,
    removeImage,
    clearImages,
    setMode,
    setTimelineText,
    applyTimeline,
    recomputeScenes,
    setAspect,
    setFit,
    setMotion,
    setResolution,
    setStatus,
    setExportProgress,
    resetAll,
  } = useStudioStore();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentIndex = useMemo(
    () => (scenes.length ? sceneIndexAt(scenes, currentTime) : -1),
    [scenes, currentTime],
  );

  useEffect(() => {
    if (currentIndex < 0 || !images[currentIndex]) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(images[currentIndex].url);
  }, [currentIndex, images]);

  useEffect(() => {
    if (!audioBuffer) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlaying(false);
      setCurrentTime(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const offline = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate,
      );
      const src = offline.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(offline.destination);
      src.start(0);
      const rendered = await offline.startRendering();
      if (cancelled) return;
      const wav = audioBufferToWav(rendered);
      const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
      const el = new Audio(url);
      el.preload = "auto";
      audioRef.current = el;
      el.addEventListener("ended", () => {
        setPlaying(false);
        setCurrentTime(audioBuffer.duration);
      });
      return () => URL.revokeObjectURL(url);
    })();
    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioBuffer]);

  useEffect(() => {
    if (!playing || !audioRef.current) return;
    const tick = () => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const seekTo = (t: number) => {
    const el = audioRef.current;
    const clamped = Math.max(0, Math.min(t, audioDuration || 0));
    setCurrentTime(clamped);
    if (el) el.currentTime = clamped;
  };

  const onExport = async () => {
    const ready = getExportReady();
    if (!ready.ok) {
      setStatus("error", ready.reason ?? "Belum siap export");
      return;
    }
    const ac = new AbortController();
    setStatus("exporting", "Menyiapkan ekspor…");
    setExportProgress(0.01, "Mulai…");
    try {
      const blob = await exportMp4({
        scenes: ready.scenes,
        images: ready.images.map((img) => ({
          blob: img.blob,
          width: 0,
          height: 0,
        })),
        audioBuffer: ready.audioBuffer,
        aspect,
        resolution,
        motion,
        fit,
        signal: ac.signal,
        onProgress: (r, label) => setExportProgress(r, label),
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `adegan-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus("idle", "MP4 siap diunduh");
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") {
        setStatus("idle", "Dibatalkan");
      } else {
        setStatus("error", e instanceof Error ? e.message : "Gagal export");
      }
    }
  };

  const aspectMeta = ASPECTS[aspect];
  const canExport =
    !!audioBuffer &&
    images.length > 0 &&
    scenes.length === images.length &&
    status !== "exporting";

  if (!hydrated) {
    return (
      <div className="studio-shell grid place-items-center">
        <p className="hint">Memuat studio…</p>
      </div>
    );
  }

  return (
    <div className="studio-shell" data-hot="false">
      <header className="studio-top flex items-center justify-between gap-3 px-4 py-3 border-b border-[color-mix(in_srgb,var(--color-fg)_12%,transparent)]">
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Adegan
          </h1>
          <p className="text-xs text-[var(--color-muted)]">Audio + gambar scene · timing rigid dari skrip</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void resetAll()}
            title="Reset semua"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canExport}
            onClick={() => void onExport()}
          >
            <Download className="size-4" />
            Unduh MP4
          </button>
        </div>
      </header>

      <section className="studio-stage stage-col">
        <div className="stage-frame">
          <div
            className="stage-aspect"
            style={
              {
                "--aw": aspectMeta.w,
                "--ah": aspectMeta.h,
              } as React.CSSProperties
            }
          >
            {previewUrl ? (
              <img src={previewUrl} alt="" className="stage-photo" style={{ objectFit: fit }} />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-[var(--color-muted)] text-sm p-6 text-center leading-relaxed whitespace-pre-line">
                {scenes.length === 0
                  ? "1. Paste timeline skrip di panel → Terapkan\n2. Upload audio + gambar PO (1)…PO (n)\n3. Play cek sinkron, lalu Unduh MP4"
                  : images.length === 0
                    ? `Timeline aktif (${scenes.length} scene).\nUpload gambar PO (1) sampai PO (${scenes.length}).`
                    : "Preview muncul setelah audio + gambar terhubung ke scene."}
              </div>
            )}
            {scenes.length > 0 && currentIndex >= 0 && (
              <div className="absolute top-2 left-2 right-2 flex justify-between text-[11px] font-medium pointer-events-none">
                <span className="bg-black/55 rounded-full px-2 py-0.5">
                  Scene {currentIndex + 1}/{images.length}
                </span>
                <span className="bg-black/55 rounded-full px-2 py-0.5">
                  {formatClock(currentTime)} / {formatClock(audioDuration)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <button
            type="button"
            className="icon-btn"
            disabled={!audioBuffer}
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={audioDuration || 1}
              step={0.01}
              value={Math.min(currentTime, audioDuration || 0)}
              disabled={!audioBuffer}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
          <span className="text-xs tabular-nums text-[var(--color-muted)] w-20 text-right">
            {formatClock(currentTime)}
          </span>
        </div>

        <SceneStrip
          images={images}
          scenes={scenes}
          currentIndex={currentIndex}
          onSeek={seekTo}
        />
      </section>

      <aside className="studio-panel panel-scroll">
        <div
          id="timeline-script"
          className="rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))] p-3"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="field-label mb-0">① Timeline skrip</p>
            <span className="text-[10px] uppercase tracking-wide text-[var(--color-accent)] font-semibold">
              Wajib untuk ekspor
            </span>
          </div>
          <p className="hint mt-0 mb-2 text-xs">
            Paste skrip di sini. File <strong>PO (1)</strong> = Scene 1, <strong>PO (2)</strong> = Scene 2, dst.
            Preview & MP4 mengikuti jam skrip.
          </p>
          <textarea
            className="w-full min-h-[12rem] rounded-xl bg-[var(--color-bg)] border border-[color-mix(in_srgb,var(--color-fg)_18%,transparent)] p-3 text-sm font-mono leading-relaxed resize-y"
            placeholder={`* Scene 1 [00:00 - 00:05]\n* Scene 2 [00:05 - 00:12]\n* Scene 3 [00:12 - 00:18]\n…`}
            value={timelineText}
            onChange={(e) => setTimelineText(e.target.value)}
            spellCheck={false}
            aria-label="Timeline skrip scene"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" onClick={applyTimeline}>
              Terapkan Timeline
            </button>
            {scenes.length > 0 && (
              <span className="text-xs text-[var(--color-muted)]">
                {scenes.length} scene · sampai {formatSeconds(scenes[scenes.length - 1]?.end ?? 0)}
              </span>
            )}
          </div>
          {timelineError && (
            <p className="mt-2 text-sm text-amber-300/90 leading-snug">{timelineError}</p>
          )}
          {!timelineError && scenes.length > 0 && mode === "custom" && (
            <p className="mt-2 text-xs text-emerald-300/90">
              ✓ Timeline aktif. Upload {scenes.length} gambar: PO (1) → PO ({scenes.length}).
            </p>
          )}
        </div>

        <div>
          <p className="field-label">Mode sinkron</p>
          <div className="segment" role="radiogroup">
            {(
              [
                ["custom", "Skrip"],
                ["breath", "Napas"],
                ["even", "Rata"],
              ] as [SyncMode, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => setMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="hint mt-2">
            {mode === "custom"
              ? "Durasi tiap gambar mengikuti timeline skrip di atas (paling akurat)."
              : mode === "breath"
                ? "Potong di jeda napas natural suara. Timeline di atas diabaikan."
                : "Bagi rata sepanjang audio. Timeline di atas diabaikan."}
          </p>
          {mode !== "custom" && (
            <button
              type="button"
              className="btn btn-ghost w-full mt-2"
              onClick={recomputeScenes}
              disabled={!audioBuffer || images.length === 0}
            >
              Hitung ulang potongan
            </button>
          )}
        </div>

        <div>
          <p className="field-label">Audio</p>
          {audioName ? (
            <div className="file-row rounded-xl bg-[var(--color-surface)] px-3">
              <div className="flex items-center gap-2 min-w-0">
                <Music2 className="size-4 shrink-0 text-[var(--color-accent)]" />
                <span className="truncate text-sm">{audioName}</span>
                <span className="text-xs text-[var(--color-muted)] shrink-0">
                  {formatSeconds(audioDuration)}
                </span>
              </div>
              <button type="button" className="icon-btn !w-9 !h-9" onClick={() => void setAudio(null)}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : (
            <DropZone
              accept="audio/*"
              label="Audio narasi"
              hint="WAV / MP3 / M4A. Satu file."
              onFiles={(files) => void setAudio(Array.from(files)[0] ?? null)}
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="field-label mb-0">Gambar scene ({images.length})</p>
            {images.length > 0 && (
              <button type="button" className="text-xs text-[var(--color-muted)] underline" onClick={clearImages}>
                Hapus semua
              </button>
            )}
          </div>
          <DropZone
            accept="image/*"
            multiple
            label="Upload PO (1) … PO (n)"
            hint="Nama file PO (1) … PO (n). PO (n) = Scene n di skrip."
            onFiles={(files) => void addImages(files)}
          />
          {images.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 text-sm">
              {images.map((img) => {
                const po = /po\s*[\(\[\-_]?\s*(\d+)/i.exec(img.name);
                const n = po ? Number(po[1]) : 0;
                const scene = n > 0 ? scenes[n - 1] : undefined;
                const dur = scene ? scene.end - scene.start : 0;
                return (
                  <li key={img.id} className="flex items-center gap-2 py-1">
                    <img src={img.url} alt="" className="w-8 h-8 rounded object-cover" />
                    <span className="flex-1 truncate">
                      {n > 0 ? `PO (${n})` : img.name}
                      <span className="text-[var(--color-muted)]"> · {img.name}</span>
                    </span>
                    <span className="text-xs tabular-nums text-[var(--color-accent)] shrink-0">
                      {dur > 0 ? formatSeconds(dur) : "—"}
                    </span>
                    <button type="button" className="text-[var(--color-muted)]" onClick={() => removeImage(img.id)}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <p className="field-label">Aspect & kualitas</p>
          <div className="segment mb-2">
            {(Object.keys(ASPECTS) as AspectId[]).map((id) => (
              <button
                key={id}
                type="button"
                aria-checked={aspect === id}
                onClick={() => setAspect(id)}
              >
                {ASPECTS[id].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-ghost !min-h-9 text-sm"
              aria-pressed={fit === "cover"}
              onClick={() => setFit(fit === "cover" ? "contain" : "cover")}
            >
              Fit: {fit}
            </button>
            <button
              type="button"
              className="btn btn-ghost !min-h-9 text-sm"
              aria-pressed={motion}
              onClick={() => setMotion(!motion)}
            >
              Motion: {motion ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              className="btn btn-ghost !min-h-9 text-sm"
              onClick={() => setResolution(resolution === 1080 ? 720 : 1080)}
            >
              {resolution}p
            </button>
          </div>
        </div>

        {(status === "exporting" || statusMsg) && (
          <div className="rounded-xl bg-[var(--color-surface)] p-3 text-sm">
            {status === "exporting" && (
              <div className="mb-2 h-1.5 rounded-full bg-black/30 overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] transition-all"
                  style={{ width: `${Math.round(exportProgress * 100)}%` }}
                />
              </div>
            )}
            <p className={status === "error" ? "text-red-300" : "text-[var(--color-muted)]"}>
              {statusMsg || (status === "exporting" ? "Mengekspor…" : "")}
            </p>
          </div>
        )}
      </aside>

      <footer className="studio-timeline border-t border-[color-mix(in_srgb,var(--color-fg)_12%,transparent)] px-4 py-2 flex items-center gap-3 overflow-x-auto">
        <ImagePlus className="size-4 shrink-0 text-[var(--color-muted)]" />
        {scenes.length === 0 ? (
          <p className="hint m-0">1. Paste timeline di panel → 2. Terapkan → 3. Upload gambar PO (1)…PO (n).</p>
        ) : (
          <div className="flex gap-1.5 text-[11px] tabular-nums">
            {scenes.slice(0, 24).map((s, i) => (
              <button
                key={i}
                type="button"
                className={`rounded px-1.5 py-0.5 ${
                  i === currentIndex ? "bg-[var(--color-accent)] text-[var(--color-bg)]" : "bg-[var(--color-surface)]"
                }`}
                onClick={() => seekTo(s.start + 0.01)}
              >
                {i + 1}:{formatSeconds(s.end - s.start)}
              </button>
            ))}
            {scenes.length > 24 && <span className="text-[var(--color-muted)] self-center">+{scenes.length - 24}</span>}
          </div>
        )}
      </footer>
    </div>
  );
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const length = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
