import { describe, expect, it } from "vitest";
import type { ComputeCargoInput } from "../src/compute-cargo";
import {
  buildScoringKey,
  scoreSubmission,
  STEP_ORDER,
  type NamedTank,
  type Submission,
} from "../src/scoring";
import { L1, L1_CARGO, L1_HYDRO } from "./fixtures/l1";

// Enam tangki dengan volume = 100 × sounding dan densitas 1,0 → berat sama dengan deductibles L1.
const cal = [
  { sounding: 0, volume: 0 },
  { sounding: 10, volume: 1000 },
];
const liquid = { type: "liquid", density: 1.0 } as const;
const tanks: NamedTank[] = [
  { id: "BALLAST", category: "ballast", calibration: cal, sounding: 3.5, fluid: liquid },
  { id: "FW", category: "freshWater", calibration: cal, sounding: 1.8, fluid: liquid },
  { id: "HFO", category: "fuel", calibration: cal, sounding: 8.2, fluid: liquid },
  { id: "MDO", category: "fuel", calibration: cal, sounding: 0.95, fluid: liquid },
  { id: "LUBE", category: "lubricant", calibration: cal, sounding: 0.25, fluid: liquid },
  { id: "OTHER", category: "other", calibration: cal, sounding: 0.1, fluid: liquid },
];

const input: ComputeCargoInput = {
  lbp: L1.lbp,
  marks: L1.marks,
  readings: L1.readings,
  hydrostatics: {
    table: L1_HYDRO.table,
    mtcPlus: L1_HYDRO.mtcPlus,
    mtcMinus: L1_HYDRO.mtcMinus,
    densityMeasured: L1_HYDRO.densityMeasured,
    densityTable: L1_HYDRO.densityTable,
  },
  deductibles: L1_CARGO.deductibles,
  initial: { lightship: L1_CARGO.lightship, constant: L1_CARGO.constant },
};

const key = buildScoringKey(input, tanks);

const perfect = (): Submission => ({
  draughts: structuredClone(L1.readings) as Submission["draughts"],
  density: L1_HYDRO.densityMeasured,
  soundings: Object.fromEntries(tanks.map((t) => [t.id, t.sounding])),
  worksheet: { order: [...STEP_ORDER], signs: { ...key.signs } },
  cargo: L1_CARGO.expected.cargo,
});

const crit = (r: ReturnType<typeof scoreSubmission>, id: string) => r.criteria.find((c) => c.id === id)!;

describe("kunci penilaian", () => {
  it("tanda koreksi L1: FP −, midship −, AP +, FTC +, STC +", () => {
    expect(key.signs).toEqual({ forward: -1, mid: -1, aft: 1, ftc: 1, stc: 1 });
  });

  it("rentang lulus ±0,5% dari 31.573,30 t = 31.415,43–31.731,17 t", () => {
    expect(key.cargoRange).toEqual({ min: 31415.43, max: 31731.17 });
  });
});

describe("bacaan benar", () => {
  const r = scoreSubmission(key, perfect());

  it("skor penuh 100 dan lulus", () => {
    expect(r.total).toBe(100);
    expect(r.max).toBe(100);
    expect(r.passed).toBe(true);
  });

  it("bobot per kriteria sesuai rubrik", () => {
    expect(r.criteria.map((c) => [c.id, c.max])).toEqual([
      ["draught", 25],
      ["density", 15],
      ["sounding", 20],
      ["worksheet", 25],
      ["result", 15],
    ]);
  });
});

describe("sarat", () => {
  it("selisih tepat 1 cm masih benar", () => {
    const s = perfect();
    s.draughts.forward.port = 10.11;
    expect(crit(scoreSubmission(key, s), "draught").score).toBe(25);
  });

  it("satu titik 2 cm meleset: 5 dari 6 titik", () => {
    const s = perfect();
    s.draughts.aft.starboard = 10.64;
    const c = crit(scoreSubmission(key, s), "draught");
    expect(c.score).toBe(20.83);
    expect(c.detail).toMatch(/5 dari 6/);
  });

  it("semua titik meleset: 0", () => {
    const s = perfect();
    for (const p of ["forward", "mid", "aft"] as const) {
      s.draughts[p].port += 0.05;
      s.draughts[p].starboard += 0.05;
    }
    expect(crit(scoreSubmission(key, s), "draught").score).toBe(0);
  });
});

describe("densitas", () => {
  it("±0,0005 masih benar", () => {
    const s = perfect();
    s.density = 1.0185;
    expect(crit(scoreSubmission(key, s), "density").score).toBe(15);
  });

  it("di luar ±0,0005: 0", () => {
    const s = perfect();
    s.density = 1.0195;
    expect(crit(scoreSubmission(key, s), "density").score).toBe(0);
  });
});

describe("sounding", () => {
  it("satu tangki di luar ±0,5% berat: 5 dari 6", () => {
    const s = perfect();
    s.soundings["BALLAST"] = 3.6; // 360 t vs 350 t = +2,9%
    expect(crit(scoreSubmission(key, s), "sounding").score).toBe(16.67);
  });

  it("selisih kecil di dalam ±0,5% masih benar", () => {
    const s = perfect();
    s.soundings["HFO"] = 8.21; // 821 vs 820 t = +0,12%
    expect(crit(scoreSubmission(key, s), "sounding").score).toBe(20);
  });

  it("tangki tak dijawab atau sounding di luar tabel dihitung salah", () => {
    const s = perfect();
    delete s.soundings["FW"];
    s.soundings["MDO"] = 99;
    expect(crit(scoreSubmission(key, s), "sounding").score).toBe(13.33);
  });
});

describe("urutan dan tanda koreksi", () => {
  it("tanda FTC dibalik: kehilangan 5 poin", () => {
    const s = perfect();
    s.worksheet.signs.ftc = -1;
    const c = crit(scoreSubmission(key, s), "worksheet");
    expect(c.score).toBe(20);
    expect(c.detail).toMatch(/FTC/);
  });

  it("tanda koreksi perpendikular salah satu: kehilangan 5 poin", () => {
    const s = perfect();
    s.worksheet.signs.aft = -1;
    expect(crit(scoreSubmission(key, s), "worksheet").score).toBe(20);
  });

  it("urutan terbalik total: 0 untuk urutan, tanda tetap dihitung", () => {
    const s = perfect();
    s.worksheet.order = [...STEP_ORDER].reverse();
    expect(crit(scoreSubmission(key, s), "worksheet").score).toBe(15);
  });

  it("dua langkah tertukar menurunkan urutan sedikit", () => {
    const s = perfect();
    const o = [...STEP_ORDER];
    [o[5], o[6]] = [o[6]!, o[5]!];
    const c = crit(scoreSubmission(key, s.worksheet.order === o ? s : { ...s, worksheet: { ...s.worksheet, order: o } }), "worksheet");
    expect(c.score).toBeLessThan(25);
    expect(c.score).toBeGreaterThan(24);
  });

  it("langkah yang tidak dikerjakan dihitung salah", () => {
    const s = perfect();
    s.worksheet.order = [];
    expect(crit(scoreSubmission(key, s), "worksheet").score).toBe(15);
  });
});

describe("hasil akhir dan lulus", () => {
  it("batas bawah dan atas rentang masih lulus", () => {
    for (const cargo of [31415.43, 31731.17]) {
      const r = scoreSubmission(key, { ...perfect(), cargo });
      expect(r.passed).toBe(true);
      expect(crit(r, "result").score).toBe(15);
    }
  });

  it("muatan di luar ±0,5% tidak lulus dan kehilangan 15 poin", () => {
    const r = scoreSubmission(key, { ...perfect(), cargo: 31415.42 });
    expect(r.passed).toBe(false);
    expect(crit(r, "result").score).toBe(0);
    expect(r.total).toBe(85);
  });

  it("skor tinggi tetapi muatan di luar rentang tetap tidak lulus", () => {
    const r = scoreSubmission(key, { ...perfect(), cargo: 33000 });
    expect(r.total).toBeGreaterThanOrEqual(85);
    expect(r.passed).toBe(false);
  });

  it("hasil sama untuk masukan sama (mode latihan dan ujian memakai fungsi yang sama)", () => {
    const s = perfect();
    expect(scoreSubmission(key, s)).toEqual(scoreSubmission(key, structuredClone(s)));
  });
});
