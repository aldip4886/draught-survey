import { z } from "zod";
import { scoreSubmission, STEP_ORDER, type ScoreReport, type Submission } from "@draught-survey/survey-engine";
import { scenarioToScoringKey, type Scenario } from "@draught-survey/scenario-schema";

const sidePair = z.object({ port: z.number().finite(), starboard: z.number().finite() });
const signSchema = z.union([z.literal(-1), z.literal(0), z.literal(1)]);

/** Bentuk serahan dari peramban; diperiksa ulang di server sebelum dinilai. */
export const submissionSchema = z.object({
  draughts: z.object({ forward: sidePair, mid: sidePair, aft: sidePair }),
  density: z.number().finite(),
  soundings: z.record(z.number().finite()),
  worksheet: z.object({
    order: z.array(z.enum(STEP_ORDER)),
    signs: z.object({ forward: signSchema, mid: signSchema, aft: signSchema, ftc: signSchema, stc: signSchema }),
  }),
  cargo: z.number().finite(),
});

/** Menilai serahan terhadap kunci dari berkas skenario. Semua rumus dan skor di survey-engine. */
export function nilaiSerahan(scenario: Scenario, raw: unknown): ScoreReport {
  const submission: Submission = submissionSchema.parse(raw);
  return scoreSubmission(scenarioToScoringKey(scenario), submission);
}
