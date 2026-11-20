import { describe, expect, it } from "vitest";
import {
  correctedDisplacement,
  firstTrimCorrection,
  interpolateHydrostatics,
  secondTrimCorrection,
} from "../src/hydrostatics";
import { L1, L1_HYDRO as H } from "./fixtures/l1";

describe("interpolateHydrostatics", () => {
  const h = interpolateHydrostatics(H.table, L1.expected.quarterMean);

  it("menginterpolasi displacement, TPC, dan LCF pada QM (L1 langkah 7)", () => {
    expect(h.displacement).toBeCloseTo(H.expected.displacement, 2);
    expect(h.tpc).toBeCloseTo(H.expected.tpc, 6);
    expect(h.lcf).toBeCloseTo(H.expected.lcf, 6);
  });

  it("tepat di baris tabel mengembalikan nilai baris itu", () => {
    expect(interpolateHydrostatics(H.table, 10.4).displacement).toBe(41720);
  });

  it("menginterpolasi MTC bila tabel memilikinya", () => {
    const table = [
      { draught: 5, displacement: 100, tpc: 1, lcf: 0, mtc: 10 },
      { draught: 6, displacement: 200, tpc: 2, lcf: 0, mtc: 20 },
    ];
    expect(interpolateHydrostatics(table, 5.5).mtc).toBeCloseTo(15, 9);
  });

  it("menerima tabel yang tidak berurutan", () => {
    const reversed = [...H.table].reverse();
    expect(interpolateHydrostatics(reversed, 10.338).displacement).toBeCloseTo(H.expected.displacement, 2);
  });

  it("menolak sarat di luar tabel", () => {
    expect(() => interpolateHydrostatics(H.table, 10.5)).toThrow(/di luar/);
    expect(() => interpolateHydrostatics(H.table, 10.2)).toThrow(/di luar/);
  });
});

describe("koreksi trim", () => {
  const trim = L1.expected.trueTrim;

  it("FTC: LCF di belakang midship dan trim buritan menambah (L1 langkah 8)", () => {
    expect(firstTrimCorrection({ trim, lcf: H.expected.lcf, tpc: H.expected.tpc, lbp: L1.lbp })).toBe(
      H.expected.ftc,
    );
  });

  it("FTC berbalik tanda bila LCF di depan midship", () => {
    const fwd = firstTrimCorrection({ trim, lcf: 2.838, tpc: H.expected.tpc, lbp: L1.lbp });
    expect(fwd).toBe(-H.expected.ftc);
  });

  it("FTC nol tanpa trim", () => {
    expect(firstTrimCorrection({ trim: 0, lcf: -2.8, tpc: 52, lbp: 180 })).toBe(0);
  });

  it("STC (L1 langkah 9)", () => {
    expect(secondTrimCorrection({ trim, mtcPlus: H.mtcPlus, mtcMinus: H.mtcMinus, lbp: L1.lbp })).toBe(
      H.expected.stc,
    );
  });

  it("STC tidak bergantung pada arah trim", () => {
    const a = secondTrimCorrection({ trim: 0.5, mtcPlus: 541, mtcMinus: 503, lbp: 180 });
    const b = secondTrimCorrection({ trim: -0.5, mtcPlus: 541, mtcMinus: 503, lbp: 180 });
    expect(a).toBe(b);
  });
});

describe("correctedDisplacement (L1 langkah 7–12)", () => {
  const r = correctedDisplacement({
    table: H.table,
    quarterMean: L1.expected.quarterMean,
    trueTrim: L1.expected.trueTrim,
    lbp: L1.lbp,
    mtcPlus: H.mtcPlus,
    mtcMinus: H.mtcMinus,
    densityMeasured: H.densityMeasured,
    densityTable: H.densityTable,
  });

  it("menghasilkan angka antara L1", () => {
    expect(r.displacement).toBeCloseTo(H.expected.displacement, 2);
    expect(r.ftc).toBe(H.expected.ftc);
    expect(r.stc).toBe(H.expected.stc);
    expect(r.displacementTrimCorrected).toBeCloseTo(H.expected.displacementTrimCorrected, 2);
    expect(r.displacementDensityCorrected).toBeCloseTo(H.expected.displacementDensityCorrected, 2);
  });

  it("densitas sama dengan tabel tidak mengubah displacement", () => {
    const same = correctedDisplacement({
      table: H.table,
      quarterMean: 10.338,
      trueTrim: 0.505,
      lbp: 180,
      mtcPlus: 541,
      mtcMinus: 503,
      densityMeasured: 1.025,
      densityTable: 1.025,
    });
    expect(same.displacementDensityCorrected).toBe(same.displacementTrimCorrected);
  });
});
