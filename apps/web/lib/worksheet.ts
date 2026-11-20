import type { Sign, StepId, Submission } from "@draught-survey/survey-engine";
import { STEP_ORDER } from "@draught-survey/survey-engine";
import { parseAngka } from "./angka";

/**
 * Struktur lembar kerja Player. Hanya mengumpulkan isian peserta dan mencatat urutan langkah;
 * tidak menghitung apa pun. Penilaian ada di survey-engine.
 */

export type FieldKind = "angka" | "tanda";

export interface FieldDef {
  id: string;
  label: string;
  kind: FieldKind;
  satuan?: string;
}

export interface StepDef {
  id: StepId;
  judul: string;
  petunjuk: string;
  fields: FieldDef[];
}

export interface TankRef {
  id: string;
  label: string;
}

export type Values = Record<string, string>;

const angka = (id: string, label: string, satuan?: string): FieldDef => ({ id, label, kind: "angka", satuan });
const tanda = (id: string, label: string): FieldDef => ({ id, label, kind: "tanda" });

const SARAT = [
  ["F", "P", "Haluan kiri (P)"],
  ["F", "S", "Haluan kanan (S)"],
  ["M", "P", "Tengah kiri (P)"],
  ["M", "S", "Tengah kanan (S)"],
  ["A", "P", "Buritan kiri (P)"],
  ["A", "S", "Buritan kanan (S)"],
] as const;

export function buildSteps(tanks: readonly TankRef[]): StepDef[] {
  const steps: StepDef[] = [
    {
      id: "read-draughts",
      judul: "Bacaan sarat",
      petunjuk: "Sarat terbaca di enam titik (rata-rata puncak-lembah).",
      fields: SARAT.map(([p, s, label]) => angka(`sarat.${p}.${s}`, label, "m")),
    },
    {
      id: "perpendicular-correction",
      judul: "Koreksi perpendikular",
      petunjuk: "Pindahkan rata-rata sarat ke garis tegak FP, AP, dan midship. Pilih tanda koreksi tiap titik.",
      fields: [
        tanda("tanda.forward", "Tanda ΔF"),
        tanda("tanda.mid", "Tanda ΔM"),
        tanda("tanda.aft", "Tanda ΔA"),
        angka("perp.F", "F terkoreksi", "m"),
        angka("perp.M", "M terkoreksi", "m"),
        angka("perp.A", "A terkoreksi", "m"),
      ],
    },
    { id: "true-trim", judul: "Trim sejati", petunjuk: "Trim dari sarat terkoreksi.", fields: [angka("trim", "Trim sejati", "m")] },
    { id: "quarter-mean", judul: "Quarter mean", petunjuk: "Koreksi hogging/sagging.", fields: [angka("qm", "QM", "m")] },
    {
      id: "hydrostatics",
      judul: "Tabel hidrostatik",
      petunjuk: "Interpolasi tabel pada QM.",
      fields: [angka("hidro.disp", "Displacement", "t"), angka("hidro.tpc", "TPC", "t/cm"), angka("hidro.lcf", "LCF", "m")],
    },
    {
      id: "ftc",
      judul: "Koreksi trim pertama (FTC)",
      petunjuk: "Isi besarnya saja, lalu pilih tandanya.",
      fields: [angka("ftc", "Besar FTC", "t"), tanda("tanda.ftc", "Tanda FTC")],
    },
    {
      id: "stc",
      judul: "Koreksi trim kedua (STC)",
      petunjuk: "Isi besarnya saja, lalu pilih tandanya.",
      fields: [angka("stc", "Besar STC", "t"), tanda("tanda.stc", "Tanda STC")],
    },
    {
      id: "density-correction",
      judul: "Koreksi densitas",
      petunjuk: "Densitas air terukur di sisi kapal dan displacement setelah koreksi densitas.",
      fields: [angka("densitas", "Densitas terukur", "t/m³"), angka("disp.densitas", "Displacement terkoreksi", "t")],
    },
    {
      id: "deductibles",
      judul: "Deductibles",
      petunjuk: "Sounding tiap tangki, lalu jumlah berat deductibles.",
      fields: [...tanks.map((t) => angka(`sounding.${t.id}`, `Sounding ${t.label}`, "m")), angka("deductibles", "Total deductibles", "t")],
    },
    {
      id: "net-displacement",
      judul: "Net displacement",
      petunjuk: "Net displacement final.",
      fields: [angka("net.final", "Net displacement final", "t")],
    },
    { id: "cargo", judul: "Berat muatan", petunjuk: "Hasil akhir yang diserahkan.", fields: [angka("muatan", "Berat muatan", "t")] },
  ];
  return STEP_ORDER.map((id) => steps.find((s) => s.id === id)!);
}

function fieldFilled(f: FieldDef, values: Values): boolean {
  const v = values[f.id] ?? "";
  return f.kind === "tanda" ? v === "-1" || v === "0" || v === "1" : parseAngka(v) !== null;
}

export function stepComplete(step: StepDef, values: Values): boolean {
  return step.fields.every((f) => fieldFilled(f, values));
}

/** Urutan langkah = urutan langkah pertama kali lengkap. Langkah yang dikosongkan lagi tetap pada posisi awalnya. */
export function updateOrder(order: readonly StepId[], steps: readonly StepDef[], values: Values): StepId[] {
  const next = [...order];
  for (const s of steps) if (!next.includes(s.id) && stepComplete(s, values)) next.push(s.id);
  return next;
}

const num = (values: Values, id: string) => parseAngka(values[id] ?? "");
const sign = (values: Values, id: string): Sign | null => {
  const v = values[id];
  return v === "-1" ? -1 : v === "0" ? 0 : v === "1" ? 1 : null;
};

export interface SubmissionResult {
  submission: Submission | null;
  /** Label isian yang dinilai tetapi belum terisi. */
  kurang: string[];
}

export function toSubmission(
  steps: readonly StepDef[],
  values: Values,
  order: readonly StepId[],
  tanks: readonly TankRef[],
): SubmissionResult {
  const labels = new Map(steps.flatMap((s) => s.fields.map((f) => [f.id, f.label] as const)));
  const scored = [
    ...SARAT.map(([p, s]) => `sarat.${p}.${s}`),
    "densitas",
    ...tanks.map((t) => `sounding.${t.id}`),
    "tanda.forward",
    "tanda.mid",
    "tanda.aft",
    "tanda.ftc",
    "tanda.stc",
    "muatan",
  ];
  const kurang = scored.filter((id) => (id.startsWith("tanda.") ? sign(values, id) === null : num(values, id) === null));
  if (kurang.length) return { submission: null, kurang: kurang.map((id) => labels.get(id) ?? id) };

  const pair = (p: string) => ({ port: num(values, `sarat.${p}.P`)!, starboard: num(values, `sarat.${p}.S`)! });
  return {
    kurang: [],
    submission: {
      draughts: { forward: pair("F"), mid: pair("M"), aft: pair("A") },
      density: num(values, "densitas")!,
      soundings: Object.fromEntries(tanks.map((t) => [t.id, num(values, `sounding.${t.id}`)!])),
      worksheet: {
        order: [...order],
        signs: {
          forward: sign(values, "tanda.forward")!,
          mid: sign(values, "tanda.mid")!,
          aft: sign(values, "tanda.aft")!,
          ftc: sign(values, "tanda.ftc")!,
          stc: sign(values, "tanda.stc")!,
        },
      },
      cargo: num(values, "muatan")!,
    },
  };
}
