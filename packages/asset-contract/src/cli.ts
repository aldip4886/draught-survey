import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateAssets } from "./validate";

/** Validator kontrak aset: `npm run validate` (gagal dengan kode 1 bila ada pelanggaran). */
const assetsDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../content/assets");
const manifest = JSON.parse(readFileSync(join(assetsDir, "manifest.json"), "utf8"));
const issues = validateAssets(manifest, (p) => readFileSync(join(assetsDir, p)));

if (issues.length === 0) {
  console.log("Kontrak aset terpenuhi.");
} else {
  for (const i of issues) console.error(`✗ ${i.asset}: ${i.message}`);
  process.exit(1);
}
