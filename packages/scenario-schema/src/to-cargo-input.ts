import {
  buildScoringKey,
  tankWeightFromSounding,
  type ComputeCargoInput,
  type Deductible,
  type HydrostaticRow,
  type NamedTank,
  type ScoringKey,
  type TankSounding,
} from "@draught-survey/survey-engine";
import type { Scenario } from "./schema";

function toTankSounding(t: Scenario["final"]["tangki"][number]): TankSounding {
  return {
    category: t.kelompok,
    calibration: t.kalibrasi,
    sounding: t.sounding,
    fluid:
      t.fluida.jenis === "cairan"
        ? { type: "liquid", density: t.fluida.densitas }
        : {
            type: "fuel",
            density15: t.fluida.densitas15,
            temperature: t.fluida.suhu,
            expansionPerDegC: t.fluida.koefisienMuai,
          },
  };
}

/**
 * Memetakan data skenario ke masukan mesin hitung. Hanya pemetaan nama;
 * semua rumus tetap di survey-engine. Sarat yang dipakai adalah nilai benar (bacaan puncak-lembah).
 */
export function scenarioToCargoInput(s: Scenario): ComputeCargoInput {
  const hydroRows: HydrostaticRow[] = s.hidrostatik.baris.map((r) => ({
    draught: r.sarat,
    displacement: r.displacement,
    tpc: r.tpc,
    lcf: r.lcf,
    mtc: r.mtc,
  }));
  const deductibles: Deductible[] = s.final.tangki.map((t) => ({
    category: t.kelompok,
    weight: tankWeightFromSounding(toTankSounding(t)),
  }));
  return {
    lbp: s.kapal.lbp,
    marks: {
      forwardAftOfFp: s.kapal.tanda.haluanDiBelakangFp,
      aftForwardOfAp: s.kapal.tanda.buritanDiDepanAp,
      midAftOfMidship: s.kapal.tanda.tengahDiBelakangMidship,
    },
    readings: { forward: s.final.sarat.haluan, mid: s.final.sarat.tengah, aft: s.final.sarat.buritan },
    hydrostatics: {
      table: hydroRows,
      densityMeasured: s.final.densitas,
      densityTable: s.hidrostatik.densitasTabel,
    },
    deductibles,
    initial: { lightship: s.kapal.lightship, constant: s.initial.constant },
  };
}

/** Kunci penilaian dari berkas skenario: nilai benar + tangki bernama. */
export function scenarioToScoringKey(s: Scenario): ScoringKey {
  const tanks: NamedTank[] = s.final.tangki.map((t) => ({ id: t.id, ...toTankSounding(t) }));
  return buildScoringKey(scenarioToCargoInput(s), tanks);
}
