import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { STEP_ORDER } from "@draught-survey/survey-engine";
import { toPublicScenario } from "@draught-survey/scenario-schema";
import { nilaiSerahan } from "@/lib/penilaian";
import { loadScenario, loadScenarios, scenarioDir } from "@/lib/scenarios";
import { buildSteps, toSubmission, updateOrder, type Values } from "@/lib/worksheet";

const dir = path.resolve(__dirname, "../../../content/scenarios");

/** Isian peserta yang benar untuk SKN-01 (contoh rujukan L1), dalam format Indonesia. */
const BENAR: Values = {
  "sarat.F.P": "10,10",
  "sarat.F.S": "10,14",
  "sarat.M.P": "10,31",
  "sarat.M.S": "10,35",
  "sarat.A.P": "10,58",
  "sarat.A.S": "10,62",
  "tanda.forward": "-1",
  "tanda.mid": "-1",
  "tanda.aft": "1",
  "perp.F": "10,112",
  "perp.M": "10,329",
  "perp.A": "10,617",
  trim: "0,505",
  qm: "10,338",
  "hidro.disp": "41.397,60",
  "hidro.tpc": "52,038",
  "hidro.lcf": "-2,838",
  ftc: "41,43",
  "tanda.ftc": "1",
  stc: "2,69",
  "tanda.stc": "1",
  densitas: "1,018",
  "disp.densitas": "41.158,70",
  deductibles: "1.480,00",
  "net.final": "39.678,70",
  muatan: "31.573,30",
};

async function siapkan() {
  const scenario = (await loadScenario("SKN-01", dir))!;
  const pub = toPublicScenario(scenario);
  const tanks = pub.tangki.map((t) => ({ id: t.id, label: t.id }));
  const values: Values = { ...BENAR };
  for (const t of scenario.final.tangki) values[`sounding.${t.id}`] = String(t.sounding).replace(".", ",");
  return { scenario, tanks, steps: buildSteps(tanks), values };
}

describe("alur Player SKN-01 (briefing → lembar kerja → serahkan → skor)", () => {
  it("isian benar, diisi berurutan, mendapat skor penuh dan lulus", async () => {
    const { scenario, tanks, steps, values } = await siapkan();
    let order: (typeof STEP_ORDER)[number][] = [];
    const filled: Values = {};
    for (const step of steps) {
      for (const f of step.fields) filled[f.id] = values[f.id]!;
      order = updateOrder(order, steps, filled);
    }
    expect(order).toEqual([...STEP_ORDER]);

    const { submission, kurang } = toSubmission(steps, filled, order, tanks);
    expect(kurang).toEqual([]);
    const report = nilaiSerahan(scenario, JSON.parse(JSON.stringify(submission)));
    expect(report.passed).toBe(true);
    expect(report.total).toBe(report.max);
    expect(report.cargoRange).toEqual({ min: 31415.43, max: 31731.17 });
  });

  it("satu sarat meleset 2 cm dan muatan di luar rentang menurunkan skor", async () => {
    const { scenario, tanks, steps, values } = await siapkan();
    const v = { ...values, "sarat.F.P": "10,12", muatan: "31.000" };
    const { submission } = toSubmission(steps, v, [...STEP_ORDER], tanks);
    const report = nilaiSerahan(scenario, submission);
    expect(report.passed).toBe(false);
    const byId = Object.fromEntries(report.criteria.map((c) => [c.id, c.score]));
    expect(byId.draught).toBeLessThan(25);
    expect(byId.result).toBe(0);
  });

  it("serahan belum lengkap tidak bisa dikirim dan menyebut isian yang kurang", async () => {
    const { tanks, steps } = await siapkan();
    const { submission, kurang } = toSubmission(steps, { "sarat.F.P": "10,10" }, [], tanks);
    expect(submission).toBeNull();
    expect(kurang).toContain("Haluan kanan (S)");
    expect(kurang).toContain("Berat muatan");
  });

  it("serahan cacat ditolak server", async () => {
    const { scenario } = await siapkan();
    expect(() => nilaiSerahan(scenario, { cargo: "banyak" })).toThrow();
  });
});

describe("pemuatan skenario", () => {
  it("default membaca content/scenarios di root repo", () => {
    expect(path.normalize(scenarioDir())).toBe(path.normalize(path.resolve(process.cwd(), "../../content/scenarios")));
  });

  it("skenario baru dimuat hanya dengan menambah berkas; berkas tidak valid dilewati", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "skenario-"));
    const skn01 = JSON.parse(await readFile(path.join(dir, "skn-01.json"), "utf8"));
    await writeFile(path.join(tmp, "skn-01.json"), JSON.stringify(skn01));
    await writeFile(path.join(tmp, "skn-09.json"), JSON.stringify({ ...skn01, id: "SKN-09", judul: "Latihan tambahan" }));
    await writeFile(path.join(tmp, "rusak.json"), JSON.stringify({ id: "x" }));
    const list = await loadScenarios(tmp);
    expect(list.map((s) => s.id)).toEqual(["SKN-01", "SKN-09"]);
  });
});
