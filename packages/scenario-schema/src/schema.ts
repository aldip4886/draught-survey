import { z } from "zod";

const positive = z.number().positive();
const sidePair = z.object({ port: z.number(), starboard: z.number() });

const hydroRow = z.object({
  sarat: positive,
  displacement: positive,
  tpc: positive,
  lcf: z.number(),
  mtc: positive,
});

const calibrationRow = z.object({ sounding: z.number().min(0), volume: z.number().min(0) });

const fluid = z.discriminatedUnion("jenis", [
  z.object({ jenis: z.literal("cairan"), densitas: positive }),
  z.object({
    jenis: z.literal("bahan-bakar"),
    densitas15: positive,
    suhu: z.number(),
    koefisienMuai: positive,
  }),
]);

const tank = z.object({
  id: z.string().min(1),
  kelompok: z.enum(["ballast", "freshWater", "fuel", "lubricant", "other"]),
  fluida: fluid,
  kalibrasi: z.array(calibrationRow).min(2),
  /** Nilai benar sounding (m). */
  sounding: z.number().min(0),
});

/**
 * Skema berkas skenario (PRD §4.1), bagian yang dipakai SKN-01.
 * Nilai benar hanya ada di berkas ini (spec Player MVP, "Sumber kebenaran").
 */
export const scenarioSchema = z
  .object({
    id: z.string().regex(/^SKN-\d{2}$/, "id berbentuk SKN-NN"),
    judul: z.string().min(1),
    kegiatan: z.enum(["muat", "bongkar"]),
    /** Penanda wajib: data sintetis belum divalidasi SME. */
    validasi: z.object({ smeValidated: z.boolean(), catatan: z.string().min(1) }),
    kapal: z.object({
      nama: z.string().min(1),
      lbp: positive,
      setengahLebar: positive,
      tanda: z.object({
        haluanDiBelakangFp: z.number().min(0),
        buritanDiDepanAp: z.number().min(0),
        /** Negatif bila tanda tengah di depan midship. */
        tengahDiBelakangMidship: z.number(),
      }),
      lightship: positive,
    }),
    hidrostatik: z.object({
      /** Densitas air yang dipakai tabel (t/m³), umumnya 1,025. */
      densitasTabel: positive,
      baris: z.array(hydroRow).min(2),
    }),
    initial: z.object({ constant: z.number() }),
    lingkungan: z.object({ ombak: z.object({ amplitudo: z.number().min(0), periode: positive }) }),
    final: z.object({
      /** Nilai benar yang akan dibaca peserta (rata-rata puncak-lembah) di enam titik. */
      sarat: z.object({ haluan: sidePair, tengah: sidePair, buritan: sidePair }),
      densitas: positive,
      tangki: z.array(tank).min(1),
    }),
  })
  .superRefine((s, ctx) => {
    const lbm = s.kapal.lbp - s.kapal.tanda.haluanDiBelakangFp - s.kapal.tanda.buritanDiDepanAp;
    if (!(lbm > 0)) ctx.addIssue({ code: "custom", path: ["kapal", "tanda"], message: "LBM harus positif" });

    const rows = [...s.hidrostatik.baris].sort((a, b) => a.sarat - b.sarat);
    for (let i = 1; i < rows.length; i++) {
      if (rows[i]!.sarat === rows[i - 1]!.sarat)
        ctx.addIssue({ code: "custom", path: ["hidrostatik", "baris"], message: "sarat tabel hidrostatik duplikat" });
      if (rows[i]!.displacement <= rows[i - 1]!.displacement)
        ctx.addIssue({
          code: "custom",
          path: ["hidrostatik", "baris"],
          message: "displacement harus naik terhadap sarat",
        });
    }

    s.final.tangki.forEach((t, i) => {
      const cal = [...t.kalibrasi].sort((a, b) => a.sounding - b.sounding);
      for (let j = 1; j < cal.length; j++)
        if (cal[j]!.volume < cal[j - 1]!.volume)
          ctx.addIssue({
            code: "custom",
            path: ["final", "tangki", i, "kalibrasi"],
            message: "volume tidak boleh turun terhadap sounding",
          });
      const max = cal[cal.length - 1]!.sounding;
      if (t.sounding > max)
        ctx.addIssue({
          code: "custom",
          path: ["final", "tangki", i, "sounding"],
          message: "sounding melampaui tabel kalibrasi",
        });
    });

    const ids = s.final.tangki.map((t) => t.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", path: ["final", "tangki"], message: "id tangki duplikat" });
  });

export type Scenario = z.infer<typeof scenarioSchema>;
