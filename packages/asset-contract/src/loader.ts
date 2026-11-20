import type { AssetManifest } from "./manifest";

/** Model yang siap dipakai Player: `handle` buram (mis. Object3D), `anchors` = posisi jangkar bernama. */
export interface LoadedModel<T = unknown> {
  handle: T;
  anchors: Record<string, [number, number, number]>;
}

export interface AssetLoaderOptions<T> {
  manifest: AssetManifest;
  /** Aset bawaan (prosedural) per peran. Wajib memuat semua jangkar manifest. */
  builtin: (role: string) => LoadedModel<T>;
  /** Memuat satu berkas model (mis. lewat GLTFLoader). Melempar bila gagal. */
  loadModel: (file: string) => Promise<LoadedModel<T>>;
  warn?: (message: string) => void;
}

/**
 * Pemuat aset menurut manifest. Sesi tidak pernah gagal karena aset:
 * `file: null`, berkas gagal dimuat, atau jangkar wajib hilang → aset bawaan + peringatan.
 */
export function createAssetLoader<T>(opts: AssetLoaderOptions<T>) {
  const warn = opts.warn ?? ((m: string) => console.warn(m));

  async function model(role: string): Promise<LoadedModel<T>> {
    const entry = opts.manifest.models[role];
    if (!entry) throw new Error(`peran model tidak ada di manifest: ${role}`);
    if (entry.file === null) return opts.builtin(role);
    try {
      const loaded = await opts.loadModel(entry.file);
      const missing = entry.anchors.filter((a) => !(a in loaded.anchors));
      if (missing.length) {
        warn(`[aset] ${role}: jangkar hilang (${missing.join(", ")}) di ${entry.file}; memakai aset bawaan`);
        return opts.builtin(role);
      }
      return loaded;
    } catch (e) {
      warn(`[aset] ${role}: gagal memuat ${entry.file} (${(e as Error).message}); memakai aset bawaan`);
      return opts.builtin(role);
    }
  }

  return { model };
}

/** Posisi jangkar bernama; interaksi menempel di sini, bukan pada geometri. */
export function anchor(model: LoadedModel, name: string): [number, number, number] {
  const p = model.anchors[name];
  if (!p) throw new Error(`jangkar tidak ada: ${name}`);
  return p;
}
