import { describe, expect, it } from "vitest";
import { interpolateCalibration, tankWeightFromSounding } from "../src/tanks";

const table = [
  { sounding: 0, volume: 0 },
  { sounding: 2, volume: 100 },
  { sounding: 4, volume: 300 },
];

describe("interpolateCalibration", () => {
  it("tepat di baris mengembalikan volume baris", () => {
    expect(interpolateCalibration(table, 2)).toBe(100);
    expect(interpolateCalibration(table, 0)).toBe(0);
  });

  it("menginterpolasi di antara baris", () => {
    expect(interpolateCalibration(table, 3)).toBe(200);
    expect(interpolateCalibration(table, 1)).toBe(50);
  });

  it("menerima tabel tidak berurutan", () => {
    expect(interpolateCalibration([...table].reverse(), 3)).toBe(200);
  });

  it("menolak sounding di luar tabel", () => {
    expect(() => interpolateCalibration(table, 4.1)).toThrow(/di luar/);
    expect(() => interpolateCalibration(table, -0.1)).toThrow(/di luar/);
  });
});

describe("tankWeightFromSounding", () => {
  it("cairan biasa: volume × densitas", () => {
    expect(
      tankWeightFromSounding({
        category: "freshWater",
        calibration: table,
        sounding: 3,
        fluid: { type: "liquid", density: 1.0 },
      }),
    ).toBe(200);
  });

  it("bahan bakar: dengan koreksi suhu", () => {
    // volume 200 m³ pada 45 °C: 200 × 0,95 × (1 − 0,00065 × 30) = 186,295 → 186,30 (dibulatkan 0,01)
    expect(
      tankWeightFromSounding({
        category: "fuel",
        calibration: table,
        sounding: 3,
        fluid: { type: "fuel", density15: 0.95, temperature: 45, expansionPerDegC: 0.00065 },
      }),
    ).toBe(186.3);
  });
});
