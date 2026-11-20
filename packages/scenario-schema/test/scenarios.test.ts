import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  computeCargo,
  scoreSubmission,
  STEP_ORDER,
  type Submission,
} from "@draught-survey/survey-engine";
import { scenarioSchema, scenarioToCargoInput, scenarioToScoringKey } from "../src";

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

describe("SKN-01: penilaian dari berkas skenario", () => {
  const scenario = scenarioSchema.parse(load("skn-01.json"));
  const key = scenarioToScoringKey(scenario);

  const perfect = (): Submission => ({
    draughts: key.draughts,
    density: key.density,
    soundings: Object.fromEntries(scenario.final.tangki.map((t) => [t.id, t.sounding])),
    worksheet: { order: [...STEP_ORDER], signs: key.signs },
    cargo: key.cargo,
  });

  it("kunci muatan 31.573,30 t dan rentang lulus 31.415,43–31.731,17 t", () => {
    expect(key.cargo).toBe(31573.3);
    expect(key.cargoRange).toEqual({ min: 31415.43, max: 31731.17 });
  });

  it("bacaan benar: skor penuh dan lulus", () => {
    const r = scoreSubmission(key, perfect());
    expect(r.total).toBe(100);
    expect(r.passed).toBe(true);
  });

  it("sarat 2 cm meleset dan densitas salah menurunkan skor sesuai rubrik", () => {
    const s = perfect();
    s.draughts = { ...key.draughts, mid: { ...key.draughts.mid, port: key.draughts.mid.port + 0.02 } };
    s.density = 1.016;
    const r = scoreSubmission(key, s);
    expect(r.criteria.find((c) => c.id === "draught")!.score).toBe(20.83);
    expect(r.criteria.find((c) => c.id === "density")!.score).toBe(0);
  });
});
