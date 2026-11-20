import type { Scenario } from "./schema";

/**
 * Data skenario yang boleh dikirim ke peserta: dokumen kapal, tabel, dan briefing,
 * tanpa nilai benar (sarat, densitas, sounding). Nilai benar tetap di server untuk penilaian.
 */
export interface PublicScenario {
  id: string;
  judul: string;
  kegiatan: Scenario["kegiatan"];
  briefing?: Scenario["briefing"];
  validasi: Scenario["validasi"];
  kapal: Scenario["kapal"];
  hidrostatik: Scenario["hidrostatik"];
  initial: Scenario["initial"];
  lingkungan: Scenario["lingkungan"];
  tangki: Array<Omit<Scenario["final"]["tangki"][number], "sounding">>;
}

export function toPublicScenario(s: Scenario): PublicScenario {
  return {
    id: s.id,
    judul: s.judul,
    kegiatan: s.kegiatan,
    briefing: s.briefing,
    validasi: s.validasi,
    kapal: s.kapal,
    hidrostatik: s.hidrostatik,
    initial: s.initial,
    lingkungan: s.lingkungan,
    tangki: s.final.tangki.map(({ sounding: _sounding, ...rest }) => rest),
  };
}
