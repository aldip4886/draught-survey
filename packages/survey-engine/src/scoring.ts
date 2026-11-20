import { computeCargo, type ComputeCargoInput } from "./compute-cargo";
import type { DraughtReadings } from "./draught-correction";
import { roundTo } from "./round";
import { tankWeightFromSounding, type TankSounding } from "./tanks";

/**
 * Penilaian SKN-01. Satu-satunya tempat skor dihitung; mode latihan dan ujian
 * memakai hasil yang sama (perbedaannya hanya apakah Player menampilkannya per langkah).
 *
 * Rubrik (spec Player MVP): sarat 25, densitas 15, sounding 20, urutan dan tanda koreksi 25, hasil akhir 15.
 * Toleransi: sarat ±1 cm, densitas ±0,0005, deductibles ±0,5%, rentang lulus muatan ±0,5%.
 *
 * ASUMSI (spec belum menetapkan sub-bobot): 25 poin "urutan dan tanda koreksi" dibagi
 * urutan langkah 10, tanda koreksi perpendikular 5, tanda FTC 5, tanda STC 5.
 */
export const RUBRIC = {
  draught: 25,
  density: 15,
  sounding: 20,
  worksheet: { order: 10, perpendicularSigns: 5, ftcSign: 5, stcSign: 5 },
  result: 15,
} as const;

export const TOLERANCE = {
  draught: 0.01,
  density: 0.0005,
  tankWeightFraction: 0.005,
  cargoFraction: 0.005,
} as const;

/** Urutan kanonik langkah lembar kerja. */
export const STEP_ORDER = [
  "read-draughts",
  "perpendicular-correction",
  "true-trim",
  "quarter-mean",
  "hydrostatics",
  "ftc",
  "stc",
  "density-correction",
  "deductibles",
  "net-displacement",
  "cargo",
] as const;
export type StepId = (typeof STEP_ORDER)[number];

export type Sign = -1 | 0 | 1;

export interface WorksheetSigns {
  /** Tanda koreksi perpendikular di FP, midship, dan AP. */
  forward: Sign;
  mid: Sign;
  aft: Sign;
  ftc: Sign;
  stc: Sign;
}

export interface NamedTank extends TankSounding {
  id: string;
}

export interface ScoringKey {
  draughts: DraughtReadings;
  density: number;
  tanks: NamedTank[];
  cargo: number;
  signs: WorksheetSigns;
  /** Rentang lulus muatan (t), dibulatkan 0,01. */
  cargoRange: { min: number; max: number };
}

export interface Submission {
  draughts: DraughtReadings;
  density: number;
  /** Sounding per id tangki. */
  soundings: Record<string, number>;
  worksheet: {
    /** Langkah sesuai urutan peserta menyelesaikannya. */
    order: readonly StepId[];
    signs: WorksheetSigns;
  };
  cargo: number;
}

export interface CriterionScore {
  id: "draught" | "density" | "sounding" | "worksheet" | "result";
  max: number;
  score: number;
  /** Ringkasan untuk umpan balik, mis. "5 dari 6 titik dalam ±1 cm". */
  detail: string;
}

export interface ScoreReport {
  criteria: CriterionScore[];
  total: number;
  max: number;
  /** Lulus bila muatan peserta dalam rentang ±0,5% dari kunci. */
  passed: boolean;
  cargoRange: { min: number; max: number };
}

const sign = (x: number): Sign => (x > 0 ? 1 : x < 0 ? -1 : 0);
const EPS = 1e-9;

/** Membangun kunci penilaian dari masukan mesin hitung dan tangki bernama. Rumus tetap di engine. */
export function buildScoringKey(input: ComputeCargoInput, tanks: NamedTank[]): ScoringKey {
  const r = computeCargo(input);
  const d = r.draughts;
  const cargo = r.cargo;
  return {
    draughts: input.readings,
    density: input.hydrostatics.densityMeasured,
    tanks,
    cargo,
    signs: {
      forward: sign(roundTo(d.corrected.forward - d.readMeans.forward, 6)),
      mid: sign(roundTo(d.corrected.mid - d.readMeans.mid, 6)),
      aft: sign(roundTo(d.corrected.aft - d.readMeans.aft, 6)),
      ftc: sign(r.displacement.ftc),
      stc: sign(r.displacement.stc),
    },
    cargoRange: {
      min: roundTo(cargo * (1 - TOLERANCE.cargoFraction), 2),
      max: roundTo(cargo * (1 + TOLERANCE.cargoFraction), 2),
    },
  };
}

const POINTS = [
  ["forward", "port"],
  ["forward", "starboard"],
  ["mid", "port"],
  ["mid", "starboard"],
  ["aft", "port"],
  ["aft", "starboard"],
] as const;

function scoreDraughts(key: ScoringKey, s: Submission): CriterionScore {
  const ok = POINTS.filter(
    ([p, side]) => Math.abs(s.draughts[p][side] - key.draughts[p][side]) <= TOLERANCE.draught + EPS,
  ).length;
  return {
    id: "draught",
    max: RUBRIC.draught,
    score: roundTo((RUBRIC.draught * ok) / POINTS.length, 2),
    detail: `${ok} dari ${POINTS.length} titik dalam ±1 cm`,
  };
}

function scoreDensity(key: ScoringKey, s: Submission): CriterionScore {
  const ok = Math.abs(s.density - key.density) <= TOLERANCE.density + EPS;
  return {
    id: "density",
    max: RUBRIC.density,
    score: ok ? RUBRIC.density : 0,
    detail: ok ? "densitas dalam ±0,0005" : "densitas di luar ±0,0005",
  };
}

function scoreSoundings(key: ScoringKey, s: Submission): CriterionScore {
  let ok = 0;
  for (const t of key.tanks) {
    const trueWeight = tankWeightFromSounding(t);
    const given = s.soundings[t.id];
    if (given === undefined) continue;
    let weight: number;
    try {
      weight = tankWeightFromSounding({ ...t, sounding: given });
    } catch {
      continue; // sounding di luar tabel kalibrasi dihitung salah
    }
    const tol = Math.max(Math.abs(trueWeight) * TOLERANCE.tankWeightFraction, 0.005);
    if (Math.abs(weight - trueWeight) <= tol + EPS) ok++;
  }
  return {
    id: "sounding",
    max: RUBRIC.sounding,
    score: roundTo((RUBRIC.sounding * ok) / key.tanks.length, 2),
    detail: `${ok} dari ${key.tanks.length} tangki dalam ±0,5% berat`,
  };
}

function scoreWorksheet(key: ScoringKey, s: Submission): CriterionScore {
  const w = RUBRIC.worksheet;
  // Urutan: pasangan langkah kanonik (i<j) yang muncul dengan urutan benar; langkah hilang = salah.
  const pos = new Map<StepId, number>();
  s.worksheet.order.forEach((id, i) => {
    if (!pos.has(id)) pos.set(id, i);
  });
  let pairs = 0;
  let good = 0;
  for (let i = 0; i < STEP_ORDER.length; i++) {
    for (let j = i + 1; j < STEP_ORDER.length; j++) {
      pairs++;
      const a = pos.get(STEP_ORDER[i]!);
      const b = pos.get(STEP_ORDER[j]!);
      if (a !== undefined && b !== undefined && a < b) good++;
    }
  }
  const order = roundTo((w.order * good) / pairs, 2);
  const sg = s.worksheet.signs;
  const perp =
    sg.forward === key.signs.forward && sg.mid === key.signs.mid && sg.aft === key.signs.aft ? w.perpendicularSigns : 0;
  const ftc = sg.ftc === key.signs.ftc ? w.ftcSign : 0;
  const stc = sg.stc === key.signs.stc ? w.stcSign : 0;
  const notes: string[] = [];
  if (good < pairs) notes.push("urutan langkah belum sesuai");
  if (perp === 0) notes.push("tanda koreksi perpendikular salah");
  if (ftc === 0) notes.push("tanda FTC salah");
  if (stc === 0) notes.push("tanda STC salah");
  return {
    id: "worksheet",
    max: w.order + w.perpendicularSigns + w.ftcSign + w.stcSign,
    score: roundTo(order + perp + ftc + stc, 2),
    detail: notes.length ? notes.join("; ") : "urutan dan semua tanda benar",
  };
}

function scoreResult(key: ScoringKey, s: Submission): CriterionScore {
  const ok = inRange(key, s.cargo);
  return {
    id: "result",
    max: RUBRIC.result,
    score: ok ? RUBRIC.result : 0,
    detail: ok ? "muatan dalam rentang lulus" : "muatan di luar rentang ±0,5%",
  };
}

const inRange = (key: ScoringKey, cargo: number) =>
  cargo >= key.cargoRange.min - EPS && cargo <= key.cargoRange.max + EPS;

export function scoreSubmission(key: ScoringKey, submission: Submission): ScoreReport {
  const criteria = [
    scoreDraughts(key, submission),
    scoreDensity(key, submission),
    scoreSoundings(key, submission),
    scoreWorksheet(key, submission),
    scoreResult(key, submission),
  ];
  return {
    criteria,
    total: roundTo(criteria.reduce((a, c) => a + c.score, 0), 2),
    max: criteria.reduce((a, c) => a + c.max, 0),
    passed: inRange(key, submission.cargo),
    cargoRange: key.cargoRange,
  };
}
