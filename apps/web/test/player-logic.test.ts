import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scenarioSchema, scenarioToScoringKey } from "@draught-survey/scenario-schema";
import { scoreSubmission, STEP_ORDER } from "@draught-survey/survey-engine";
import { formatNumber, formatSigned, parseNumber } from "../src/lib/format";
import { buildSubmission, emptyForm, type WorksheetForm } from "../src/lib/worksheet";

describe("format angka Indonesia", () => {
  it("koma desimal dan titik ribuan", () => {
    expect(formatNumber(31573.3, 2)).toBe("31.573,30");
    expect(formatNumber(10.338, 3)).toBe("10,338");
    expect(formatNumber(0.5, 1)).toBe("0,5");
  });

  it("selisih bertanda", () => {
    expect(formatSigned(2.5)).toBe("+2,50");
    expect(formatSigned(-2.5)).toBe("−2,50");
    expect(formatSigned(0)).toBe("0,00");
  });
});

describe("parseNumber", () => {
  it.each([
    ["10,12", 10.12],
    ["10.12", 10.12],
    ["31.573,30", 31573.3],
    ["1.234.567", 1234567],
    ["  8 ", 8],
    ["−0,5", -0.5],
    ["-0,5", -0.5],
  ])("%s → %s", (input, expected) => {
    expect(parseNumber(input)).toBe(expected);
  });

  it.each(["", "abc", "1,2,3", "12.34.5", "10,1x", "--1"])("menolak %j", (input) => {
    expect(parseNumber(input)).toBeNull();
  });
});

const scenario = scenarioSchema.parse(
  JSON.parse(readFileSync(join(__dirname, "../../../content/scenarios/skn-01.json"), "utf8")),
);
const tankIds = scenario.final.tangki.map((t) => t.id);

/** Isian benar dalam format Indonesia, seperti yang diketik peserta. */
function filledForm(): WorksheetForm {
  const f = emptyForm(scenario);
  f.draughts = {
    forward: { port: "10,10", starboard: "10,14" },
    mid: { port: "10,31", starboard: "10,35" },
    aft: { port: "10,58", starboard: "10,62" },
  };
  f.density = "1,018";
  f.soundings = { BALLAST: "3,10", FW: "2,90", HFO: "3,60", MDO: "2,20", LUBE: "1,70", OTHER: "0,90" };
  f.signs = { forward: -1, mid: -1, aft: 1, ftc: 1, stc: 1 };
  f.stepOrder = [...STEP_ORDER];
  f.cargo = "31.573,30";
  return f;
}

describe("lembar kerja → penilaian", () => {
  const key = scenarioToScoringKey(scenario);

  it("isian lengkap dalam format Indonesia menghasilkan skor penuh dan lulus", () => {
    const built = buildSubmission(filledForm(), tankIds);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const r = scoreSubmission(key, built.submission);
    expect(r.total).toBe(100);
    expect(r.passed).toBe(true);
  });

  it("isian kosong menyebut semua yang belum diisi", () => {
    const built = buildSubmission(emptyForm(scenario), tankIds);
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.missing).toContain("Sarat haluan kiri");
    expect(built.missing).toContain("Densitas");
    expect(built.missing).toContain("Sounding BALLAST");
    expect(built.missing).toContain("Tanda FTC");
    expect(built.missing).toContain("Muatan");
    expect(built.missing).toHaveLength(6 + 1 + 6 + 5 + 1);
  });

  it("angka tidak valid dianggap belum diisi", () => {
    const f = filledForm();
    f.density = "satu koma nol";
    const built = buildSubmission(f, tankIds);
    expect(built.ok).toBe(false);
    if (!built.ok) expect(built.missing).toEqual(["Densitas"]);
  });

  it("muatan di luar ±0,5% tidak lulus", () => {
    const f = filledForm();
    f.cargo = "31.000,00";
    const built = buildSubmission(f, tankIds);
    if (!built.ok) throw new Error("seharusnya lengkap");
    expect(scoreSubmission(key, built.submission).passed).toBe(false);
  });

  it("langkah yang belum ditandai menurunkan skor lembar kerja, bukan menghalangi serah", () => {
    const f = filledForm();
    f.stepOrder = [];
    const built = buildSubmission(f, tankIds);
    if (!built.ok) throw new Error("seharusnya lengkap");
    const r = scoreSubmission(key, built.submission);
    expect(r.criteria.find((c) => c.id === "worksheet")!.score).toBe(15);
  });
});
