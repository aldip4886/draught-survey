import { roundTo } from "./round";

/**
 * Fungsi gelombang deterministik: dua sinus bertumpuk (ombak utama + swell, air dalam).
 * Satu-satunya definisi; Player memakainya untuk air, perahu, dan kapal, dan mesin hitung
 * memakainya untuk menentukan nilai puncak-lembah yang dianggap benar.
 *
 * Konvensi sumbu (dunia dan kapal): +x ke haluan, +z ke sisi starboard, +y ke atas.
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

/** Tata letak komponen. Konstanta ini juga dicermin di shader air Player; ubah keduanya bersama. */
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

export interface HullDynamics {
  /** Setengah lebar kapal (m): lambung starboard di z = +halfBeam. */
  halfBeam: number;
  /** Porsi gerak air di pusat yang diikuti kapal sebagai heave. */
  heaveFactor: number;
  /** Porsi kemiringan permukaan air yang diikuti kapal sebagai roll dan pitch. */
  tiltFactor: number;
  /** Setengah jarak (m) untuk menaksir kemiringan permukaan sepanjang kapal. */
  slopeBase: number;
}

export const DEFAULT_HULL_DYNAMICS: HullDynamics = {
  halfBeam: 15,
  heaveFactor: 0.35,
  tiltFactor: 0.4,
  slopeBase: 30,
};

/**
 * Perpindahan vertikal titik lambung di (x, z) akibat heave, roll, dan pitch (sudut kecil).
 * Kapal ikut naik di sisi tempat air lebih tinggi, hanya sebagian (factor < 1).
 */
export function hullVerticalOffset(
  x: number,
  z: number,
  t: number,
  p: WaveParams,
  hull: HullDynamics = DEFAULT_HULL_DYNAMICS,
): number {
  const heave = hull.heaveFactor * waveHeight(0, 0, t, p);
  const roll =
    (hull.tiltFactor * (waveHeight(0, hull.halfBeam, t, p) - waveHeight(0, -hull.halfBeam, t, p))) /
    (2 * hull.halfBeam);
  const pitch =
    (hull.tiltFactor * (waveHeight(hull.slopeBase, 0, t, p) - waveHeight(-hull.slopeBase, 0, t, p))) /
    (2 * hull.slopeBase);
  return heave + roll * z + pitch * x;
}

/**
 * Tinggi garis air di lambung (m dari baseline) pada titik (x, z) dan waktu t.
 * `stillDraught` = sarat di air tenang pada titik itu.
 */
export function waterlineOnHull(
  stillDraught: number,
  x: number,
  z: number,
  t: number,
  p: WaveParams,
  hull: HullDynamics = DEFAULT_HULL_DYNAMICS,
): number {
  return stillDraught + waveHeight(x, z, t, p) - hullVerticalOffset(x, z, t, p, hull);
}

export interface PeakTroughOptions {
  /** Lama pengamatan (s). Bawaan 120 s. */
  window?: number;
  /** Langkah cuplikan (s). Bawaan 0,05 s. */
  step?: number;
  hull?: HullDynamics;
}

/**
 * Selisih antara rata-rata puncak-lembah garis air dan sarat air tenang di satu titik (m, mm).
 * Itu yang dibaca pembaca terlatih lebih (positif) atau kurang dari sarat air tenang.
 * Tidak bergantung pada sarat air tenang, hanya pada titik dan ombak.
 */
export function peakTroughBias(x: number, z: number, p: WaveParams, opts: PeakTroughOptions = {}): number {
  const window = opts.window ?? 120;
  const step = opts.step ?? 0.05;
  let max = -Infinity;
  let min = Infinity;
  for (let t = 0; t <= window; t += step) {
    const r = waterlineOnHull(0, x, z, t, p, opts.hull);
    if (r > max) max = r;
    if (r < min) min = r;
  }
  return roundTo((max + min) / 2, 3);
}

/** Nilai puncak-lembah yang dianggap benar di satu titik: sarat air tenang + bias. */
export function peakTroughReading(
  stillDraught: number,
  x: number,
  z: number,
  p: WaveParams,
  opts: PeakTroughOptions = {},
): number {
  return roundTo(stillDraught + peakTroughBias(x, z, p, opts), 3);
}

/** Sarat air tenang yang membuat nilai puncak-lembah di titik itu sama dengan `correctReading`. */
export function stillDraughtFor(
  correctReading: number,
  x: number,
  z: number,
  p: WaveParams,
  opts: PeakTroughOptions = {},
): number {
  return roundTo(correctReading - peakTroughBias(x, z, p, opts), 3);
}

export type MarkPosition = "forward" | "mid" | "aft";
export type Side = "port" | "starboard";

export interface MarkGeometry {
  lbp: number;
  forwardAftOfFp: number;
  aftForwardOfAp: number;
  midAftOfMidship: number;
  halfBeam: number;
}

/** Posisi (x, z) enam tanda sarat di lambung. +x ke haluan; starboard di z = +halfBeam. */
export function markPoint(g: MarkGeometry, position: MarkPosition, side: Side): { x: number; z: number } {
  const x =
    position === "forward"
      ? g.lbp / 2 - g.forwardAftOfFp
      : position === "aft"
        ? -g.lbp / 2 + g.aftForwardOfAp
        : -g.midAftOfMidship;
  return { x, z: side === "starboard" ? g.halfBeam : -g.halfBeam };
}
