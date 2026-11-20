"use server";

import type { ScoreReport } from "@draught-survey/survey-engine";
import { nilaiSerahan } from "@/lib/penilaian";
import { loadScenario } from "@/lib/scenarios";

/** Penilaian di server: nilai benar tidak pernah dikirim ke peramban. */
export async function serahkan(id: string, submission: unknown): Promise<ScoreReport> {
  const scenario = await loadScenario(id);
  if (!scenario) throw new Error(`Skenario ${id} tidak ditemukan`);
  return nilaiSerahan(scenario, submission);
}
