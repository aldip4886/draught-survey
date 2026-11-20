import { roundTo } from "./round";

export interface HydrostaticRow {
  /** Sarat (m). */
  draught: number;
  /** Displacement pada sarat itu (t). */
  displacement: number;
  /** Ton per cm (t/cm). */
  tpc: number;
  /** Jarak LCF dari midship (m); negatif = di belakang midship. */
  lcf: number;
  /** Momen untuk mengubah trim 1 cm (t·m); opsional. */
  mtc?: number;
}

export interface HydrostaticValues {
  displacement: number;
  tpc: number;
  lcf: number;
  mtc?: number;
}

/** Interpolasi linear tabel hidrostatik pada sarat tertentu (biasanya QM). */
export function interpolateHydrostatics(table: readonly HydrostaticRow[], draught: number): HydrostaticValues {
  const rows = [...table].sort((a, b) => a.draught - b.draught);
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (!first || !last || draught < first.draught || draught > last.draught) {
    throw new Error(`Sarat ${draught} m di luar rentang tabel hidrostatik`);
  }
  const upperIdx = rows.findIndex((r) => r.draught >= draught);
  const hi = rows[upperIdx]!;
  const lo = hi.draught === draught || upperIdx === 0 ? hi : rows[upperIdx - 1]!;
  const t = hi.draught === lo.draught ? 0 : (draught - lo.draught) / (hi.draught - lo.draught);
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    displacement: lerp(lo.displacement, hi.displacement),
    tpc: lerp(lo.tpc, hi.tpc),
    lcf: lerp(lo.lcf, hi.lcf),
    ...(lo.mtc !== undefined && hi.mtc !== undefined ? { mtc: lerp(lo.mtc, hi.mtc) } : {}),
  };
}

/**
 * Koreksi trim pertama (FTC), dalam ton, dibulatkan 0,01 t (konvensi L1).
 * Trim positif = buritan lebih dalam; LCF negatif = di belakang midship.
 * LCF di belakang + trim buritan → menambah.
 */
export function firstTrimCorrection(p: { trim: number; lcf: number; tpc: number; lbp: number }): number {
  return roundTo((-p.trim * p.lcf * p.tpc * 100) / p.lbp, 2);
}

/**
 * Koreksi trim kedua (STC), dalam ton, dibulatkan 0,01 t.
 * mtcPlus/mtcMinus = MTC pada sarat QM +0,5 m dan −0,5 m. Memakai kuadrat trim,
 * jadi tidak bergantung pada arah trim.
 */
export function secondTrimCorrection(p: { trim: number; mtcPlus: number; mtcMinus: number; lbp: number }): number {
  return roundTo((50 * p.trim * p.trim * (p.mtcPlus - p.mtcMinus)) / p.lbp, 2);
}

export interface CorrectedDisplacementInput {
  table: readonly HydrostaticRow[];
  quarterMean: number;
  trueTrim: number;
  lbp: number;
  mtcPlus: number;
  mtcMinus: number;
  /** Densitas air terukur (t/m³). */
  densityMeasured: number;
  /** Densitas air yang dipakai tabel hidrostatik (t/m³), umumnya 1,025. */
  densityTable: number;
}

export interface CorrectedDisplacement {
  displacement: number;
  tpc: number;
  lcf: number;
  ftc: number;
  stc: number;
  displacementTrimCorrected: number;
  displacementDensityCorrected: number;
}

/** Dari QM dan trim sampai displacement terkoreksi trim dan densitas (L1 langkah 7–12). */
export function correctedDisplacement(input: CorrectedDisplacementInput): CorrectedDisplacement {
  const h = interpolateHydrostatics(input.table, input.quarterMean);
  const ftc = firstTrimCorrection({ trim: input.trueTrim, lcf: h.lcf, tpc: h.tpc, lbp: input.lbp });
  const stc = secondTrimCorrection({
    trim: input.trueTrim,
    mtcPlus: input.mtcPlus,
    mtcMinus: input.mtcMinus,
    lbp: input.lbp,
  });
  const displacementTrimCorrected = roundTo(h.displacement + ftc + stc, 2);
  const displacementDensityCorrected = roundTo(
    (displacementTrimCorrected * input.densityMeasured) / input.densityTable,
    2,
  );
  return {
    displacement: h.displacement,
    tpc: h.tpc,
    lcf: h.lcf,
    ftc,
    stc,
    displacementTrimCorrected,
    displacementDensityCorrected,
  };
}
