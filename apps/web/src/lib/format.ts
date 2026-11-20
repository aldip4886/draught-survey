/**
 * Format Indonesia untuk tampilan: koma desimal, titik ribuan. Kode dan berkas data tetap memakai
 * titik desimal; konversi hanya di batas tampilan dan input.
 */
const LOCALE = "id-ID";

export function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** "+3,50" / "−3,50" untuk selisih bertanda. */
export function formatSigned(value: number, fractionDigits = 2): string {
  const s = formatNumber(Math.abs(value), fractionDigits);
  return value > 0 ? `+${s}` : value < 0 ? `−${s}` : s;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(date);
}

/**
 * Membaca angka yang diketik pengguna dengan format Indonesia ("10,12", "31.573,30") atau titik desimal polos.
 * Mengembalikan null bila bukan angka. Satu pemisah saja yang dianggap desimal.
 */
export function parseNumber(input: string): number | null {
  const s = input.trim().replace(/\s/g, "");
  if (s === "" || !/^[-+−]?[\d.,]+$/.test(s)) return null;
  const sign = s.startsWith("-") || s.startsWith("−") ? -1 : 1;
  const body = s.replace(/^[-+−]/, "");
  let normalized: string;
  if (body.includes(",")) {
    // koma = desimal; titik = ribuan
    if ((body.match(/,/g) ?? []).length > 1) return null;
    normalized = body.replace(/\./g, "").replace(",", ".");
  } else if ((body.match(/\./g) ?? []).length > 1) {
    // beberapa titik tanpa koma: ribuan ("1.234.567")
    if (!/^\d{1,3}(\.\d{3})+$/.test(body)) return null;
    normalized = body.replace(/\./g, "");
  } else {
    normalized = body; // satu titik: desimal gaya kode ("10.12")
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? sign * n : null;
}
