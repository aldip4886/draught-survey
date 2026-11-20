import { describe, expect, it } from "vitest";
import { computeCargo } from "../src/compute-cargo";
import { L1, L1_CARGO, L1_HYDRO } from "./fixtures/l1";

/** Fixture wajib: contoh rujukan L1 harus menghasilkan muatan 31.573,30 t (±0,01 t). */
describe("contoh rujukan L1 end-to-end", () => {
  const r = computeCargo({
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
  });

  it("muatan 31.573,30 t (±0,01 t)", () => {
    expect(Math.abs(r.cargo - L1_CARGO.expected.cargo)).toBeLessThanOrEqual(0.01);
  });

  it("angka antara cocok dengan L1", () => {
    expect(r.draughts.quarterMean).toBe(L1.expected.quarterMean);
    expect(r.displacement.displacementDensityCorrected).toBeCloseTo(
      L1_HYDRO.expected.displacementDensityCorrected,
      2,
    );
    expect(r.deductibles.total).toBe(L1_CARGO.expected.deductiblesTotal);
    expect(r.netDisplacementFinal).toBeCloseTo(L1_CARGO.expected.netDisplacementFinal, 2);
    expect(r.netDisplacementInitial).toBe(L1_CARGO.expected.netDisplacementInitial);
  });
});
