import type { GlbInfo } from "./glb";
import { inspectGlb } from "./glb";
import { manifestSchema, type AssetManifest, type ModelEntry } from "./manifest";

export interface ContractIssue {
  /** Peran aset, mis. "ship-hull". */
  asset: string;
  message: string;
}

const AXES = ["x", "y", "z"] as const;

/** Memeriksa satu model terhadap kontrak (README content/assets). Mengembalikan daftar pelanggaran. */
export function checkModel(asset: string, entry: ModelEntry, info: GlbInfo): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const fail = (message: string) => issues.push({ asset, message });

  for (const name of entry.anchors) {
    if (!info.nodeNames.has(name)) fail(`jangkar wajib hilang: ${name}`);
  }
  if (info.triangleCount > entry.polyBudget) {
    fail(`anggaran poligon terlampaui: ${info.triangleCount} segitiga > ${entry.polyBudget}`);
  }

  const [x0, y0, z0, x1, y1, z1] = info.bounds;
  const extent = [x1 - x0, y1 - y0, z1 - z0] as const;
  const longest = Math.max(...extent);

  if (entry.maxExtentMeters) {
    const [lo, hi] = entry.maxExtentMeters;
    if (longest < lo || longest > hi) {
      fail(`ukuran terpanjang ${longest.toFixed(3)} m di luar ${lo}–${hi} m (satuan harus meter)`);
    }
  }
  if (entry.lengthAxis) {
    const idx = AXES.indexOf(entry.lengthAxis);
    if (extent[idx]! < longest - 1e-6) {
      const actual = AXES[extent.indexOf(longest)];
      fail(`orientasi salah: sisi terpanjang di sumbu ${actual}, seharusnya ${entry.lengthAxis} (atas +Y, haluan −Z)`);
    }
  }
  if (entry.baselineOrigin && Math.abs(y0) > 0.1) {
    fail(`origin bukan di baseline: sisi bawah model di y = ${y0.toFixed(3)} m, seharusnya 0`);
  }
  return issues;
}

/** Pelanggaran yang bisa diperiksa tanpa berkas: lisensi kosong dan bentuk manifest. */
export function checkManifest(manifest: unknown): { manifest?: AssetManifest; issues: ContractIssue[] } {
  const parsed = manifestSchema.safeParse(manifest);
  if (!parsed.success) {
    return {
      issues: parsed.error.issues.map((i) => ({ asset: "manifest", message: `${i.path.join(".")}: ${i.message}` })),
    };
  }
  const m = parsed.data;
  const issues: ContractIssue[] = [];
  const groups: [string, Record<string, { license: string }>][] = [
    ["models", m.models],
    ["textures", m.textures],
    ["panoramas", m.panoramas],
  ];
  for (const [group, entries] of groups) {
    for (const [role, e] of Object.entries(entries)) {
      if (e.license.trim() === "") issues.push({ asset: `${group}/${role}`, message: "lisensi kosong" });
    }
  }
  return { manifest: m, issues };
}

/**
 * Validator penuh: manifest + semua model yang `file`-nya terisi.
 * `readFile` mengembalikan byte berkas relatif terhadap folder aset.
 */
export function validateAssets(manifest: unknown, readFile: (path: string) => Uint8Array): ContractIssue[] {
  const { manifest: m, issues } = checkManifest(manifest);
  if (!m) return issues;
  for (const [role, entry] of Object.entries(m.models)) {
    if (entry.file === null) continue;
    let info: GlbInfo;
    try {
      info = inspectGlb(readFile(entry.file));
    } catch (e) {
      issues.push({ asset: role, message: `berkas tidak terbaca: ${(e as Error).message}` });
      continue;
    }
    issues.push(...checkModel(role, entry, info));
  }
  return issues;
}
