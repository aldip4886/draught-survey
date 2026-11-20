import { roundTo } from "./round";

export type DeductibleCategory = "ballast" | "freshWater" | "fuel" | "lubricant" | "other";

export interface Deductible {
  category: DeductibleCategory;
  /** Berat (t). */
  weight: number;
}

/** Berat cairan non-bahan-bakar: volume tabel kalibrasi (m³) × densitas (t/m³), dibulatkan 0,01 t. */
export function liquidWeight(p: { volume: number; density: number }): number {
  return roundTo(p.volume * p.density, 2);
}

/**
 * Berat bahan bakar dengan koreksi suhu.
 * Densitas pada suhu terukur: ρ_t = ρ15 × (1 − α × (t − 15)).
 * Koefisien muai α (per °C) WAJIB diberikan; nilainya bergantung produk dan tabel
 * yang dipakai (mis. ASTM), jadi engine tidak menebak default.
 */
export function fuelWeight(p: {
  volume: number;
  density15: number;
  temperature: number;
  expansionPerDegC: number;
}): number {
  const densityAtTemp = p.density15 * (1 - p.expansionPerDegC * (p.temperature - 15));
  return roundTo(p.volume * densityAtTemp, 2);
}

export interface DeductiblesSummary {
  total: number;
  byCategory: Record<DeductibleCategory, number>;
}

/** Menjumlah semua deductibles, total dan per kategori (dibulatkan 0,01 t). */
export function sumDeductibles(items: readonly Deductible[]): DeductiblesSummary {
  const byCategory: Record<DeductibleCategory, number> = {
    ballast: 0,
    freshWater: 0,
    fuel: 0,
    lubricant: 0,
    other: 0,
  };
  for (const it of items) {
    if (it.weight < 0) throw new Error(`Berat deductible tidak boleh negatif (${it.category}: ${it.weight})`);
    byCategory[it.category] += it.weight;
  }
  for (const k of Object.keys(byCategory) as DeductibleCategory[]) byCategory[k] = roundTo(byCategory[k], 2);
  const total = roundTo(Object.values(byCategory).reduce((a, b) => a + b, 0), 2);
  return { total, byCategory };
}

/** Net displacement = displacement terkoreksi − deductibles. */
export function netDisplacement(displacement: number, deductiblesTotal: number): number {
  return roundTo(displacement - deductiblesTotal, 2);
}

/** Constant = net displacement initial − lightship. Negatif adalah tanda bahaya (dikembalikan apa adanya). */
export function constantFrom(netDisplacementInitial: number, lightship: number): number {
  return roundTo(netDisplacementInitial - lightship, 2);
}

/** Net displacement initial = lightship + constant. */
export function netDisplacementInitial(lightship: number, constant: number): number {
  return roundTo(lightship + constant, 2);
}

/** Muatan = net displacement final − net displacement initial. */
export function cargoWeight(netFinal: number, netInitial: number): number {
  return roundTo(netFinal - netInitial, 2);
}
