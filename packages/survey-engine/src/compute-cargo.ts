import { correctDraughts, type DraughtCorrection, type DraughtCorrectionInput } from "./draught-correction";
import {
  correctedDisplacement,
  interpolateHydrostatics,
  type CorrectedDisplacement,
  type HydrostaticRow,
} from "./hydrostatics";
import {
  cargoWeight,
  netDisplacement,
  netDisplacementInitial,
  sumDeductibles,
  type Deductible,
  type DeductiblesSummary,
} from "./deductibles";

export interface ComputeCargoInput extends DraughtCorrectionInput {
  hydrostatics: {
    table: readonly HydrostaticRow[];
    /** MTC pada QM +0,5 m dan −0,5 m. Bila kosong, diinterpolasi dari tabel (baris wajib punya mtc). */
    mtcPlus?: number;
    mtcMinus?: number;
    densityMeasured: number;
    densityTable: number;
  };
  deductibles: readonly Deductible[];
  initial: { lightship: number; constant: number };
}

export interface ComputeCargoResult {
  draughts: DraughtCorrection;
  displacement: CorrectedDisplacement;
  deductibles: DeductiblesSummary;
  netDisplacementFinal: number;
  netDisplacementInitial: number;
  cargo: number;
}

/** Rantai penuh survey final: dari bacaan sarat sampai muatan (L1 langkah 1–16). */
export function computeCargo(input: ComputeCargoInput): ComputeCargoResult {
  const draughts = correctDraughts(input);
  const qm = draughts.quarterMean;
  const mtcPlus = input.hydrostatics.mtcPlus ?? mtcAt(input.hydrostatics.table, qm + 0.5);
  const mtcMinus = input.hydrostatics.mtcMinus ?? mtcAt(input.hydrostatics.table, qm - 0.5);
  const displacement = correctedDisplacement({
    ...input.hydrostatics,
    mtcPlus,
    mtcMinus,
    quarterMean: draughts.quarterMean,
    trueTrim: draughts.trueTrim,
    lbp: input.lbp,
  });
  const deductibles = sumDeductibles(input.deductibles);
  const netFinal = netDisplacement(displacement.displacementDensityCorrected, deductibles.total);
  const netInitial = netDisplacementInitial(input.initial.lightship, input.initial.constant);
  return {
    draughts,
    displacement,
    deductibles,
    netDisplacementFinal: netFinal,
    netDisplacementInitial: netInitial,
    cargo: cargoWeight(netFinal, netInitial),
  };
}

function mtcAt(table: readonly HydrostaticRow[], draught: number): number {
  const mtc = interpolateHydrostatics(table, draught).mtc;
  if (mtc === undefined) throw new Error("Tabel hidrostatik tidak memuat MTC; berikan mtcPlus dan mtcMinus");
  return mtc;
}
