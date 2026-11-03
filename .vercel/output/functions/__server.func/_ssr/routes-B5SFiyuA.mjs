import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, c as FolderOpen, d as ChevronRight, f as ChevronLeft, i as Play, l as Film, n as Trash2, o as Music, r as RotateCcw, s as ImagePlus, u as Download } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B5SFiyuA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CANVAS_BG = "#12110e";
function drawFrame(ctx, image, imageWidth, imageHeight, sceneIndex, progress, motion, fit) {
	const canvasW = ctx.canvas.width;
	const canvasH = ctx.canvas.height;
	if (canvasW <= 0 || canvasH <= 0) return;
	ctx.fillStyle = CANVAS_BG;
	ctx.fillRect(0, 0, canvasW, canvasH);
	if (!image || imageWidth <= 0 || imageHeight <= 0) return;
	const p = Math.min(1, Math.max(0, progress));
	const dir = sceneIndex % 2 === 0 ? 1 : -1;
	const zoom = motion ? 1.06 + .06 * p : 1;
	const scaleBase = fit === "cover" ? Math.max(canvasW / imageWidth, canvasH / imageHeight) : Math.min(canvasW / imageWidth, canvasH / imageHeight);
	const dw = imageWidth * scaleBase * zoom;
	const dh = imageHeight * scaleBase * zoom;
	const travelX = Math.max(0, dw - canvasW) * .45;
	const travelY = Math.max(0, dh - canvasH) * .25;
	const ox = (canvasW - dw) / 2 + (motion ? dir * travelX * (p - .5) * 2 : 0);
	const oy = (canvasH - dh) / 2 + (motion ? -travelY * (p - .5) * 2 : 0);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(image, ox, oy, dw, dh);
}
var ASPECTS = {
	"9:16": {
		w: 9,
		h: 16,
		label: "9:16",
		hint: "Vertikal"
	},
	"4:5": {
		w: 4,
		h: 5,
		label: "4:5",
		hint: "Potret"
	},
	"1:1": {
		w: 1,
		h: 1,
		label: "1:1",
		hint: "Kotak"
	},
	"16:9": {
		w: 16,
		h: 9,
		label: "16:9",
		hint: "Lebar"
	}
};
function frameSize(aspect, resolution) {
	const { w, h } = ASPECTS[aspect];
	const shortSide = resolution === 1080 ? 1080 : 720;
	let width;
	let height;
	if (w === h) {
		width = shortSide;
		height = shortSide;
	} else if (h > w) {
		width = shortSide;
		height = Math.round(shortSide * h / w);
	} else {
		height = shortSide;
		width = Math.round(shortSide * w / h);
	}
	if (width % 2) width -= 1;
	if (height % 2) height -= 1;
	return {
		width,
		height
	};
}
function compareNames(a, b) {
	return a.localeCompare(b, "id", {
		numeric: true,
		sensitivity: "base"
	});
}
function formatClock(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
	const whole = Math.floor(seconds);
	const m = Math.floor(whole / 60);
	const s = whole % 60;
	const tenth = Math.floor((seconds - whole) * 10);
	return `${m}:${s.toString().padStart(2, "0")}.${tenth}`;
}
function formatSeconds(value) {
	if (!Number.isFinite(value) || value < 0) return "0s";
	if (value >= 10) return `${Math.round(value)}s`;
	return `${value.toFixed(1)}s`;
}
function estimateMegabytes(width, height, duration, motion) {
	return (width * height * (motion ? 3.2 : 2.4) + 128e3) * duration / 8 / 1e6;
}
function evenSplit(duration, count) {
	if (count <= 0 || duration <= 0) return [];
	const scenes = [];
	for (let i = 0; i < count; i++) {
		const start = duration * i / count;
		const end = i === count - 1 ? duration : duration * (i + 1) / count;
		scenes.push({
			start,
			end
		});
	}
	return scenes;
}
function sceneIndexAt(scenes, time) {
	if (scenes.length === 0) return -1;
	for (let i = 0; i < scenes.length; i++) if (time < scenes[i].end) return i;
	return scenes.length - 1;
}
function monoChannel(buffer) {
	if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
	const length = buffer.length;
	const out = new Float32Array(length);
	const channels = buffer.numberOfChannels;
	for (let c = 0; c < channels; c++) {
		const data = buffer.getChannelData(c);
		for (let i = 0; i < length; i++) out[i] += data[i] / channels;
	}
	return out;
}
function windowRms(channel, sampleRate, windowSec = .03) {
	const hop = Math.max(1, Math.floor(sampleRate * windowSec));
	const bins = Math.max(1, Math.ceil(channel.length / hop));
	const rms = new Float32Array(bins);
	for (let b = 0; b < bins; b++) {
		const start = b * hop;
		const end = Math.min(channel.length, start + hop);
		let sum = 0;
		const n = Math.max(1, end - start);
		for (let i = start; i < end; i++) sum += channel[i] * channel[i];
		rms[b] = Math.sqrt(sum / n);
	}
	const smooth = new Float32Array(bins);
	for (let i = 0; i < bins; i++) {
		const a = rms[Math.max(0, i - 1)];
		const c = rms[Math.min(bins - 1, i + 1)];
		smooth[i] = (a + rms[i] * 2 + c) / 4;
	}
	return {
		rms: smooth,
		hop
	};
}
function findPauses(rms, hop, sampleRate, duration) {
	const sorted = Array.from(rms).sort((a, b) => a - b);
	const noise = sorted[Math.floor(sorted.length * .12)] ?? 0;
	const speech = sorted[Math.floor(sorted.length * .62)] ?? noise;
	const threshold = noise + Math.max(.004, (speech - noise) * .35);
	const minRun = Math.max(2, Math.round(.14 / (hop / sampleRate)));
	const pauses = [];
	let runStart = -1;
	for (let i = 0; i <= rms.length; i++) if (i < rms.length && rms[i] < threshold) {
		if (runStart < 0) runStart = i;
	} else if (runStart >= 0) {
		const runEnd = i;
		if (runEnd - runStart >= minRun && runStart > 0 && runEnd < rms.length) {
			const time = (runStart + runEnd - 1) / 2 * hop / sampleRate;
			if (time > .2 && time < duration - .2) pauses.push(time);
		}
		runStart = -1;
	}
	return pauses;
}
function quietestCut(rms, hop, sampleRate, a, b) {
	if (b - a < .05) return (a + b) / 2;
	const pad = (b - a) * .2;
	const t0 = a + pad;
	const t1 = b - pad;
	let i0 = Math.max(0, Math.floor(t0 * sampleRate / hop));
	let i1 = Math.min(rms.length - 1, Math.ceil(t1 * sampleRate / hop));
	if (i1 <= i0) return (a + b) / 2;
	let best = i0;
	let bestVal = Infinity;
	for (let i = i0; i <= i1; i++) if (rms[i] < bestVal) {
		bestVal = rms[i];
		best = i;
	}
	const cut = best * hop / sampleRate;
	if (cut <= a + .04 || cut >= b - .04) return (a + b) / 2;
	return cut;
}
/** Even storyboard slots, each snapped to a nearby breath when one exists. */
function speechAwareSplit(channel, sampleRate, duration, count) {
	if (count <= 0 || duration <= 0) return {
		scenes: [],
		pauseCuts: 0
	};
	if (count === 1) return {
		scenes: [{
			start: 0,
			end: duration
		}],
		pauseCuts: 0
	};
	const { rms, hop } = windowRms(channel, sampleRate);
	const pauses = findPauses(rms, hop, sampleRate, duration);
	const avg = duration / count;
	const window = Math.max(.16, avg * .42);
	const minSlice = Math.min(.12, avg * .3);
	const bounds = [0];
	let snapped = 0;
	for (let k = 1; k < count; k++) {
		const target = duration * k / count;
		const prev = bounds[bounds.length - 1];
		const nextLimit = duration - (count - k) * minSlice;
		let cut = target;
		let usedPause = false;
		let bestDist = window;
		for (const pause of pauses) {
			const dist = Math.abs(pause - target);
			if (dist <= bestDist && pause > prev + minSlice && pause < nextLimit) {
				bestDist = dist;
				cut = pause;
				usedPause = true;
			}
		}
		if (!usedPause) {
			const from = Math.max(prev + minSlice, target - window);
			const to = Math.min(nextLimit, target + window);
			cut = to > from ? quietestCut(rms, hop, sampleRate, from, to) : target;
		} else snapped += 1;
		cut = Math.min(nextLimit - 1e-4, Math.max(prev + minSlice, cut));
		bounds.push(cut);
	}
	bounds.push(duration);
	const scenes = [];
	for (let i = 0; i < bounds.length - 1; i++) scenes.push({
		start: bounds[i],
		end: bounds[i + 1]
	});
	return {
		scenes,
		pauseCuts: snapped
	};
}
function sliceAudioBuffer(buffer, startSec, endSec) {
	const rate = buffer.sampleRate;
	const start = Math.max(0, Math.floor(startSec * rate));
	const end = Math.min(buffer.length, Math.max(start + 1, Math.ceil(endSec * rate)));
	const length = Math.max(1, end - start);
	const out = new AudioBuffer({
		length,
		numberOfChannels: buffer.numberOfChannels,
		sampleRate: rate
	});
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const copy = new Float32Array(length);
		copy.set(buffer.getChannelData(ch).subarray(start, start + length));
		out.copyToChannel(copy, ch);
	}
	return out;
}
async function resample(buffer, sampleRate) {
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
async function exportMp4(request) {
	if (typeof VideoEncoder === "undefined" || typeof AudioEncoder === "undefined") throw new Error("Browser ini belum bisa membuat MP4. Buka Adegan di Chrome atau Edge.");
	const { scenes, images, aspect, resolution, motion, fit, signal, onProgress } = request;
	if (images.length === 0 || scenes.length !== images.length) throw new Error("Audio dan gambar belum sejajar. Hitung ulang potongannya dulu.");
	const duration = request.audioBuffer.duration;
	const { width, height } = frameSize(aspect, resolution);
	const fps = motion ? 12 : 4;
	const frameDur = 1 / fps;
	const frames = [];
	for (let time = 0; time < duration - .001; time += frameDur) frames.push({
		time,
		dur: Math.min(frameDur, duration - time)
	});
	if (frames.length === 0) frames.push({
		time: 0,
		dur: Math.max(frameDur, duration)
	});
	frames[frames.length - 1].dur = Math.max(.001, duration - frames[frames.length - 1].time);
	onProgress(.02, "Menyiapkan suara…");
	const audio = await resample(request.audioBuffer, 48e3);
	if (signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
	const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, Quality } = await import("../_libs/mediabunny.mjs").then((n) => n.t);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d", { alpha: false });
	if (!ctx) throw new Error("Kanvas ekspor tidak tersedia.");
	const videoBitrate = Math.round(Math.min(8e6, Math.max(12e5, width * height * (motion ? 3.2 : 2.4))));
	const target = new BufferTarget();
	const output = new Output({
		format: new Mp4OutputFormat({ fastStart: "in-memory" }),
		target
	});
	const videoSource = new CanvasSource(canvas, {
		codec: "avc",
		quality: new Quality({
			bitrate: videoBitrate,
			bitrateMode: "variable"
		}),
		keyFrameInterval: 2
	});
	const audioSource = new AudioBufferSource({
		codec: "aac",
		quality: new Quality({ bitrate: 128e3 })
	});
	output.addVideoTrack(videoSource);
	output.addAudioTrack(audioSource);
	let bitmap = null;
	let bitmapIndex = -1;
	let audioUntil = 0;
	const releaseBitmap = () => {
		bitmap?.close();
		bitmap = null;
		bitmapIndex = -1;
	};
	try {
		await output.start();
		const pumpAudio = async (upTo) => {
			while (audioUntil < upTo - 1e-4) {
				const end = Math.min(audio.duration, audioUntil + 1);
				await audioSource.add(sliceAudioBuffer(audio, audioUntil, end));
				audioUntil = end;
			}
		};
		for (let i = 0; i < frames.length; i++) {
			if (signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
			const frame = frames[i];
			const index = sceneIndexAt(scenes, Math.min(frame.time, duration - 1e-4));
			const scene = scenes[index];
			const image = images[index];
			if (!scene || !image) continue;
			if (bitmapIndex !== index) {
				releaseBitmap();
				bitmap = await createImageBitmap(image.blob);
				bitmapIndex = index;
			}
			const span = Math.max(.001, scene.end - scene.start);
			const progress = (frame.time - scene.start) / span;
			drawFrame(ctx, bitmap, bitmap.width, bitmap.height, index, progress, motion, fit);
			await pumpAudio(frame.time + frame.dur);
			await videoSource.add(frame.time, frame.dur, { keyFrame: i % (fps * 2) === 0 });
			if (i % 3 === 0 || i === frames.length - 1) onProgress(.04 + .92 * (i + 1) / frames.length, `Scene ${index + 1} dari ${images.length}`);
		}
		await pumpAudio(audio.duration);
		onProgress(.98, "Menutup file…");
		await output.finalize();
		const buffer = target.buffer;
		if (!buffer) throw new Error("File video kosong.");
		onProgress(1, "Selesai");
		return new Blob([buffer], { type: "video/mp4" });
	} catch (error) {
		if (output.state !== "finalized" && output.state !== "canceled") await output.cancel().catch(() => void 0);
		throw error;
	} finally {
		releaseBitmap();
	}
}
var DB_NAME = "adegan-v1";
var STORE = "kv";
var KEY = "project";
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("IndexedDB gagal dibuka"));
	});
}
async function loadProject() {
	const db = await openDb();
	try {
		return await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
			req.onsuccess = () => resolve(req.result ?? null);
			req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("Gagal membaca proyek"));
		});
	} finally {
		db.close();
	}
}
async function saveProject(project) {
	const db = await openDb();
	try {
		await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, "readwrite");
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Gagal menyimpan proyek"));
			tx.objectStore(STORE).put(project, KEY);
		});
	} finally {
		db.close();
	}
}
async function clearProject() {
	const db = await openDb();
	try {
		await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, "readwrite");
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Gagal menghapus proyek"));
			tx.objectStore(STORE).delete(KEY);
		});
	} finally {
		db.close();
	}
}
var allowPersist = false;
var pendingPersist = false;
var persistTimer = null;
function snapshot(state) {
	return {
		audioBlob: state.audioBlob,
		audioName: state.audioName,
		images: state.images.map((img) => ({
			id: img.id,
			name: img.name,
			blob: img.blob
		})),
		scenes: state.scenes,
		mode: state.mode,
		aspect: state.aspect,
		fit: state.fit,
		motion: state.motion,
		resolution: state.resolution
	};
}
function schedulePersist() {
	pendingPersist = true;
	if (!allowPersist) return;
	if (persistTimer) clearTimeout(persistTimer);
	persistTimer = setTimeout(() => {
		pendingPersist = false;
		saveProject(snapshot(useStudio.getState())).catch(() => {
			useStudio.setState({ storageWarning: "Penyimpanan browser penuh. Proyek tetap hidup di tab ini, tapi hilang kalau halaman ditutup." });
		});
	}, 350);
}
function finishBoot() {
	allowPersist = true;
	if (pendingPersist) schedulePersist();
}
function isImageFile(file) {
	return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);
}
function isAudioFile(file) {
	return file.type.startsWith("audio/") || /\.(wav|mp3|m4a|ogg|flac|aac|mpeg)$/i.test(file.name);
}
function takeAudioAndImages(files) {
	let audio = null;
	const images = [];
	for (const file of files) if (!audio && isAudioFile(file)) audio = file;
	else if (isImageFile(file)) images.push(file);
	return {
		audio,
		images
	};
}
function planNote(mode, count, pauseCuts, hasAudio) {
	if (!hasAudio) return count > 0 ? "Gambar siap. Masukkan audio supaya durasinya kebagi." : "";
	if (count === 0) return "Audio siap. Masukkan gambar scene sesuai urutan cerita.";
	if (mode === "even") return "Tiap scene dapat durasi yang sama, dari awal audio sampai habis.";
	if (mode === "custom") return "Batas digeser manual. Napas atau Rata akan menghitung ulang.";
	const gaps = Math.max(0, count - 1);
	if (pauseCuts >= gaps && gaps > 0) return "Semua pergantian scene nempel di jeda napas.";
	if (pauseCuts > 0) return `${pauseCuts} dari ${gaps} pergantian nempel di jeda napas. Sisanya di titik paling sunyi di sekitar bagi rata.`;
	return "Jeda ucapan kurang jelas, jadi durasi dibagi rata lalu digeser ke titik paling sunyi.";
}
var useStudio = create((set, get) => {
	function applyPlan(mode) {
		const { audioBuffer, images } = get();
		const count = images.length;
		if (!audioBuffer || count === 0) {
			set({
				scenes: [],
				mode,
				note: planNote(mode, count, 0, Boolean(audioBuffer))
			});
			return;
		}
		const duration = audioBuffer.duration;
		if (mode === "even") {
			set({
				scenes: evenSplit(duration, count),
				mode,
				note: planNote("even", count, 0, true)
			});
			return;
		}
		const plan = speechAwareSplit(monoChannel(audioBuffer), audioBuffer.sampleRate, duration, count);
		set({
			scenes: plan.scenes,
			mode: "breath",
			note: planNote("breath", count, plan.pauseCuts, true)
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
				const images = [];
				for (const img of saved.images) try {
					const bmp = await createImageBitmap(img.blob);
					images.push({
						id: img.id,
						name: img.name,
						blob: img.blob,
						url: URL.createObjectURL(img.blob),
						width: bmp.width,
						height: bmp.height
					});
					bmp.close();
				} catch {}
				let audioBuffer = null;
				let audioUrl = null;
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
					resolution: saved.resolution
				});
				if (!scenesOk && (audioBuffer || images.length)) {
					applyPlan(saved.mode === "even" ? "even" : "breath");
					schedulePersist();
				} else if (audioBuffer && images.length) set({ note: saved.mode === "custom" ? planNote("custom", images.length, 0, true) : saved.mode === "even" ? planNote("even", images.length, 0, true) : "Potongan terakhir dimuat. Tekan Napas kalau mau dihitung ulang dari jeda ucapan." });
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
					storageWarning: null
				});
				applyPlan(get().mode === "even" ? "even" : "breath");
				schedulePersist();
			} catch {
				set({ storageWarning: "Audio tidak bisa diputar. Pakai WAV, MP3, atau M4A." });
			}
		},
		addImages: async (files) => {
			const sorted = files.filter(isImageFile).sort((a, b) => compareNames(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name));
			if (sorted.length === 0) {
				set({ storageWarning: "Tidak ada file gambar. Pakai PNG, JPG, atau WebP." });
				return;
			}
			const loaded = [];
			const failed = [];
			for (const file of sorted) try {
				const bmp = await createImageBitmap(file);
				loaded.push({
					id: crypto.randomUUID(),
					name: file.name,
					blob: file,
					url: URL.createObjectURL(file),
					width: bmp.width,
					height: bmp.height
				});
				bmp.close();
			} catch {
				failed.push(file.name);
			}
			if (loaded.length === 0) {
				set({ storageWarning: "Gambar tidak bisa dibaca. Pakai PNG, JPG, atau WebP." });
				return;
			}
			set({
				images: [...get().images, ...loaded],
				storageWarning: failed.length ? `Lewati ${failed.length} file yang rusak.` : null
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
			set({ images: [...get().images].sort((a, b) => compareNames(a.name, b.name)) });
			schedulePersist();
		},
		setMode: (mode) => {
			if (mode === "custom") {
				set({
					mode,
					note: planNote("custom", get().images.length, 0, Boolean(get().audioBuffer))
				});
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
			const minSlice = Math.min(.2, get().duration / Math.max(scenes.length * 4, 1));
			const end = Math.min(nextScene.end - minSlice, Math.max(current.start + minSlice, time));
			set({
				mode: "custom",
				note: planNote("custom", get().images.length, 0, true),
				scenes: scenes.map((scene, index) => {
					if (index === sceneIndex) return {
						...scene,
						end
					};
					if (index === sceneIndex + 1) return {
						...scene,
						start: end
					};
					return scene;
				})
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
				storageWarning: null
			});
			clearProject().catch(() => {
				schedulePersist();
			});
		}
	};
});
function Studio() {
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
	const audioRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const scrubRef = (0, import_react.useRef)(null);
	const timeRef = (0, import_react.useRef)(null);
	const playheadRef = (0, import_react.useRef)(null);
	const trackRef = (0, import_react.useRef)(null);
	const audioInputRef = (0, import_react.useRef)(null);
	const imageInputRef = (0, import_react.useRef)(null);
	const folderInputRef = (0, import_react.useRef)(null);
	const stateRef = (0, import_react.useRef)({
		images,
		scenes,
		motion,
		fit,
		duration,
		audioUrl
	});
	stateRef.current = {
		images,
		scenes,
		motion,
		fit,
		duration,
		audioUrl
	};
	const imageCache = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const sceneCursor = (0, import_react.useRef)(-1);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [sceneIndex, setSceneIndex] = (0, import_react.useState)(0);
	const [selected, setSelected] = (0, import_react.useState)(0);
	const [hot, setHot] = (0, import_react.useState)(false);
	const [job, setJob] = (0, import_react.useState)(null);
	const dragDepth = (0, import_react.useRef)(0);
	const abortRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		boot();
	}, [boot]);
	(0, import_react.useEffect)(() => {
		if (selected > images.length - 1) setSelected(Math.max(0, images.length - 1));
	}, [images.length, selected]);
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		document.getElementById(`scene-${sceneIndex}`)?.scrollIntoView({
			block: "nearest",
			inline: "nearest"
		});
	}, [sceneIndex, playing]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const width = Math.max(2, Math.round(rect.width * dpr));
			const height = Math.max(2, Math.round(rect.height * dpr));
			const nextW = width - width % 2;
			const nextH = height - height % 2;
			if (canvas.width !== nextW || canvas.height !== nextH) {
				canvas.width = nextW;
				canvas.height = nextH;
			}
		};
		const observer = new ResizeObserver(resize);
		observer.observe(canvas);
		resize();
		return () => observer.disconnect();
	}, [aspect]);
	(0, import_react.useEffect)(() => {
		let frame = 0;
		const paint = (time) => {
			const canvas = canvasRef.current;
			const ctx = canvas?.getContext("2d");
			const snap = stateRef.current;
			if (!ctx || !canvas) return;
			const index = sceneIndexAt(snap.scenes, time);
			if (index !== sceneCursor.current) {
				sceneCursor.current = index;
				if (index >= 0) setSceneIndex(index);
			}
			if (timeRef.current) timeRef.current.textContent = formatClock(time);
			if (playheadRef.current && snap.duration > 0) playheadRef.current.style.left = `${time / snap.duration * 100}%`;
			const scrub = scrubRef.current;
			if (scrub && document.activeElement !== scrub) scrub.value = String(time);
			const scene = index >= 0 ? snap.scenes[index] : null;
			const image = index >= 0 ? snap.images[index] : null;
			if (!scene || !image) {
				drawFrame(ctx, null, 0, 0, 0, 0, false, snap.fit);
				return;
			}
			let element = imageCache.current.get(image.url);
			if (!element) {
				element = new Image();
				element.onload = () => paint(audioRef.current?.currentTime ?? time);
				element.src = image.url;
				imageCache.current.set(image.url, element);
			}
			const drawable = element.complete && element.naturalWidth > 0 ? element : null;
			const span = Math.max(.001, scene.end - scene.start);
			drawFrame(ctx, drawable, image.width, image.height, index, (time - scene.start) / span, snap.motion, snap.fit);
		};
		const loop = () => {
			paint(audioRef.current?.currentTime ?? 0);
			frame = requestAnimationFrame(loop);
		};
		frame = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frame);
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.code !== "Space") return;
			if (event.target?.closest("input, textarea, button, select, a")) return;
			event.preventDefault();
			toggle();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	function seek(time) {
		const audio = audioRef.current;
		const next = Math.min(Math.max(0, time), stateRef.current.duration || 0);
		if (audio && stateRef.current.audioUrl) audio.currentTime = next;
	}
	async function toggle() {
		const audio = audioRef.current;
		if (!audio || !stateRef.current.audioUrl) return;
		if (audio.paused) try {
			await audio.play();
			setPlaying(true);
		} catch {
			setPlaying(false);
		}
		else {
			audio.pause();
			setPlaying(false);
		}
	}
	function ingest(list) {
		const { audio, images: pics } = takeAudioAndImages([...list]);
		if (audio) addAudio(audio);
		if (pics.length) addImages(pics);
	}
	function onDrop(event) {
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
		const filename = `adegan-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace(/[:T]/g, "")}.mp4`;
		setJob({
			running: true,
			progress: 0,
			label: "Menyiapkan…",
			error: null,
			url: null,
			filename
		});
		try {
			const blob = await exportMp4({
				scenes: snap.scenes,
				images: snap.images.map((img) => ({
					blob: img.blob,
					width: img.width,
					height: img.height
				})),
				audioBuffer: snap.audioBuffer,
				aspect: snap.aspect,
				resolution: snap.resolution,
				motion: snap.motion,
				fit: snap.fit,
				signal: ctrl.signal,
				onProgress: (progress, label) => {
					setJob((current) => current ? {
						...current,
						progress,
						label
					} : current);
				}
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = filename;
			link.click();
			setJob({
				running: false,
				progress: 1,
				label: "MP4 siap",
				error: null,
				url,
				filename
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				setJob(null);
				return;
			}
			const message = error instanceof Error ? error.message : "Ekspor gagal.";
			setJob({
				running: false,
				progress: 0,
				label: "Gagal",
				error: message,
				url: null,
				filename
			});
		}
	}
	function closeJob() {
		if (job?.url) URL.revokeObjectURL(job.url);
		setJob(null);
	}
	const ratio = ASPECTS[aspect];
	const size = frameSize(aspect, resolution);
	const megabytes = duration > 0 ? estimateMegabytes(size.width, size.height, duration, motion) : 0;
	const ready = Boolean(audioBuffer) && images.length > 0 && scenes.length === images.length;
	const active = images[sceneIndex];
	const picked = images[selected];
	const summary = images.length > 0 && duration > 0 ? `${images.length} scene · ${formatClock(duration)}` : images.length > 0 ? `${images.length} gambar, audio belum masuk` : audioName ? audioName : "Audio + gambar scene";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "studio-shell",
		"data-hot": hot ? "true" : "false",
		onDragEnter: (event) => {
			event.preventDefault();
			dragDepth.current += 1;
			setHot(true);
		},
		onDragOver: (event) => event.preventDefault(),
		onDragLeave: () => {
			dragDepth.current -= 1;
			if (dragDepth.current <= 0) {
				dragDepth.current = 0;
				setHot(false);
			}
		},
		onDrop,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				ref: audioRef,
				src: audioUrl ?? void 0,
				preload: "auto",
				onPlay: () => setPlaying(true),
				onPause: () => setPlaying(false),
				onEnded: () => setPlaying(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "studio-top flex items-center gap-3 px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, {
						className: "size-5 shrink-0 text-accent",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-serif text-2xl leading-none",
							children: "Adegan"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 truncate text-sm text-muted",
							children: summary
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "btn btn-primary shrink-0",
						type: "button",
						disabled: !ready || job?.running,
						onClick: () => void startExport(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Unduh MP4"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "studio-stage stage-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stage-frame",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "stage-aspect",
						style: {
							["--aw"]: String(ratio.w),
							["--ah"]: String(ratio.h)
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", { ref: canvasRef }), images.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-serif text-2xl",
								children: "Taruh cerita di sini"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "hint max-w-xs",
								children: "Jatuhkan audio narasi dan gambar scene. Urutan file jadi urutan visual."
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pointer-events-none absolute bottom-3 left-3 rounded-full bg-bg/80 px-3 py-1 text-sm tabular-nums",
							children: [
								"Scene ",
								Math.min(images.length, sceneIndex + 1),
								" / ",
								images.length,
								active ? ` · ${active.name}` : ""
							]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "icon-btn",
							type: "button",
							onClick: () => void toggle(),
							disabled: !audioUrl,
							"aria-label": playing ? "Jeda" : "Putar",
							children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							ref: timeRef,
							className: "w-16 shrink-0 text-sm tabular-nums",
							children: "0:00.0"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: scrubRef,
							type: "range",
							min: 0,
							max: duration || 0,
							step: .01,
							defaultValue: 0,
							disabled: !audioUrl,
							"aria-label": "Geser waktu",
							onChange: (event) => seek(Number(event.currentTarget.value))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-16 shrink-0 text-right text-sm text-muted tabular-nums",
							children: formatClock(duration)
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "studio-panel panel-scroll",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "field-label",
							children: "Audio"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "file-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "min-w-0 truncate text-sm text-muted",
								children: audioName ?? "Belum ada narasi"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "btn btn-ghost",
								type: "button",
								onClick: () => audioInputRef.current?.click(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Pilih"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: audioInputRef,
							className: "hidden",
							type: "file",
							accept: "audio/*,.wav,.mp3,.m4a,.ogg,.flac,.aac",
							onChange: (event) => {
								const file = event.currentTarget.files?.[0];
								if (file) addAudio(file);
								event.currentTarget.value = "";
							}
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "field-label",
							children: "Gambar scene"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "btn btn-ghost",
									type: "button",
									onClick: () => imageInputRef.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Gambar"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "btn btn-ghost",
									type: "button",
									onClick: () => folderInputRef.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Folder"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn btn-ghost",
									type: "button",
									onClick: sortByName,
									disabled: images.length < 2,
									children: "Urutkan nama"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: imageInputRef,
							className: "hidden",
							type: "file",
							accept: "image/*,.png,.jpg,.jpeg,.webp,.gif",
							multiple: true,
							onChange: (event) => {
								if (event.currentTarget.files?.length) addImages([...event.currentTarget.files]);
								event.currentTarget.value = "";
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: folderInputRef,
							className: "hidden",
							type: "file",
							accept: "image/*",
							multiple: true,
							webkitdirectory: "",
							onChange: (event) => {
								if (event.currentTarget.files?.length) addImages([...event.currentTarget.files]);
								event.currentTarget.value = "";
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hint mt-2",
							children: "Nama file yang berangka diurutkan benar: scene-2 sebelum scene-10. Bisa juga geser thumbnail."
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "field-label",
							children: "Potongan"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "segment",
							role: "radiogroup",
							"aria-label": "Cara memotong",
							children: [
								["breath", "Napas"],
								["even", "Rata"],
								["custom", "Manual"]
							].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "radio",
								"aria-checked": mode === id,
								onClick: () => setMode(id),
								children: label
							}, id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hint mt-2",
							children: note || "Napas menempelkan ganti scene ke jeda ucapan terdekat."
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "field-label",
							children: "Bingkai"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "segment",
							role: "radiogroup",
							"aria-label": "Rasio",
							children: Object.keys(ASPECTS).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "radio",
								"aria-checked": aspect === id,
								onClick: () => setAspect(id),
								children: ASPECTS[id].label
							}, id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hint mt-2",
							children: ASPECTS[aspect].hint
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn btn-ghost",
									type: "button",
									"aria-pressed": fit === "cover",
									onClick: () => setFit(fit === "cover" ? "contain" : "cover"),
									children: fit === "cover" ? "Penuh" : "Utuh"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn btn-ghost",
									type: "button",
									"aria-pressed": motion,
									onClick: () => setMotion(!motion),
									children: motion ? "Gerak halus" : "Diam"
								}),
								[720, 1080].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "btn btn-ghost",
									type: "button",
									"aria-pressed": resolution === value,
									onClick: () => setResolution(value),
									children: [value, "p"]
								}, value))
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "hint mt-2",
							children: [
								size.width,
								"×",
								size.height,
								megabytes > 0 ? ` · sekitar ${Math.max(1, Math.round(megabytes))} MB` : "",
								". Gerak halus lebih hidup, diam lebih cepat diekspor. Video dirakit di browser, tidak diunggah."
							]
						})
					] }),
					picked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "field-label",
							children: ["Scene ", selected + 1]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm",
							children: picked.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hint mt-1",
							children: scenes[selected] ? `${formatClock(scenes[selected].start)} – ${formatClock(scenes[selected].end)} · ${formatSeconds(scenes[selected].end - scenes[selected].start)}` : "Durasi menyusul setelah audio masuk."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "icon-btn",
									type: "button",
									"aria-label": "Pindah lebih awal",
									onClick: () => moveImage(picked.id, -1),
									disabled: selected === 0,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "icon-btn",
									type: "button",
									"aria-label": "Pindah lebih akhir",
									onClick: () => moveImage(picked.id, 1),
									disabled: selected === images.length - 1,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "btn btn-ghost",
									type: "button",
									onClick: () => {
										removeImage(picked.id);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Hapus scene"]
								})
							]
						})
					] }) : null,
					storageWarning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: storageWarning
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "btn btn-ghost self-start",
						type: "button",
						onClick: reset,
						disabled: !audioName && images.length === 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Hapus proyek"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "studio-timeline flex flex-col gap-2 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: trackRef,
					className: "time-track",
					onPointerDown: (event) => {
						if (event.target.closest("[data-handle]")) return;
						const rect = event.currentTarget.getBoundingClientRect();
						if (rect.width <= 0 || duration <= 0) return;
						seek((event.clientX - rect.left) / rect.width * duration);
					},
					children: [scenes.map((scene, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "time-chunk",
						"data-active": index === sceneIndex ? "true" : "false",
						style: { flexGrow: Math.max(.05, scene.end - scene.start) },
						children: index < scenes.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-handle": true,
							className: "handle",
							"aria-label": `Geser batas scene ${index + 1}`,
							onPointerDown: (event) => {
								event.stopPropagation();
								const handle = event.currentTarget;
								handle.setPointerCapture(event.pointerId);
								let raf = 0;
								let pending = scene.end;
								const move = (ev) => {
									const track = trackRef.current;
									if (!track || duration <= 0) return;
									const rect = track.getBoundingClientRect();
									pending = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width)) * duration;
									if (!raf) raf = requestAnimationFrame(() => {
										raf = 0;
										updateBoundary(index, pending);
									});
								};
								const up = () => {
									handle.removeEventListener("pointermove", move);
									handle.removeEventListener("pointerup", up);
									if (raf) cancelAnimationFrame(raf);
									updateBoundary(index, pending);
								};
								handle.addEventListener("pointermove", move);
								handle.addEventListener("pointerup", up);
							}
						}) : null
					}, `${scene.start}-${index}`)), duration > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: playheadRef,
						className: "playhead",
						style: { left: "0%" }
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "chip-row",
					children: [images.map((img, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						id: `scene-${index}`,
						className: "scene-chip",
						"data-active": index === sceneIndex || index === selected ? "true" : "false",
						draggable: true,
						onDragStart: (event) => {
							event.dataTransfer.setData("text/plain", img.id);
							event.dataTransfer.effectAllowed = "move";
						},
						onDragOver: (event) => event.preventDefault(),
						onDrop: (event) => {
							event.preventDefault();
							reorder(event.dataTransfer.getData("text/plain"), img.id);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "block w-full bg-transparent p-0 text-left text-fg",
							onClick: () => {
								setSelected(index);
								if (scenes[index]) seek(scenes[index].start);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: img.url,
								alt: ""
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-1 block truncate text-sm tabular-nums",
								children: [index + 1, scenes[index] ? ` · ${formatSeconds(scenes[index].end - scenes[index].start)}` : ""]
							})]
						})
					}, img.id)), images.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: "Timeline muncul setelah gambar masuk."
					}) : null]
				})]
			}),
			job ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "scrim",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": "Ekspor MP4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "dialog",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-2xl",
							children: job.error ? "Ekspor gagal" : job.url ? "MP4 siap" : "Merakit video"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hint mt-2",
							children: job.error ?? (job.url ? "Kalau unduhan tidak mulai, pakai tautan di bawah." : job.label)
						}),
						job.running ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bar mt-4",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${Math.round(job.progress * 100)}%` } })
						}) : null,
						job.running ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm tabular-nums",
							children: [Math.round(job.progress * 100), "%"]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [job.running ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn btn-ghost",
								type: "button",
								onClick: () => abortRef.current?.abort(),
								children: "Batal"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn btn-primary",
								type: "button",
								onClick: closeJob,
								children: "Tutup"
							}), job.url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "btn btn-ghost",
								href: job.url,
								download: job.filename,
								children: "Unduh lagi"
							}) : null]
						})
					]
				})
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {});
}
//#endregion
export { Home as component };
