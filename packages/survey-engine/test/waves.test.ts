import { describe, expect, it } from "vitest";
import {
  markPoint,
  peakTroughBias,
  peakTroughReading,
  stillDraughtFor,
  waterlineOnHull,
  waveHeight,
  hullVerticalOffset,
  type MarkGeometry,
} from "../src/waves";
import { L1 } from "./fixtures/l1";

const calm = { amp: 0, period: 6 };
const skn = { amp: 0.15, period: 5 };

describe("waveHeight", () => {
  it("sama untuk parameter dan waktu yang sama (deterministik)", () => {
    expect(waveHeight(12.3, -4.5, 7.7, skn)).toBe(waveHeight(12.3, -4.5, 7.7, skn));
  });

  it("amplitudo nol berarti air datar", () => {
    expect(waveHeight(3, 4, 5, calm)).toBe(0);
  });

  it("nilai di titik asal pada t=0 dari fase komponen: 0,5·amp·sin(1,3)", () => {
    expect(waveHeight(0, 0, 0, { amp: 0.4, period: 6 })).toBeCloseTo(0.2 * Math.sin(1.3), 12);
  });

  it("berulang pada kelipatan periode bila hanya ombak utama berperiode sama (amp swell tidak ikut)", () => {
    // komponen swell berperiode 1,7×, jadi gabungan tidak berulang tiap periode utama
    const a = waveHeight(5, 5, 0, skn);
    const b = waveHeight(5, 5, skn.period, skn);
    expect(Math.abs(a - b)).toBeGreaterThan(1e-6);
  });

  it("tidak pernah melampaui jumlah amplitudo", () => {
    for (let t = 0; t < 60; t += 0.7) expect(Math.abs(waveHeight(1, 2, t, skn))).toBeLessThanOrEqual(0.225 + 1e-9);
  });
});

describe("garis air di lambung", () => {
  it("air datar: garis air sama dengan sarat air tenang di mana pun", () => {
    expect(waterlineOnHull(10.33, 20, 15, 3, calm)).toBe(10.33);
  });

  it("kapal ikut naik: garis air relatif lebih tenang dari tinggi air mentah", () => {
    let rawRange = 0;
    let relRange = 0;
    let rawMax = -Infinity, rawMin = Infinity, relMax = -Infinity, relMin = Infinity;
    for (let t = 0; t < 60; t += 0.05) {
      const raw = waveHeight(0, 15, t, skn);
      const rel = waterlineOnHull(0, 0, 15, t, skn);
      rawMax = Math.max(rawMax, raw); rawMin = Math.min(rawMin, raw);
      relMax = Math.max(relMax, rel); relMin = Math.min(relMin, rel);
    }
    rawRange = rawMax - rawMin;
    relRange = relMax - relMin;
    expect(relRange).toBeLessThan(rawRange);
  });

  it("sisi yang air-nya lebih tinggi ikut terangkat (tanda roll benar)", () => {
    // cari t di mana air di starboard jauh lebih tinggi daripada port; lambung starboard harus naik
    let found = false;
    for (let t = 0; t < 60 && !found; t += 0.05) {
      const diff = waveHeight(0, 15, t, skn) - waveHeight(0, -15, t, skn);
      if (diff > 0.1) {
        expect(hullVerticalOffset(0, 15, t, skn)).toBeGreaterThan(hullVerticalOffset(0, -15, t, skn));
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});

describe("nilai puncak-lembah", () => {
  const geom: MarkGeometry = { lbp: L1.lbp, ...L1.marks, halfBeam: 15 };

  it("tanpa ombak, bias nol dan bacaan benar = sarat air tenang", () => {
    expect(peakTroughBias(0, 15, calm)).toBe(0);
    expect(peakTroughReading(10.33, 0, 15, calm)).toBe(10.33);
  });

  it("deterministik dan tidak bergantung pada sarat air tenang", () => {
    expect(peakTroughBias(10, 15, skn)).toBe(peakTroughBias(10, 15, skn));
    const a = peakTroughReading(10.1, 10, 15, skn) - 10.1;
    const b = peakTroughReading(10.6, 10, 15, skn) - 10.6;
    expect(a).toBeCloseTo(b, 3);
  });

  it("bias di SKN-01 kecil dibanding toleransi 1 cm pada enam titik", () => {
    for (const pos of ["forward", "mid", "aft"] as const) {
      for (const side of ["port", "starboard"] as const) {
        const { x, z } = markPoint(geom, pos, side);
        expect(Math.abs(peakTroughBias(x, z, skn))).toBeLessThanOrEqual(0.01);
      }
    }
  });

  it("stillDraughtFor dan peakTroughReading saling membalik (±1 mm)", () => {
    const { x, z } = markPoint(geom, "aft", "starboard");
    const still = stillDraughtFor(10.62, x, z, skn);
    expect(peakTroughReading(still, x, z, skn)).toBeCloseTo(10.62, 3);
  });
});

describe("markPoint", () => {
  const geom: MarkGeometry = { lbp: L1.lbp, ...L1.marks, halfBeam: 15 };

  it("menempatkan tanda sesuai jarak dari FP, AP, dan midship", () => {
    expect(markPoint(geom, "forward", "starboard")).toEqual({ x: 87, z: 15 });
    expect(markPoint(geom, "aft", "port")).toEqual({ x: -84, z: -15 });
    expect(markPoint(geom, "mid", "starboard")).toEqual({ x: -0.5, z: 15 });
  });
});
