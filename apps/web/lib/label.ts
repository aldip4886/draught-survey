import type { CriterionScore } from "@draught-survey/survey-engine";

const KELOMPOK: Record<string, string> = {
  ballast: "Ballast",
  freshWater: "Air tawar",
  fuel: "Bahan bakar",
  lubricant: "Pelumas",
  other: "Lainnya",
};

export function labelTangki(id: string, kelompok: string): string {
  const k = KELOMPOK[kelompok] ?? kelompok;
  return kelompok === "fuel" ? `${k} ${id}` : k;
}

export const LABEL_KRITERIA: Record<CriterionScore["id"], string> = {
  draught: "Pembacaan sarat",
  density: "Densitas",
  sounding: "Sounding",
  worksheet: "Urutan dan tanda koreksi",
  result: "Hasil akhir",
};
