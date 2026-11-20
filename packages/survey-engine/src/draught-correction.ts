import { roundTo } from "./round";

export interface SidePair {
  port: number;
  starboard: number;
}

export interface DraughtReadings {
  forward: SidePair;
  mid: SidePair;
  aft: SidePair;
}

export interface DraughtMarks {
  /** Jarak tanda haluan di belakang FP (m). */
  forwardAftOfFp: number;
  /** Jarak tanda buritan di depan AP (m). */
  aftForwardOfAp: number;
  /** Jarak tanda tengah di belakang midship (m); negatif bila di depan midship. */
  midAftOfMidship: number;
}

export interface DraughtCorrectionInput {
  /** Panjang antara FP dan AP (m). */
  lbp: number;
  marks: DraughtMarks;
  readings: DraughtReadings;
}

export type DeflectionKind = "hogging" | "sagging" | "none";

export interface DraughtCorrection {
  lbm: number;
  readMeans: { forward: number; mid: number; aft: number };
  apparentTrim: number;
  /** Sarat terkoreksi ke FP, AP, dan midship, dibulatkan ke mm (konvensi L1). */
  corrected: { forward: number; mid: number; aft: number };
  /** Trim sejati (buritan − haluan) dari sarat terkoreksi. Positif = trim buritan. */
  trueTrim: number;
  deflection: { kind: DeflectionKind; magnitude: number };
  quarterMean: number;
  /** Selisih kiri − kanan di tengah (m); dicatat untuk koreksi list. */
  listMid: number;
}

const mean = (p: SidePair) => (p.port + p.starboard) / 2;
const MM = 3;

/**
 * Koreksi sarat terbaca ke perpendikular, lalu hitung trim sejati,
 * hogging/sagging, dan quarter mean. Pembulatan ke mm di tiap sarat
 * terkoreksi mengikuti contoh rujukan L1.
 */
export function correctDraughts(input: DraughtCorrectionInput): DraughtCorrection {
  const { lbp, marks, readings } = input;
  const lbm = lbp - marks.forwardAftOfFp - marks.aftForwardOfAp;
  if (!(lbm > 0)) throw new Error(`LBM harus positif, diperoleh ${lbm}`);

  const readMeans = {
    forward: mean(readings.forward),
    mid: mean(readings.mid),
    aft: mean(readings.aft),
  };
  const apparentTrim = readMeans.aft - readMeans.forward;

  const corrected = {
    forward: roundTo(readMeans.forward - (apparentTrim * marks.forwardAftOfFp) / lbm, MM),
    aft: roundTo(readMeans.aft + (apparentTrim * marks.aftForwardOfAp) / lbm, MM),
    mid: roundTo(readMeans.mid - (apparentTrim * marks.midAftOfMidship) / lbm, MM),
  };

  const trueTrim = roundTo(corrected.aft - corrected.forward, MM);

  const fwdAftMean = (corrected.forward + corrected.aft) / 2;
  const diff = roundTo(fwdAftMean - corrected.mid, 4);
  const deflection: DraughtCorrection["deflection"] =
    diff > 0
      ? { kind: "hogging", magnitude: diff }
      : diff < 0
        ? { kind: "sagging", magnitude: -diff }
        : { kind: "none", magnitude: 0 };

  const quarterMean = roundTo((corrected.forward + corrected.aft + 6 * corrected.mid) / 8, MM);
  const listMid = roundTo(readings.mid.starboard - readings.mid.port, MM);

  return { lbm, readMeans, apparentTrim, corrected, trueTrim, deflection, quarterMean, listMid };
}
