import { markPoint, type MarkGeometry, type MarkPosition, type Side } from "@draught-survey/survey-engine";

export interface MarkRange {
  /** Sarat terbawah dan teratas yang digambar (m dari baseline). */
  from: number;
  to: number;
  /** Jarak antar angka (m). Bawaan 0,2. */
  step?: number;
  /** Tinggi angka (m). Bawaan 0,1. */
  numeralHeight?: number;
}

export interface Numeral {
  /** Nilai sarat yang ditunjuk sisi bawah angka (m). */
  value: number;
  /** Tinggi sisi bawah dan atas angka dari baseline (m). */
  bottomY: number;
  topY: number;
}

/**
 * Tata letak angka tanda sarat dari data (bukan dari model): sisi bawah tiap angka
 * tepat di nilai sarat, dihitung dari baseline.
 */
export function numeralLayout(range: MarkRange): Numeral[] {
  const step = range.step ?? 0.2;
  const h = range.numeralHeight ?? 0.1;
  const out: Numeral[] = [];
  const first = Math.ceil(range.from / step - 1e-9);
  for (let i = first; i * step < range.to - 1e-9; i++) {
    const value = Math.round(i * step * 1000) / 1000;
    out.push({ value, bottomY: value, topY: Math.round((value + h) * 1000) / 1000 });
  }
  return out;
}

export interface MarkPlacement {
  position: MarkPosition;
  side: Side;
  /** Posisi pelat tanda di lambung (x memanjang kapal, +x haluan; z lintang). */
  x: number;
  z: number;
  numerals: Numeral[];
}

/** Enam pelat tanda sarat dari geometri kapal (template + skenario). */
export function draughtMarkPlacements(geometry: MarkGeometry, range: MarkRange): MarkPlacement[] {
  const positions: MarkPosition[] = ["forward", "mid", "aft"];
  const sides: Side[] = ["port", "starboard"];
  const numerals = numeralLayout(range);
  return positions.flatMap((position) =>
    sides.map((side) => ({ position, side, ...markPoint(geometry, position, side), numerals })),
  );
}
