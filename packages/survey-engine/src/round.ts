/** Pembulatan half-away-from-zero ke `dp` desimal, tahan galat floating point. */
export function roundTo(value: number, dp: number): number {
  const f = 10 ** dp;
  const scaled = value * f;
  const eps = Math.sign(scaled) * 1e-9;
  return Math.round(scaled + eps) / f;
}
