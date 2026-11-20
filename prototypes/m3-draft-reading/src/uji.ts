/**
 * Logika pengujian gerbang #3: statistik fps, percobaan baca sarat buta, dan penilaian lulus/gagal.
 * Murni (tanpa React/three) supaya bisa dites dan dipakai skrip analisis.
 */

export type DeviceClass = "quest3" | "quest2" | "desktop";

export const DEVICE_LABELS: Record<DeviceClass, string> = {
  quest3: "Quest 3",
  quest2: "Quest 2 (batas bawah)",
  desktop: "Peramban desktop (laptop kantor standar)",
};

/** Ambang fps rata-rata dari kriteria #3. */
export const FPS_THRESHOLD: Record<DeviceClass, number> = { quest3: 72, quest2: 72, desktop: 50 };
/** Selisih bacaan terhadap nilai sebenarnya yang masih lulus (m). */
export const READING_TOLERANCE = 0.01;
/** Syarat minimum agar hasil bacaan dihitung. */
export const MIN_READERS = 2;
export const MIN_TRIALS_PER_READER = 5;
export const MIN_FPS_SECONDS = 30;

export interface Trial {
  id: number;
  reader: string;
  trueDraught: number;
  /** null bila pembaca belum mengunci. */
  reading: number | null;
  /** reading − trueDraught (m), 3 desimal; null bila belum mengunci. */
  diff: number | null;
  amp: number;
  period: number;
  markScale: number;
  at: string;
}

export interface FpsRun {
  deviceClass: DeviceClass;
  inXR: boolean;
  seconds: number;
  frames: number;
  avg: number;
  p1Low: number;
  min: number;
  at: string;
}

export interface UjiExport {
  version: 1;
  deviceClass: DeviceClass;
  deviceLabel: string;
  userAgent: string;
  exportedAt: string;
  trials: Trial[];
  fpsRuns: FpsRun[];
}

const round = (x: number, dp: number) => Math.round(x * 10 ** dp) / 10 ** dp;

/** Statistik dari daftar lama frame (detik). p1Low = fps pada frame time persentil ke-99. */
export function fpsStats(dts: readonly number[]): { frames: number; seconds: number; avg: number; p1Low: number; min: number } {
  const valid = dts.filter((d) => d > 0 && Number.isFinite(d));
  if (valid.length === 0) return { frames: 0, seconds: 0, avg: 0, p1Low: 0, min: 0 };
  const seconds = valid.reduce((a, b) => a + b, 0);
  const sorted = [...valid].sort((a, b) => a - b);
  const p99 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))]!;
  return {
    frames: valid.length,
    seconds: round(seconds, 2),
    avg: round(valid.length / seconds, 1),
    p1Low: round(1 / p99, 1),
    min: round(1 / sorted[sorted.length - 1]!, 1),
  };
}

/** Sarat sebenarnya acak (2 desimal) agar pembaca tidak bisa menghafal; rentang masih di dalam pelat tanda. */
export function randomTrueDraught(rng: () => number = Math.random): number {
  return round(9.8 + rng() * 1.0, 2);
}

export function completeTrial(t: Trial, reading: number): Trial {
  return { ...t, reading, diff: round(reading - t.trueDraught, 3) };
}

export interface ReaderSummary {
  reader: string;
  trials: number;
  maxAbsDiff: number;
  meanAbsDiff: number;
  withinTolerance: number;
  pass: boolean;
}

export interface FpsSummary {
  deviceClass: DeviceClass;
  threshold: number;
  /** Run terbaik yang memenuhi syarat durasi (dan XR untuk Quest); undefined bila belum diuji. */
  best?: FpsRun;
  pass: boolean;
  note: string;
}

export interface Verdict {
  fps: FpsSummary[];
  readers: ReaderSummary[];
  readingPass: boolean;
  readingNote: string;
  pass: boolean;
}

export function evaluate(exports: readonly UjiExport[]): Verdict {
  const fps: FpsSummary[] = (Object.keys(FPS_THRESHOLD) as DeviceClass[]).map((deviceClass) => {
    const threshold = FPS_THRESHOLD[deviceClass];
    const runs = exports
      .flatMap((e) => e.fpsRuns)
      .filter((r) => r.deviceClass === deviceClass)
      .filter((r) => r.seconds >= MIN_FPS_SECONDS)
      .filter((r) => deviceClass === "desktop" || r.inXR);
    if (runs.length === 0) {
      const need = deviceClass === "desktop" ? "" : " di dalam sesi VR";
      return { deviceClass, threshold, pass: false, note: `belum ada rekaman ≥ ${MIN_FPS_SECONDS} s${need}` };
    }
    // Penilaian memakai rekaman terburuk, bukan terbaik: lolos hanya bila semua rekaman memenuhi.
    const worst = runs.reduce((a, b) => (b.avg < a.avg ? b : a));
    const pass = runs.every((r) => r.avg >= threshold);
    return { deviceClass, threshold, best: worst, pass, note: pass ? "memenuhi" : "di bawah ambang" };
  });

  const byReader = new Map<string, Trial[]>();
  for (const t of exports.flatMap((e) => e.trials)) {
    if (t.diff === null) continue;
    byReader.set(t.reader, [...(byReader.get(t.reader) ?? []), t]);
  }
  const readers: ReaderSummary[] = [...byReader.entries()].map(([reader, trials]) => {
    const abs = trials.map((t) => Math.abs(t.diff!));
    const within = abs.filter((d) => d <= READING_TOLERANCE + 1e-9).length;
    return {
      reader,
      trials: trials.length,
      maxAbsDiff: round(Math.max(...abs), 3),
      meanAbsDiff: round(abs.reduce((a, b) => a + b, 0) / abs.length, 4),
      withinTolerance: within,
      pass: trials.length >= MIN_TRIALS_PER_READER && within === trials.length,
    };
  });
  const enough = readers.filter((r) => r.trials >= MIN_TRIALS_PER_READER);
  const readingPass = enough.length >= MIN_READERS && enough.every((r) => r.pass);
  const readingNote =
    enough.length < MIN_READERS
      ? `butuh ≥ ${MIN_READERS} pembaca dengan ≥ ${MIN_TRIALS_PER_READER} percobaan masing-masing (ada ${enough.length})`
      : readingPass
        ? "semua pembaca dalam ±1 cm di semua percobaan"
        : "ada pembaca dengan percobaan di luar ±1 cm";

  return { fps, readers, readingPass, readingNote, pass: fps.every((f) => f.pass) && readingPass };
}
