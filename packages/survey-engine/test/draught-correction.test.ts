import { describe, expect, it } from "vitest";
import { correctDraughts } from "../src/draught-correction";
import { L1 } from "./fixtures/l1";

const input = { lbp: L1.lbp, marks: L1.marks, readings: L1.readings };

describe("correctDraughts (L1 langkah 1–6)", () => {
  const r = correctDraughts(input);

  it("menghitung LBM dari LBP dan jarak tanda", () => {
    expect(r.lbm).toBeCloseTo(L1.expected.lbm, 6);
  });

  it("merata-ratakan bacaan kiri dan kanan per titik", () => {
    expect(r.readMeans.forward).toBeCloseTo(L1.expected.readMeans.forward, 6);
    expect(r.readMeans.mid).toBeCloseTo(L1.expected.readMeans.mid, 6);
    expect(r.readMeans.aft).toBeCloseTo(L1.expected.readMeans.aft, 6);
  });

  it("menghitung trim tampak (buritan − haluan)", () => {
    expect(r.apparentTrim).toBeCloseTo(L1.expected.apparentTrim, 6);
  });

  it("mengoreksi sarat ke FP, AP, dan midship (dibulatkan ke mm)", () => {
    expect(r.corrected.forward).toBe(L1.expected.corrected.forward);
    expect(r.corrected.aft).toBe(L1.expected.corrected.aft);
    expect(r.corrected.mid).toBe(L1.expected.corrected.mid);
  });

  it("menghitung trim sejati dari sarat terkoreksi", () => {
    expect(r.trueTrim).toBeCloseTo(L1.expected.trueTrim, 6);
  });

  it("menentukan hogging dengan besar lenturan", () => {
    expect(r.deflection.kind).toBe("hogging");
    expect(r.deflection.magnitude).toBeCloseTo(L1.expected.hoggingM, 4);
  });

  it("menghitung quarter mean", () => {
    expect(r.quarterMean).toBe(L1.expected.quarterMean);
  });

  it("menghitung list dari selisih kiri–kanan di tengah", () => {
    expect(r.listMid).toBeCloseTo(0.04, 6);
  });
});

describe("correctDraughts (kasus sederhana)", () => {
  const base = { lbp: 100, marks: { forwardAftOfFp: 0, aftForwardOfAp: 0, midAftOfMidship: 0 } };
  const even = { port: 8, starboard: 8 };

  it("tanpa trim dan tanda di perpendikular: tidak ada koreksi, tanpa lenturan", () => {
    const r = correctDraughts({ ...base, readings: { forward: even, mid: even, aft: even } });
    expect(r.trueTrim).toBe(0);
    expect(r.quarterMean).toBe(8);
    expect(r.deflection.kind).toBe("none");
  });

  it("sagging bila tengah lebih dalam dari rata-rata haluan–buritan", () => {
    const r = correctDraughts({
      ...base,
      readings: { forward: even, mid: { port: 8.1, starboard: 8.1 }, aft: even },
    });
    expect(r.deflection.kind).toBe("sagging");
    expect(r.deflection.magnitude).toBeCloseTo(0.1, 6);
  });

  it("tanda tengah di depan midship memakai jarak negatif", () => {
    const withTrim = {
      forward: { port: 9, starboard: 9 },
      mid: { port: 9.5, starboard: 9.5 },
      aft: { port: 10, starboard: 10 },
    };
    const aftOfMid = correctDraughts({ lbp: 100, marks: { ...base.marks, midAftOfMidship: 1 }, readings: withTrim });
    const fwdOfMid = correctDraughts({ lbp: 100, marks: { ...base.marks, midAftOfMidship: -1 }, readings: withTrim });
    expect(aftOfMid.corrected.mid).toBeLessThan(9.5);
    expect(fwdOfMid.corrected.mid).toBeGreaterThan(9.5);
  });

  it("menolak LBM nol atau negatif", () => {
    expect(() =>
      correctDraughts({
        lbp: 10,
        marks: { forwardAftOfFp: 6, aftForwardOfAp: 5, midAftOfMidship: 0 },
        readings: { forward: even, mid: even, aft: even },
      }),
    ).toThrow(/LBM/);
  });
});
