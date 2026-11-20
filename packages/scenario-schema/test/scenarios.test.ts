import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { computeCargo } from "@draught-survey/survey-engine";
import { scenarioSchema, scenarioToCargoInput } from "../src";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../../../content/scenarios");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
const load = (f: string): unknown => JSON.parse(readFileSync(join(dir, f), "utf8"));

describe("semua berkas di content/scenarios", () => {
  it("ada setidaknya SKN-01", () => {
    expect(files).toContain("skn-01.json");
  });

  it.each(files)("%s lolos validasi skema", (f) => {
    const r = scenarioSchema.safeParse(load(f));
    expect(r.success, r.success ? "" : JSON.stringify(r.error.issues, null, 2)).toBe(true);
  });
});

describe("SKN-01", () => {
  const scenario = scenarioSchema.parse(load("skn-01.json"));

  it("ditandai belum divalidasi SME", () => {
    expect(scenario.validasi.smeValidated).toBe(false);
    expect(scenario.validasi.catatan).toMatch(/SME/);
  });

  it("dengan bacaan benar menghasilkan muatan 31.573,30 t (±0,01 t)", () => {
    const r = computeCargo(scenarioToCargoInput(scenario));
    expect(Math.abs(r.cargo - 31573.3)).toBeLessThanOrEqual(0.01);
    expect(r.deductibles.total).toBe(1480);
    expect(r.draughts.quarterMean).toBe(10.338);
  });
});

describe("validasi skema menolak data yang salah", () => {
  const base = () => structuredClone(load("skn-01.json")) as Record<string, any>;

  it("tanpa penanda validasi", () => {
    const s = base();
    delete s.validasi;
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });

  it("LBM nol atau negatif", () => {
    const s = base();
    s.kapal.tanda.haluanDiBelakangFp = 100;
    s.kapal.tanda.buritanDiDepanAp = 90;
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });

  it("sounding melampaui tabel kalibrasi", () => {
    const s = base();
    s.final.tangki[0].sounding = 99;
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });

  it("id tangki duplikat", () => {
    const s = base();
    s.final.tangki[1].id = s.final.tangki[0].id;
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });

  it("id skenario tidak berbentuk SKN-NN", () => {
    const s = base();
    s.id = "contoh";
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });
});
