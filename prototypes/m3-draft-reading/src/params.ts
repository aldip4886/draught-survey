/** Parameter yang bisa diubah tanpa build ulang: slider di layar atau query string (?amp=0.6&period=6). */
export interface Params {
  amp: number;
  period: number;
  /** Pengali tinggi angka tanda sarat (1 = 10 cm). */
  markScale: number;
  /** Sarat sebenarnya di air tenang (m). */
  trueDraught: number;
  /** Jarak perahu dari lambung (m). */
  boatDistance: number;
}

export const DEFAULTS: Params = { amp: 0.4, period: 6, markScale: 1, trueDraught: 10.33, boatDistance: 8 };

export const LIMITS: Record<keyof Params, { min: number; max: number; step: number; label: string }> = {
  amp: { min: 0, max: 1.5, step: 0.05, label: "Amplitudo ombak (m)" },
  period: { min: 2, max: 12, step: 0.5, label: "Periode ombak (s)" },
  markScale: { min: 0.5, max: 3, step: 0.1, label: "Ukuran tanda sarat (×)" },
  trueDraught: { min: 9, max: 12, step: 0.01, label: "Sarat sebenarnya (m)" },
  boatDistance: { min: 4, max: 20, step: 1, label: "Jarak perahu (m)" },
};

export function paramsFromQuery(search: string): Params {
  const q = new URLSearchParams(search);
  const map: Record<keyof Params, string> = {
    amp: "amp",
    period: "period",
    markScale: "scale",
    trueDraught: "draught",
    boatDistance: "dist",
  };
  const out = { ...DEFAULTS };
  for (const key of Object.keys(map) as (keyof Params)[]) {
    const raw = q.get(map[key]);
    const v = raw === null ? NaN : Number(raw);
    if (Number.isFinite(v)) out[key] = Math.min(LIMITS[key].max, Math.max(LIMITS[key].min, v));
  }
  return out;
}
