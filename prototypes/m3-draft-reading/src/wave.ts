/**
 * Fungsi gelombang prototipe: dua komponen sinus (ombak + swell) pada air dalam.
 * Dipakai bersama oleh permukaan air (GLSL, lihat Water.tsx) dan gerak perahu/kapal (JS),
 * jadi keduanya selalu sepakat. Prototipe ini berdiri sendiri; fungsi gelombang
 * deterministik untuk mesin hitung dikerjakan di tiket engine (#10).
 */
export interface WaveParams {
  /** Amplitudo ombak utama (m). Swell memakai setengahnya. */
  amp: number;
  /** Periode ombak utama (s). Swell memakai 1,7 kali. */
  period: number;
}

export interface WaveComponent {
  a: number;
  omega: number;
  k: number;
  dx: number;
  dz: number;
  phase: number;
}

const G = 9.81;

/** Konstanta arah dan fase; harus sama dengan di shader. */
export const WAVE_LAYOUT = [
  { ampMul: 1, periodMul: 1, dir: [0.3, 1], phase: 0 },
  { ampMul: 0.5, periodMul: 1.7, dir: [-0.5, 1], phase: 1.3 },
] as const;

export function waveComponents(p: WaveParams): WaveComponent[] {
  return WAVE_LAYOUT.map((l) => {
    const omega = (2 * Math.PI) / (p.period * l.periodMul);
    const len = Math.hypot(l.dir[0], l.dir[1]);
    return {
      a: p.amp * l.ampMul,
      omega,
      k: (omega * omega) / G,
      dx: l.dir[0] / len,
      dz: l.dir[1] / len,
      phase: l.phase,
    };
  });
}

/** Tinggi permukaan air (m) di (x, z) pada waktu t (s). */
export function waveHeight(x: number, z: number, t: number, p: WaveParams): number {
  let h = 0;
  for (const c of waveComponents(p)) {
    h += c.a * Math.sin(c.k * (c.dx * x + c.dz * z) - c.omega * t + c.phase);
  }
  return h;
}
