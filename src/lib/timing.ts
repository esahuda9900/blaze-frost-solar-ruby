export type SceneSpan = { start: number; end: number };

export type SpeechPlan = {
  scenes: SceneSpan[];
  pauseCuts: number;
};

export type TimelineParseResult =
  | { ok: true; scenes: SceneSpan[]; count: number; lastEnd: number }
  | { ok: false; error: string };

/** MM:SS or M:SS or seconds number → seconds */
function clockToSeconds(token: string): number | null {
  const t = token.trim();
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  const m = t.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!m) return null;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  const frac = m[3] ? Number(`0.${m[3]}`) : 0;
  if (sec >= 60) return null;
  return min * 60 + sec + frac;
}

/**
 * Parse rigid transcript timeline scripts like:
 *   * Scene 1 [00:00 - 00:05]
 *   Scene 2 [00:05 - 00:08]
 *   3 | 0:08 - 0:13
 * Also accepts plain lines: 00:00-00:05 / 0 - 5
 */
export function parseTimelineScript(text: string): TimelineParseResult {
  const raw = text.trim();
  if (!raw) return { ok: false, error: "Script kosong." };

  const lines = raw.split(/\r?\n/);
  type Hit = { n: number; start: number; end: number; order: number };
  const hits: Hit[] = [];
  let order = 0;

  // Pattern A: Scene N [MM:SS - MM:SS]
  const sceneBracket =
    /(?:\*\s*)?(?:Scene|scene|SCENE)\s*(\d+)\s*\[\s*(\d{1,2}:\d{2}(?:\.\d{1,3})?|\d+(?:\.\d+)?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\.\d{1,3})?|\d+(?:\.\d+)?)\s*\]/;

  // Pattern B: N | MM:SS - MM:SS  or  N: MM:SS - MM:SS
  const scenePipe =
    /^\s*(?:\*\s*)?(\d+)\s*[|:.]\s*(\d{1,2}:\d{2}(?:\.\d{1,3})?|\d+(?:\.\d+)?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\.\d{1,3})?|\d+(?:\.\d+)?)/;

  // Pattern C: bare MM:SS - MM:SS (sequential by appearance)
  const bareClock =
    /^\s*(?:\*\s*)?(\d{1,2}:\d{2}(?:\.\d{1,3})?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\.\d{1,3})?)\s*$/;

  for (const line of lines) {
    let m = line.match(sceneBracket);
    if (m) {
      const start = clockToSeconds(m[2]);
      const end = clockToSeconds(m[3]);
      if (start == null || end == null || end <= start) continue;
      hits.push({ n: Number(m[1]), start, end, order: order++ });
      continue;
    }
    m = line.match(scenePipe);
    if (m) {
      const start = clockToSeconds(m[2]);
      const end = clockToSeconds(m[3]);
      if (start == null || end == null || end <= start) continue;
      hits.push({ n: Number(m[1]), start, end, order: order++ });
      continue;
    }
    m = line.match(bareClock);
    if (m) {
      const start = clockToSeconds(m[1]);
      const end = clockToSeconds(m[2]);
      if (start == null || end == null || end <= start) continue;
      hits.push({ n: hits.length + 1, start, end, order: order++ });
    }
  }

  if (hits.length === 0) {
    return {
      ok: false,
      error:
        "Tidak ketemu baris Scene. Contoh format: * Scene 1 [00:00 - 00:05]",
    };
  }

  // Sort by scene number, then by appearance order for ties
  hits.sort((a, b) => a.n - b.n || a.order - b.order);

  // Deduplicate by scene number (keep first)
  const byNum = new Map<number, Hit>();
  for (const h of hits) {
    if (!byNum.has(h.n)) byNum.set(h.n, h);
  }
  const sorted = [...byNum.values()].sort((a, b) => a.n - b.n);

  // Must be contiguous 1..N
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].n !== i + 1) {
      return {
        ok: false,
        error: `Nomor scene tidak urut. Diharapkan Scene ${i + 1}, ketemu Scene ${sorted[i].n}.`,
      };
    }
  }

  const scenes: SceneSpan[] = sorted.map((h) => ({ start: h.start, end: h.end }));

  // Light continuity check (warn only via note later; still accept)
  return {
    ok: true,
    scenes,
    count: scenes.length,
    lastEnd: scenes[scenes.length - 1].end,
  };
}

export function evenSplit(duration: number, count: number): SceneSpan[] {
  if (count <= 0 || duration <= 0) return [];
  const scenes: SceneSpan[] = [];
  for (let i = 0; i < count; i++) {
    const start = (duration * i) / count;
    const end = i === count - 1 ? duration : (duration * (i + 1)) / count;
    scenes.push({ start, end });
  }
  return scenes;
}

export function sceneIndexAt(scenes: SceneSpan[], time: number): number {
  if (scenes.length === 0) return -1;
  for (let i = 0; i < scenes.length; i++) {
    if (time < scenes[i].end) return i;
  }
  return scenes.length - 1;
}

export function monoChannel(buffer: AudioBuffer): Float32Array {
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

function windowRms(
  channel: Float32Array,
  sampleRate: number,
  windowSec = 0.03,
): { rms: Float32Array; hop: number } {
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
  return { rms: smooth, hop };
}

function findPauses(rms: Float32Array, hop: number, sampleRate: number, duration: number): number[] {
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const noise = sorted[Math.floor(sorted.length * 0.12)] ?? 0;
  const speech = sorted[Math.floor(sorted.length * 0.62)] ?? noise;
  const threshold = noise + Math.max(0.004, (speech - noise) * 0.35);
  const minRun = Math.max(2, Math.round(0.14 / (hop / sampleRate)));
  const pauses: number[] = [];
  let runStart = -1;
  for (let i = 0; i <= rms.length; i++) {
    const silent = i < rms.length && rms[i] < threshold;
    if (silent) {
      if (runStart < 0) runStart = i;
    } else if (runStart >= 0) {
      const runEnd = i;
      if (runEnd - runStart >= minRun && runStart > 0 && runEnd < rms.length) {
        const mid = (runStart + runEnd - 1) / 2;
        const time = (mid * hop) / sampleRate;
        if (time > 0.2 && time < duration - 0.2) pauses.push(time);
      }
      runStart = -1;
    }
  }
  return pauses;
}

function quietestCut(
  rms: Float32Array,
  hop: number,
  sampleRate: number,
  a: number,
  b: number,
): number {
  if (b - a < 0.05) return (a + b) / 2;
  const pad = (b - a) * 0.2;
  const t0 = a + pad;
  const t1 = b - pad;
  const i0 = Math.max(0, Math.floor((t0 * sampleRate) / hop));
  const i1 = Math.min(rms.length - 1, Math.ceil((t1 * sampleRate) / hop));
  if (i1 <= i0) return (a + b) / 2;
  let best = i0;
  let bestVal = Infinity;
  for (let i = i0; i <= i1; i++) {
    if (rms[i] < bestVal) {
      bestVal = rms[i];
      best = i;
    }
  }
  const cut = (best * hop) / sampleRate;
  if (cut <= a + 0.04 || cut >= b - 0.04) return (a + b) / 2;
  return cut;
}

/** Even storyboard slots, each snapped to a nearby breath when one exists. */
export function speechAwareSplit(
  channel: Float32Array,
  sampleRate: number,
  duration: number,
  count: number,
): SpeechPlan {
  if (count <= 0 || duration <= 0) return { scenes: [], pauseCuts: 0 };
  if (count === 1) return { scenes: [{ start: 0, end: duration }], pauseCuts: 0 };

  const { rms, hop } = windowRms(channel, sampleRate);
  const pauses = findPauses(rms, hop, sampleRate, duration);
  const avg = duration / count;
  const window = Math.max(0.16, avg * 0.42);
  const minSlice = Math.min(0.12, avg * 0.3);
  const bounds = [0];
  let snapped = 0;

  for (let k = 1; k < count; k++) {
    const target = (duration * k) / count;
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
    } else {
      snapped += 1;
    }
    cut = Math.min(nextLimit - 1e-4, Math.max(prev + minSlice, cut));
    bounds.push(cut);
  }
  bounds.push(duration);

  const scenes: SceneSpan[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    scenes.push({ start: bounds[i], end: bounds[i + 1] });
  }
  return { scenes, pauseCuts: snapped };
}
