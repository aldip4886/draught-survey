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

/** L1 langkah 7-12: tabel hidrostatik dan koreksi sampai displacement terkoreksi. */
export const L1_HYDRO = {
  /** Dua baris tabel yang mengapit QM 10,338 m. MTC tidak ada di tabel L1. */
  table: [
    { draught: 10.3, displacement: 41200, tpc: 52.0, lcf: -2.8 },
    { draught: 10.4, displacement: 41720, tpc: 52.1, lcf: -2.9 },
  ],
  /** MTC pada sarat QM +-0,5 m, diberikan langsung oleh L1. */
  mtcPlus: 541.0,
  mtcMinus: 503.0,
  densityMeasured: 1.018,
  densityTable: 1.025,
  expected: {
    displacement: 41397.6,
    tpc: 52.038,
    lcf: -2.838,
    ftc: 41.43,
    stc: 2.69,
    displacementTrimCorrected: 41441.72,
    displacementDensityCorrected: 41158.7,
  },
} as const;
