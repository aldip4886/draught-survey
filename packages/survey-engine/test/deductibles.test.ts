import { describe, expect, it } from "vitest";
import {
  cargoWeight,
  constantFrom,
  fuelWeight,
  liquidWeight,
  netDisplacement,
  netDisplacementInitial,
  sumDeductibles,
} from "../src/deductibles";
import { L1_CARGO as C, L1_HYDRO } from "./fixtures/l1";

describe("berat cairan", () => {
  it("volume × densitas", () => {
    expect(liquidWeight({ volume: 180, density: 1.0 })).toBe(180);
    expect(liquidWeight({ volume: 342, density: 1.0234 })).toBe(350.0);
  });

  it("bahan bakar pada 15 °C tidak dikoreksi", () => {
    expect(fuelWeight({ volume: 1000, density15: 0.95, temperature: 15, expansionPerDegC: 0.00065 })).toBe(950);
  });

  it("bahan bakar lebih panas lebih ringan per volume", () => {
    // ρ_t = 0,95 × (1 − 0,00065 × 30) = 0,931475 → 931,48 t
    expect(fuelWeight({ volume: 1000, density15: 0.95, temperature: 45, expansionPerDegC: 0.00065 })).toBe(931.48);
  });

  it("bahan bakar lebih dingin lebih berat per volume", () => {
    expect(fuelWeight({ volume: 1000, density15: 0.95, temperature: 5, expansionPerDegC: 0.00065 })).toBe(956.18);
  });
});

describe("sumDeductibles", () => {
  const s = sumDeductibles(C.deductibles);

  it("menjumlah total deductibles L1 (langkah 13)", () => {
    expect(s.total).toBe(C.expected.deductiblesTotal);
  });

  it("menjumlah per kategori, bahan bakar HFO + MDO", () => {
    expect(s.byCategory.ballast).toBe(350);
    expect(s.byCategory.fuel).toBe(915);
    expect(s.byCategory.other).toBe(10);
  });

  it("daftar kosong menghasilkan nol", () => {
    expect(sumDeductibles([]).total).toBe(0);
  });

  it("menolak berat negatif", () => {
    expect(() => sumDeductibles([{ category: "ballast", weight: -1 }])).toThrow(/negatif/);
  });
});

describe("net displacement, constant, dan muatan (L1 langkah 14–16)", () => {
  it("net displacement final", () => {
    expect(netDisplacement(L1_HYDRO.expected.displacementDensityCorrected, C.expected.deductiblesTotal)).toBe(
      C.expected.netDisplacementFinal,
    );
  });

  it("net displacement initial = lightship + constant", () => {
    expect(netDisplacementInitial(C.lightship, C.constant)).toBe(C.expected.netDisplacementInitial);
  });

  it("constant dari net displacement initial", () => {
    expect(constantFrom(C.expected.netDisplacementInitial, C.lightship)).toBe(C.constant);
  });

  it("constant negatif dikembalikan apa adanya", () => {
    expect(constantFrom(7800, 7850)).toBe(-50);
  });

  it("muatan = final − initial", () => {
    expect(cargoWeight(C.expected.netDisplacementFinal, C.expected.netDisplacementInitial)).toBe(C.expected.cargo);
  });
});
