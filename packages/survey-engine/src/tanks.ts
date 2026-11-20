import { fuelWeight, liquidWeight, type DeductibleCategory } from "./deductibles";

export interface CalibrationRow {
  /** Sounding (m). */
  sounding: number;
  /** Volume pada sounding itu (m³). */
  volume: number;
}

/** Volume (m³) dari sounding lewat interpolasi linear tabel kalibrasi tangki. */
export function interpolateCalibration(table: readonly CalibrationRow[], sounding: number): number {
  const rows = [...table].sort((a, b) => a.sounding - b.sounding);
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (!first || !last || sounding < first.sounding || sounding > last.sounding) {
    throw new Error(`Sounding ${sounding} m di luar rentang tabel kalibrasi`);
  }
  const hiIdx = rows.findIndex((r) => r.sounding >= sounding);
  const hi = rows[hiIdx]!;
  if (hi.sounding === sounding || hiIdx === 0) return hi.volume;
  const lo = rows[hiIdx - 1]!;
  return lo.volume + ((hi.volume - lo.volume) * (sounding - lo.sounding)) / (hi.sounding - lo.sounding);
}

export type TankFluid =
  | { type: "liquid"; density: number }
  | { type: "fuel"; density15: number; temperature: number; expansionPerDegC: number };

export interface TankSounding {
  category: DeductibleCategory;
  calibration: readonly CalibrationRow[];
  sounding: number;
  fluid: TankFluid;
}

/** Berat isi tangki (t) dari sounding: tabel kalibrasi → volume → berat (dengan koreksi suhu untuk bahan bakar). */
export function tankWeightFromSounding(t: TankSounding): number {
  const volume = interpolateCalibration(t.calibration, t.sounding);
  return t.fluid.type === "fuel"
    ? fuelWeight({
        volume,
        density15: t.fluid.density15,
        temperature: t.fluid.temperature,
        expansionPerDegC: t.fluid.expansionPerDegC,
      })
    : liquidWeight({ volume, density: t.fluid.density });
}
