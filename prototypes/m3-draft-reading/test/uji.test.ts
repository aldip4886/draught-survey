import { describe, expect, it } from "vitest";
import {
  completeTrial,
  evaluate,
  fpsStats,
  randomTrueDraught,
  type FpsRun,
  type Trial,
  type UjiExport,
} from "../src/uji";

describe("fpsStats", () => {
  it("60 fps stabil", () => {
    const s = fpsStats(Array(600).fill(1 / 60));
    expect(s.avg).toBe(60);
    expect(s.min).toBe(60);
    expect(s.p1Low).toBe(60);
    expect(s.seconds).toBe(10);
  });

  it("satu frame lambat menurunkan min, bukan rata-rata", () => {
    const dts = [...Array(999).fill(1 / 72), 0.1];
    const s = fpsStats(dts);
    expect(s.min).toBe(10);
    expect(s.avg).toBeGreaterThan(70);
  });

  it("1% frame lambat tampak di p1Low", () => {
    const dts = [...Array(990).fill(1 / 72), ...Array(10).fill(1 / 30)];
    const s = fpsStats(dts);
    expect(s.p1Low).toBe(30);
    expect(s.avg).toBeGreaterThan(70);
  });

  it("mengabaikan nilai tidak valid; kosong → nol", () => {
    expect(fpsStats([0, -1, NaN]).frames).toBe(0);
    expect(fpsStats([]).avg).toBe(0);
  });
});

describe("percobaan", () => {
  it("sarat acak 2 desimal dalam rentang pelat", () => {
    for (const r of [0, 0.5, 0.999999]) {
      const d = randomTrueDraught(() => r);
      expect(d).toBeGreaterThanOrEqual(9.8);
      expect(d).toBeLessThanOrEqual(10.8);
      expect(Math.round(d * 100) / 100).toBe(d);
    }
  });

  it("selisih = bacaan − sebenarnya", () => {
    const t = completeTrial(trial(1, "R1", 10.33, null), 10.36);
    expect(t.diff).toBe(0.03);
  });
});

function trial(id: number, reader: string, trueDraught: number, reading: number | null): Trial {
  return {
    id,
    reader,
    trueDraught,
    reading,
    diff: reading === null ? null : Math.round((reading - trueDraught) * 1000) / 1000,
    amp: 0.15,
    period: 5,
    markScale: 1,
    at: "2026-11-20T08:00:00Z",
  };
}

const run = (deviceClass: FpsRun["deviceClass"], avg: number, seconds = 30, inXR = deviceClass !== "desktop"): FpsRun => ({
  deviceClass, inXR, seconds, frames: Math.round(avg * seconds), avg, p1Low: avg - 5, min: avg - 20, at: "x",
});

const exp = (trials: Trial[], fpsRuns: FpsRun[]): UjiExport => ({
  version: 1,
  deviceClass: "desktop",
  deviceLabel: "uji",
  userAgent: "ua",
  exportedAt: "x",
  trials,
  fpsRuns,
});

const goodTrials = (reader: string, n = 5, off = 0.005) =>
  Array.from({ length: n }, (_, i) => trial(i + 1, reader, 10 + i * 0.1, 10 + i * 0.1 + off));

const allFps = [run("quest3", 72), run("quest2", 72), run("desktop", 55)];

describe("evaluate", () => {
  it("lolos bila semua fps memenuhi dan dua pembaca ≤ 1 cm", () => {
    const v = evaluate([exp([...goodTrials("R1"), ...goodTrials("R2", 5, -0.01)], allFps)]);
    expect(v.pass).toBe(true);
    expect(v.readers.map((r) => r.pass)).toEqual([true, true]);
  });

  it("batas tepat (72 fps, 1,0 cm) masih lolos", () => {
    const v = evaluate([exp([...goodTrials("R1", 5, 0.01), ...goodTrials("R2", 5, -0.01)], allFps)]);
    expect(v.pass).toBe(true);
  });

  it("Quest 2 di bawah 72 gagal", () => {
    const v = evaluate([exp([...goodTrials("R1"), ...goodTrials("R2")], [run("quest3", 80), run("quest2", 66), run("desktop", 60)])]);
    expect(v.pass).toBe(false);
    expect(v.fps.find((f) => f.deviceClass === "quest2")!.pass).toBe(false);
  });

  it("desktop 49 fps gagal, 50 lolos", () => {
    const base = [...goodTrials("R1"), ...goodTrials("R2")];
    expect(evaluate([exp(base, [run("quest3", 72), run("quest2", 72), run("desktop", 49)])]).pass).toBe(false);
    expect(evaluate([exp(base, [run("quest3", 72), run("quest2", 72), run("desktop", 50)])]).pass).toBe(true);
  });

  it("rekaman terlalu pendek atau Quest di luar VR tidak dihitung", () => {
    const base = [...goodTrials("R1"), ...goodTrials("R2")];
    const v = evaluate([exp(base, [run("quest3", 90, 10), run("quest2", 90, 30, false), run("desktop", 60)])]);
    expect(v.fps.find((f) => f.deviceClass === "quest3")!.note).toMatch(/belum ada rekaman/);
    expect(v.fps.find((f) => f.deviceClass === "quest2")!.note).toMatch(/di dalam sesi VR/);
    expect(v.pass).toBe(false);
  });

  it("memakai rekaman terburuk: satu rekaman rendah menggagalkan", () => {
    const base = [...goodTrials("R1"), ...goodTrials("R2")];
    const v = evaluate([exp(base, [run("quest3", 90), run("quest3", 60), run("quest2", 72), run("desktop", 60)])]);
    expect(v.fps.find((f) => f.deviceClass === "quest3")!.pass).toBe(false);
  });

  it("satu pembaca saja belum cukup", () => {
    const v = evaluate([exp(goodTrials("R1"), allFps)]);
    expect(v.readingPass).toBe(false);
    expect(v.readingNote).toMatch(/butuh ≥ 2 pembaca/);
  });

  it("pembaca dengan kurang dari 5 percobaan tidak dihitung", () => {
    const v = evaluate([exp([...goodTrials("R1"), ...goodTrials("R2", 4)], allFps)]);
    expect(v.readingPass).toBe(false);
  });

  it("satu percobaan 1,5 cm meleset menggagalkan pembaca itu", () => {
    const bad = goodTrials("R2");
    bad[2] = trial(3, "R2", 10.2, 10.215);
    const v = evaluate([exp([...goodTrials("R1"), ...bad], allFps)]);
    expect(v.readingPass).toBe(false);
    expect(v.readers.find((r) => r.reader === "R2")!.maxAbsDiff).toBe(0.015);
  });

  it("percobaan yang belum dikunci diabaikan; data dari beberapa berkas digabung", () => {
    const withOpen = [...goodTrials("R1"), trial(6, "R1", 10.5, null)];
    const v = evaluate([
      exp(withOpen, [run("quest3", 72)]),
      exp(goodTrials("R2"), [run("quest2", 72), run("desktop", 55)]),
    ]);
    expect(v.readers.find((r) => r.reader === "R1")!.trials).toBe(5);
    expect(v.pass).toBe(true);
  });
});
