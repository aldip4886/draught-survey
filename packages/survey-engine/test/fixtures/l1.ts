/**
 * Contoh rujukan Lampiran L1 kerangka materi (muatan 31.573,30 t).
 * Satu-satunya sumber angka L1; semua test engine mengimpor dari sini.
 */
export const L1 = {
  lbp: 180.0,
  /** Jarak tanda sarat dari garis acuan (m). */
  marks: { forwardAftOfFp: 3.0, aftForwardOfAp: 6.0, midAftOfMidship: 0.5 },
  readings: {
    forward: { port: 10.1, starboard: 10.14 },
    mid: { port: 10.31, starboard: 10.35 },
    aft: { port: 10.58, starboard: 10.62 },
  },
  expected: {
    lbm: 171.0,
    readMeans: { forward: 10.12, mid: 10.33, aft: 10.6 },
    apparentTrim: 0.48,
    corrected: { forward: 10.112, mid: 10.329, aft: 10.617 },
    trueTrim: 0.505,
    hoggingM: 0.0355,
    quarterMean: 10.338,
  },
} as const;
