/**
 * Format angka dan tanggal untuk tampilan (koma desimal, titik ribuan).
 * Kode tetap memakai number dengan titik desimal; konversi hanya di batas UI.
 */

export function formatAngka(n: number, desimal = 2): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  }).format(n);
}

export function formatTanggal(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/**
 * Membaca angka yang diketik peserta.
 * - Ada koma: format Indonesia, koma = desimal, titik = ribuan ("31.573,30", "10,12").
 * - Tanpa koma, satu titik: titik desimal ("10.12", "1.018").
 * - Tanpa koma, beberapa titik: titik ribuan ("1.234.567").
 * Mengembalikan null bila tidak terbaca. Player menampilkan hasil bacaan agar peserta bisa memeriksa.
 */
export function parseAngka(raw: string): number | null {
  let s = raw.trim().replace(/\s/g, "").replace(/^\+/, "").replace(/^[−–]/, "-");
  if (s === "" || s === "-") return null;
  if (s.includes(",")) {
    if (s.indexOf(",") !== s.lastIndexOf(",")) return null;
    const [whole, frac] = s.split(",") as [string, string];
    if (whole.includes(".") && !/^-?\d{1,3}(\.\d{3})+$/.test(whole)) return null;
    s = `${whole.replace(/\./g, "")}.${frac}`;
  } else if ((s.match(/\./g) ?? []).length > 1) {
    if (!/^-?\d{1,3}(\.\d{3})+$/.test(s)) return null;
    s = s.replace(/\./g, "");
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}
