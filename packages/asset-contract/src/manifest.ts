import { z } from "zod";

const file = z.string().min(1).nullable();
const license = z.string();

export const modelEntrySchema = z.object({
  /** null = pakai aset bawaan (prosedural). */
  file,
  anchors: z.array(z.string().regex(/^anchor_/, "nama jangkar diawali anchor_")),
  polyBudget: z.number().int().positive(),
  license,
  /** Rentang sisi terpanjang model (m); menangkap kesalahan satuan (cm, inci). */
  maxExtentMeters: z.tuple([z.number().positive(), z.number().positive()]).optional(),
  /** Sumbu tempat sisi terpanjang harus berada (haluan ke −Z berarti "z"); menangkap kesalahan orientasi. */
  lengthAxis: z.enum(["x", "y", "z"]).optional(),
  /** Origin di baseline: sisi bawah model berada di y = 0. */
  baselineOrigin: z.boolean().optional(),
});

const mediaEntrySchema = z.object({ file, license });

export const manifestSchema = z.object({
  $comment: z.string().optional(),
  version: z.literal(1),
  units: z.literal("meter"),
  models: z.record(modelEntrySchema),
  textures: z.record(mediaEntrySchema),
  panoramas: z.record(mediaEntrySchema),
});

export type ModelEntry = z.infer<typeof modelEntrySchema>;
export type AssetManifest = z.infer<typeof manifestSchema>;
