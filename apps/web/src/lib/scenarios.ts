import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { scenarioSchema, type Scenario } from "@draught-survey/scenario-schema";

/** Folder skenario. Skenario baru = berkas JSON baru di sini, tanpa perubahan kode. */
const DIR = resolve(process.cwd(), "../../content/scenarios");

export function listScenarioFiles(): string[] {
  return readdirSync(DIR).filter((f) => f.endsWith(".json"));
}

export function loadScenario(id: string): Scenario | null {
  const file = listScenarioFiles().find((f) => f.toLowerCase() === `${id.toLowerCase()}.json`);
  if (!file) return null;
  return scenarioSchema.parse(JSON.parse(readFileSync(join(DIR, file), "utf8")));
}

export function listScenarios(): Scenario[] {
  return listScenarioFiles().map((f) => scenarioSchema.parse(JSON.parse(readFileSync(join(DIR, f), "utf8"))));
}
