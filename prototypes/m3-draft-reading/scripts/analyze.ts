import { readFileSync } from "node:fs";
import {
  DEVICE_LABELS,
  FPS_THRESHOLD,
  MIN_READERS,
  MIN_TRIALS_PER_READER,
  READING_TOLERANCE,
  evaluate,
  type UjiExport,
} from "../src/uji";

/**
 * Menggabungkan berkas hasil (JSON dari tombol "Unduh hasil") dan mencetak laporan Markdown
 * untuk ditempel ke issue #3.   npm run analyze -- hasil-quest3.json hasil-quest2.json hasil-desktop.json
 */
const files = process.argv.slice(2).filter((a) => a !== "--");
if (files.length === 0) {
  console.error("Pemakaian: npm run analyze -- <hasil.json> [<hasil.json> ...]");
  process.exit(2);
}

const exports = files.map((f) => JSON.parse(readFileSync(f, "utf8")) as UjiExport);
const v = evaluate(exports);
const cm = (m: number) => (m * 100).toFixed(1).replace(".", ",") + " cm";
const n1 = (x: number) => x.toFixed(1).replace(".", ",");

const lines: string[] = [];
lines.push("## Hasil uji gerbang prototipe", "");
lines.push(`Berkas: ${files.join(", ")}`, "");
lines.push("### fps", "", "| Perangkat | Ambang | Rekaman terburuk (rata-rata / 1% low / min) | Status |", "|---|---|---|---|");
for (const f of v.fps) {
  const r = f.best;
  const detail = r ? `${n1(r.avg)} / ${n1(r.p1Low)} / ${n1(r.min)} (${r.seconds.toFixed(0)} s)` : "—";
  lines.push(`| ${DEVICE_LABELS[f.deviceClass]} | ≥ ${FPS_THRESHOLD[f.deviceClass]} | ${detail} | ${f.pass ? "✅" : "❌"} ${f.note} |`);
}
lines.push("", `### Pembacaan sarat (toleransi ±${cm(READING_TOLERANCE)}, ≥ ${MIN_READERS} pembaca × ≥ ${MIN_TRIALS_PER_READER} percobaan)`, "");
lines.push("| Pembaca | Percobaan | Dalam ±1 cm | Selisih maks | Rata-rata | Status |", "|---|---|---|---|---|---|");
for (const r of v.readers) {
  lines.push(`| ${r.reader} | ${r.trials} | ${r.withinTolerance} | ${cm(r.maxAbsDiff)} | ${cm(r.meanAbsDiff)} | ${r.pass ? "✅" : "❌"} |`);
}
lines.push("", `Hasil bacaan: ${v.readingPass ? "✅" : "❌"} ${v.readingNote}`, "");
const params = new Set(exports.flatMap((e) => e.trials.map((t) => `amp ${t.amp} m, periode ${t.period} s, tanda ×${t.markScale}`)));
lines.push(`Parameter yang dipakai: ${[...params].join("; ") || "—"}`, "");
lines.push(`### Keputusan: ${v.pass ? "✅ LOLOS" : "❌ BELUM LOLOS"}`);
console.log(lines.join("\n"));
process.exit(v.pass ? 0 : 1);
