import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  FolderOpen,
  ImagePlus,
  Music,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { exportMp4 } from "@/lib/export-video";
import {
  ASPECTS,
  estimateMegabytes,
  formatClock,
  formatSeconds,
  frameSize,
  type AspectId,
  type Resolution,
} from "@/lib/format";
import { sceneIndexAt } from "@/lib/timing";
import { takeAudioAndImages, useStudio } from "@/lib/studio-store";

type ExportJob = {
  running: boolean;
  progress: number;
  label: string;
  error: string | null;
  url: string | null;
  filename: string;
};

export function Studio() {
  const boot = useStudio((s) => s.boot);
  const audioUrl = useStudio((s) => s.audioUrl);
  const audioName = useStudio((s) => s.audioName);
  const audioBuffer = useStudio((s) => s.audioBuffer);
  const duration = useStudio((s) => s.duration);
  const images = useStudio((s) => s.images);
  const scenes = useStudio((s) => s.scenes);
  const mode = useStudio((s) => s.mode);
  const aspect = useStudio((s) => s.aspect);
  const fit = useStudio((s) => s.fit);
  const motion = useStudio((s) => s.motion);
  const resolution = useStudio((s) => s.resolution);
  const note = useStudio((s) => s.note);
  const storageWarning = useStudio((s) => s.storageWarning);
  const addAudio = useStudio((s) => s.addAudio);
  const addImages = useStudio((s) => s.addImages);
  const removeImage = useStudio((s) => s.removeImage);
  const moveImage = useStudio((s) => s.moveImage);
  const reorder = useStudio((s) => s.reorder);
  const sortByName = useStudio((s) => s.sortByName);
  const setMode = useStudio((s) => s.setMode);
  const updateBoundary = useStudio((s) => s.updateBoundary);
  const setAspect = useStudio((s) => s.setAspect);
  const setFit = useStudio((s) => s.setFit);
  const setMotion = useStudio((s) => s.setMotion);
  const setResolution = useStudio((s) => s.setResolution);
  const reset = useStudio((s) => s.reset);

  const audioRef = useRef<HTMLAudioElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef({ images, scenes, motion, fit, duration, audioUrl });
  stateRef.current = { images, scenes, motion, fit, duration, audioUrl };
  const sceneCursor = useRef(-1);

  const [playing, setPlaying] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selected, setSelected] = useState(0);
  const [hot, setHot] = useState(false);
  const [job, setJob] = useState<ExportJob | null>(null);
  const dragDepth = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    void boot();
  }, [boot]);

  useEffect(() => {
    if (selected > images.length - 1) setSelected(Math.max(0, images.length - 1));
  }, [images.length, selected]);

  useEffect(() => {
    if (!playing) return;
    document.getElementById(`scene-${sceneIndex}`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [sceneIndex, playing]);

  useEffect(() => {
    let frame = 0;
    const paint = (time: number) => {
      const snap = stateRef.current;
      const index = sceneIndexAt(snap.scenes, time);
      if (index !== sceneCursor.current) {
        sceneCursor.current = index;
        if (index >= 0) setSceneIndex(index);
      }
      if (timeRef.current) timeRef.current.textContent = formatClock(time);
      if (playheadRef.current && snap.duration > 0) {
        playheadRef.current.style.left = `${(time / snap.duration) * 100}%`;
      }
      const scrub = scrubRef.current;
      if (scrub && document.activeElement !== scrub) scrub.value = String(time);
      const photo = photoRef.current;
      const scene = index >= 0 ? snap.scenes[index] : null;
      if (!photo || !scene) return;
      const span = Math.max(0.001, scene.end - scene.start);
      const p = Math.min(1, Math.max(0, (time - scene.start) / span));
      photo.style.objectFit = snap.fit;
      if (!snap.motion) {
        photo.style.transform = "none";
        return;
      }
      const dir = index % 2 === 0 ? 1 : -1;
      const zoom = 1.08 + 0.05 * p;
      const x = dir * 2.4 * (p - 0.5) * 2;
      const y = -1.2 * (p - 0.5) * 2;
      photo.style.transform = `scale(${zoom}) translate(${x}%, ${y}%)`;
    };

    const loop = () => {
      paint(audioRef.current?.currentTime ?? 0);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, select, a")) return;
      event.preventDefault();
      void toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function seek(time: number) {
    const audio = audioRef.current;
    const next = Math.min(Math.max(0, time), stateRef.current.duration || 0);
    if (audio && stateRef.current.audioUrl) audio.currentTime = next;
  }

  async function toggle() {
    const audio = audioRef.current;
    if (!audio || !stateRef.current.audioUrl) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function ingest(list: FileList | File[]) {
    const { audio, images: pics } = takeAudioAndImages([...list]);
    if (audio) void addAudio(audio);
    if (pics.length) void addImages(pics);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setHot(false);
    ingest(event.dataTransfer.files);
  }

  async function startExport() {
    const snap = useStudio.getState();
    if (!snap.audioBuffer || snap.scenes.length !== snap.images.length || snap.images.length === 0) return;
    if (job?.url) URL.revokeObjectURL(job.url);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const filename = `adegan-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.mp4`;
    setJob({ running: true, progress: 0, label: "Menyiapkan…", error: null, url: null, filename });
    try {
      const blob = await exportMp4({
        scenes: snap.scenes,
        images: snap.images.map((img) => ({ blob: img.blob, width: img.width, height: img.height })),
        audioBuffer: snap.audioBuffer,
        aspect: snap.aspect,
        resolution: snap.resolution,
        motion: snap.motion,
        fit: snap.fit,
        signal: ctrl.signal,
        onProgress: (progress, label) => {
          setJob((current) => (current ? { ...current, progress, label } : current));
        },
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setJob({ running: false, progress: 1, label: "MP4 siap", error: null, url, filename });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setJob(null);
        return;
      }
      const message = error instanceof Error ? error.message : "Ekspor gagal.";
      setJob({ running: false, progress: 0, label: "Gagal", error: message, url: null, filename });
    }
  }

  function closeJob() {
    if (job?.url) URL.revokeObjectURL(job.url);
    setJob(null);
  }

  const ratio = ASPECTS[aspect];
  const size = frameSize(aspect, resolution);
  const megabytes =
    duration > 0 ? estimateMegabytes(size.width, size.height, duration, motion) : 0;
  const ready = Boolean(audioBuffer) && images.length > 0 && scenes.length === images.length;
  const active = images[sceneIndex];
  const picked = images[selected];
  const summary =
    images.length > 0 && duration > 0
      ? `${images.length} scene · ${formatClock(duration)}`
      : images.length > 0
        ? `${images.length} gambar, audio belum masuk`
        : audioName
          ? audioName
          : "Audio + gambar scene";

  return (
    <main
      className="studio-shell"
      data-hot={hot ? "true" : "false"}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setHot(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setHot(false);
        }
      }}
      onDrop={onDrop}
    >
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <header className="studio-top flex items-center gap-3 px-4 py-3">
        <Film className="size-5 shrink-0 text-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl leading-none">Adegan</h1>
          <p className="mt-1 truncate text-sm text-muted">{summary}</p>
        </div>
        <button className="btn btn-primary shrink-0" type="button" disabled={!ready || job?.running} onClick={() => void startExport()}>
          <Download className="size-4" aria-hidden="true" />
          Unduh MP4
        </button>
      </header>

      <section className="studio-stage stage-col">
        <div className="stage-frame">
          <div
            className="stage-aspect"
            style={{ ["--aw" as string]: String(ratio.w), ["--ah" as string]: String(ratio.h) }}
          >
            {images[sceneIndex] ? (
              <img ref={photoRef} className="stage-photo" src={images[sceneIndex].url} alt="" />
            ) : null}
            {images.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="font-serif text-2xl">Taruh cerita di sini</p>
                <p className="hint max-w-xs">
                  Jatuhkan audio narasi dan gambar scene. Urutan file jadi urutan visual.
                </p>
              </div>
            ) : (
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-bg/80 px-3 py-1 text-sm tabular-nums">
                Scene {Math.min(images.length, sceneIndex + 1)} / {images.length}
                {active ? ` · ${active.name}` : ""}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="icon-btn" type="button" onClick={() => void toggle()} disabled={!audioUrl} aria-label={playing ? "Jeda" : "Putar"}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <span ref={timeRef} className="w-16 shrink-0 text-sm tabular-nums">
            0:00.0
          </span>
          <input
            ref={scrubRef}
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            defaultValue={0}
            disabled={!audioUrl}
            aria-label="Geser waktu"
            onChange={(event) => seek(Number(event.currentTarget.value))}
          />
          <span className="w-16 shrink-0 text-right text-sm text-muted tabular-nums">
            {formatClock(duration)}
          </span>
        </div>
      </section>

      <aside className="studio-panel panel-scroll">
        <div>
          <p className="field-label">Audio</p>
          <div className="file-row">
            <p className="min-w-0 truncate text-sm text-muted">{audioName ?? "Belum ada narasi"}</p>
            <button className="btn btn-ghost" type="button" onClick={() => audioInputRef.current?.click()}>
              <Music className="size-4" aria-hidden="true" />
              Pilih
            </button>
          </div>
          <input
            ref={audioInputRef}
            className="hidden"
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.aac"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void addAudio(file);
              event.currentTarget.value = "";
            }}
          />
        </div>

        <div>
          <p className="field-label">Gambar scene</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" type="button" onClick={() => imageInputRef.current?.click()}>
              <ImagePlus className="size-4" aria-hidden="true" />
              Gambar
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => folderInputRef.current?.click()}>
              <FolderOpen className="size-4" aria-hidden="true" />
              Folder
            </button>
            <button className="btn btn-ghost" type="button" onClick={sortByName} disabled={images.length < 2}>
              Urutkan nama
            </button>
          </div>
          <input
            ref={imageInputRef}
            className="hidden"
            type="file"
            accept="image/*,.png,.jpg,.jpeg,.webp,.gif"
            multiple
            onChange={(event) => {
              if (event.currentTarget.files?.length) void addImages([...event.currentTarget.files]);
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={(node) => {
              folderInputRef.current = node;
              node?.setAttribute("webkitdirectory", "");
              node?.setAttribute("multiple", "");
            }}
            className="hidden"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              if (event.currentTarget.files?.length) void addImages([...event.currentTarget.files]);
              event.currentTarget.value = "";
            }}
          />
          <p className="hint mt-2">
            Nama file yang berangka diurutkan benar: scene-2 sebelum scene-10. Bisa juga geser thumbnail.
          </p>
        </div>

        <div>
          <p className="field-label">Potongan</p>
          <div className="segment" role="radiogroup" aria-label="Cara memotong">
            {(
              [
                ["breath", "Napas"],
                ["even", "Rata"],
                ["custom", "Manual"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)}>
                {label}
              </button>
            ))}
          </div>
          <p className="hint mt-2">{note || "Napas menempelkan ganti scene ke jeda ucapan terdekat."}</p>
        </div>

        <div>
          <p className="field-label">Bingkai</p>
          <div className="segment" role="radiogroup" aria-label="Rasio">
            {(Object.keys(ASPECTS) as AspectId[]).map((id) => (
              <button key={id} type="button" role="radio" aria-checked={aspect === id} onClick={() => setAspect(id)}>
                {ASPECTS[id].label}
              </button>
            ))}
          </div>
          <p className="hint mt-2">{ASPECTS[aspect].hint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-ghost" type="button" aria-pressed={fit === "cover"} onClick={() => setFit(fit === "cover" ? "contain" : "cover")}>
              {fit === "cover" ? "Penuh" : "Utuh"}
            </button>
            <button className="btn btn-ghost" type="button" aria-pressed={motion} onClick={() => setMotion(!motion)}>
              {motion ? "Gerak halus" : "Diam"}
            </button>
            {([720, 1080] as Resolution[]).map((value) => (
              <button
                key={value}
                className="btn btn-ghost"
                type="button"
                aria-pressed={resolution === value}
                onClick={() => setResolution(value)}
              >
                {value}p
              </button>
            ))}
          </div>
          <p className="hint mt-2">
            {size.width}×{size.height}
            {megabytes > 0 ? ` · sekitar ${Math.max(1, Math.round(megabytes))} MB` : ""}. Gerak halus lebih hidup, diam lebih cepat diekspor. Video dirakit di browser, tidak diunggah.
          </p>
        </div>

        {picked ? (
          <div>
            <p className="field-label">Scene {selected + 1}</p>
            <p className="truncate text-sm">{picked.name}</p>
            <p className="hint mt-1">
              {scenes[selected]
                ? `${formatClock(scenes[selected].start)} – ${formatClock(scenes[selected].end)} · ${formatSeconds(scenes[selected].end - scenes[selected].start)}`
                : "Durasi menyusul setelah audio masuk."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="icon-btn" type="button" aria-label="Pindah lebih awal" onClick={() => moveImage(picked.id, -1)} disabled={selected === 0}>
                <ChevronLeft className="size-4" />
              </button>
              <button className="icon-btn" type="button" aria-label="Pindah lebih akhir" onClick={() => moveImage(picked.id, 1)} disabled={selected === images.length - 1}>
                <ChevronRight className="size-4" />
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  removeImage(picked.id);
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Hapus scene
              </button>
            </div>
          </div>
        ) : null}

        {storageWarning ? <p className="hint">{storageWarning}</p> : null}

        <button className="btn btn-ghost self-start" type="button" onClick={reset} disabled={!audioName && images.length === 0}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Hapus proyek
        </button>
      </aside>

      <section className="studio-timeline flex flex-col gap-2 px-4 py-3">
        <div
          ref={trackRef}
          className="time-track"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("[data-handle]")) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (rect.width <= 0 || duration <= 0) return;
            seek(((event.clientX - rect.left) / rect.width) * duration);
          }}
        >
          {scenes.map((scene, index) => (
            <div
              key={`${scene.start}-${index}`}
              className="time-chunk"
              data-active={index === sceneIndex ? "true" : "false"}
              style={{ flexGrow: Math.max(0.05, scene.end - scene.start) }}
            >
              {index < scenes.length - 1 ? (
                <button
                  type="button"
                  data-handle
                  className="handle"
                  aria-label={`Geser batas scene ${index + 1}`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    const handle = event.currentTarget;
                    handle.setPointerCapture(event.pointerId);
                    let raf = 0;
                    let pending = scene.end;
                    const move = (ev: PointerEvent) => {
                      const track = trackRef.current;
                      if (!track || duration <= 0) return;
                      const rect = track.getBoundingClientRect();
                      const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
                      pending = ratio * duration;
                      if (!raf) {
                        raf = requestAnimationFrame(() => {
                          raf = 0;
                          updateBoundary(index, pending);
                        });
                      }
                    };
                    const up = () => {
                      handle.removeEventListener("pointermove", move);
                      handle.removeEventListener("pointerup", up);
                      if (raf) cancelAnimationFrame(raf);
                      updateBoundary(index, pending);
                    };
                    handle.addEventListener("pointermove", move);
                    handle.addEventListener("pointerup", up);
                  }}
                />
              ) : null}
            </div>
          ))}
          {duration > 0 ? <div ref={playheadRef} className="playhead" style={{ left: "0%" }} /> : null}
        </div>
        <div className="chip-row">
          {images.map((img, index) => (
            <div
              key={img.id}
              id={`scene-${index}`}
              className="scene-chip"
              data-active={index === sceneIndex || index === selected ? "true" : "false"}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", img.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                reorder(event.dataTransfer.getData("text/plain"), img.id);
              }}
            >
              <button
                type="button"
                className="block w-full bg-transparent p-0 text-left text-fg"
                onClick={() => {
                  setSelected(index);
                  if (scenes[index]) seek(scenes[index].start);
                }}
              >
                <img src={img.url} alt="" />
                <span className="mt-1 block truncate text-sm tabular-nums">
                  {index + 1}
                  {scenes[index] ? ` · ${formatSeconds(scenes[index].end - scenes[index].start)}` : ""}
                </span>
              </button>
            </div>
          ))}
          {images.length === 0 ? <p className="hint">Timeline muncul setelah gambar masuk.</p> : null}
        </div>
      </section>

      {job ? (
        <div className="scrim" role="dialog" aria-modal="true" aria-label="Ekspor MP4">
          <div className="dialog">
            <h2 className="font-serif text-2xl">{job.error ? "Ekspor gagal" : job.url ? "MP4 siap" : "Merakit video"}</h2>
            <p className="hint mt-2">{job.error ?? (job.url ? "Kalau unduhan tidak mulai, pakai tautan di bawah." : job.label)}</p>
            {job.running ? (
              <div className="bar mt-4" aria-hidden="true">
                <span style={{ width: `${Math.round(job.progress * 100)}%` }} />
              </div>
            ) : null}
            {job.running ? <p className="mt-2 text-sm tabular-nums">{Math.round(job.progress * 100)}%</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {job.running ? (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                >
                  Batal
                </button>
              ) : (
                <button className="btn btn-primary" type="button" onClick={closeJob}>
                  Tutup
                </button>
              )}
              {job.url ? (
                <a className="btn btn-ghost" href={job.url} download={job.filename}>
                  Unduh lagi
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
