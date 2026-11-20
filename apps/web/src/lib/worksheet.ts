import type { Scenario } from "@draught-survey/scenario-schema";
import type { Sign, StepId, Submission } from "@draught-survey/survey-engine";
import { parseNumber } from "./format";

/** Keadaan lembar kerja: semua isian berupa teks apa adanya dari peserta. */
export interface WorksheetForm {
  draughts: Record<"forward" | "mid" | "aft", { port: string; starboard: string }>;
  density: string;
  soundings: Record<string, string>;
  signs: Record<"forward" | "mid" | "aft" | "ftc" | "stc", Sign | null>;
  /** Langkah dalam urutan peserta menandainya selesai. */
  stepOrder: StepId[];
  cargo: string;
}

export function emptyForm(scenario: Pick<Scenario, "final">): WorksheetForm {
  return {
    draughts: {
      forward: { port: "", starboard: "" },
      mid: { port: "", starboard: "" },
      aft: { port: "", starboard: "" },
    },
    density: "",
    soundings: Object.fromEntries(scenario.final.tangki.map((t) => [t.id, ""])),
    signs: { forward: null, mid: null, aft: null, ftc: null, stc: null },
    stepOrder: [],
    cargo: "",
  };
}

export type BuildResult = { ok: true; submission: Submission } | { ok: false; missing: string[] };

const POINTS = [
  ["forward", "port", "Sarat haluan kiri"],
  ["forward", "starboard", "Sarat haluan kanan"],
  ["mid", "port", "Sarat tengah kiri"],
  ["mid", "starboard", "Sarat tengah kanan"],
  ["aft", "port", "Sarat buritan kiri"],
  ["aft", "starboard", "Sarat buritan kanan"],
] as const;

/** Mengubah isian teks menjadi Submission untuk mesin hitung, atau menyebut isian yang belum benar. */
export function buildSubmission(form: WorksheetForm, tankIds: readonly string[]): BuildResult {
  const missing: string[] = [];
  const need = (label: string, text: string): number => {
    const n = parseNumber(text);
    if (n === null) missing.push(label);
    return n ?? 0;
  };

  const draughts = { forward: { port: 0, starboard: 0 }, mid: { port: 0, starboard: 0 }, aft: { port: 0, starboard: 0 } };
  for (const [p, side, label] of POINTS) draughts[p][side] = need(label, form.draughts[p][side]);
  const density = need("Densitas", form.density);
  const soundings: Record<string, number> = {};
  for (const id of tankIds) soundings[id] = need(`Sounding ${id}`, form.soundings[id] ?? "");
  const cargo = need("Muatan", form.cargo);

  const signLabels = {
    forward: "Tanda koreksi haluan",
    mid: "Tanda koreksi tengah",
    aft: "Tanda koreksi buritan",
    ftc: "Tanda FTC",
    stc: "Tanda STC",
  } as const;
  const signs = {} as Record<keyof typeof signLabels, Sign>;
  for (const k of Object.keys(signLabels) as (keyof typeof signLabels)[]) {
    const v = form.signs[k];
    if (v === null) missing.push(signLabels[k]);
    signs[k] = v ?? 0;
  }

  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    submission: { draughts, density, soundings, worksheet: { order: form.stepOrder, signs }, cargo },
  };
}
