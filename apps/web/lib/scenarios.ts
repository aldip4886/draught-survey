import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { scenarioSchema, type Scenario } from "@draught-survey/scenario-schema";

/** Folder skenario. Skenario baru cukup ditambah sebagai berkas JSON di sini. */
export function scenarioDir(): string {
  return process.env.SCENARIO_DIR ?? path.resolve(process.cwd(), "../../content/scenarios");
}

/** Semua skenario yang lolos skema, urut id. Berkas yang tidak lolos dilewati dan dilaporkan di log server. */
export async function loadScenarios(dir = scenarioDir()): Promise<Scenario[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const out: Scenario[] = [];
  for (const f of files) {
    const r = scenarioSchema.safeParse(JSON.parse(await readFile(path.join(dir, f), "utf8")));
    if (r.success) out.push(r.data);
    else console.error(`Skenario ${f} tidak lolos skema:`, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadScenario(id: string, dir = scenarioDir()): Promise<Scenario | null> {
  return (await loadScenarios(dir)).find((s) => s.id === id) ?? null;
}
